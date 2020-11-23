export {compileIframe, compilePlain}

function stringify(x) {
	for (const name in x) {
		x = x[name]
		if (typeof x === "string") return x
		if (typeof x !== "function") throw new TypeError(`string or function expected for ${name}, got ${typeof x}`)
		const source = x.toString()
		return source.slice(source.indexOf("{") + 1, source.lastIndexOf("}"))
		
	}
}

const randStr = () => (Math.random() * 0x7fffffff | 0).toString(36)
const uid = [randStr(),randStr(),randStr(),randStr()].join("_")
const result_uid = `result_${uid}`
const now_id = `now_${uid}`
const hasPerf = typeof performance !== "undefined"
const header = `
const ${result_uid} = {};
const ${now_id} = ${hasPerf ? "() => performance.now()" : "process.hrtime.bigint"}
`
const plainFooter = (result_uid) => `
return ${result_uid};
`

const N = "N_" + uid

const bakeTask = ({run, before = "", after = "", name}, beforeEach, afterEach) => `
${result_uid}[${JSON.stringify(name)}] = async function(${N}){
	${stringify({beforeEach})};
	${stringify({before})};
	const t1 = ${now_id}()
	while (${N}--) {
${stringify({run})}
	}
	const t2 = ${now_id}()
	${stringify({after})};
	${stringify({afterEach})};
	return Number(t2 - t1)${hasPerf ? "" : " / 1e6"}
};
	`


export function bake({tasks, prologue = "", beforeEach = "", afterEach = "", footer}) {
	return `
${stringify({prologue})};
${header};
${tasks.map(task => bakeTask(task, beforeEach, afterEach)).join("")}
${footer(result_uid)}
	`
}

function compilePlain({tasks, prologue = "", beforeEach = "", afterEach = ""}) {
	const source = bake({tasks, prologue, beforeEach, afterEach, footer: plainFooter})
	const samplers = new Function(source)()

	return tasks.map(t=>({
		...t,
		results: [],
		N: null,
		sample: samplers[t.name]
	}))
}

const isBrowser = typeof document !== "undefined"
const {sanitizer, ifr} = isBrowser && {
	sanitizer: document.createElement("div"),
	ifr: (ifr => (ifr.style="display:none", ifr.sandbox = "allow-scripts", ifr))(document.createElement("iframe"))
}

// closes every tag so that the HTML can be prepended to the scripts.
function sanitizeHTML(txt) {
	sanitizer.innerHTML = txt
	return sanitizer.innerHTML
}

// https://html.spec.whatwg.org/multipage/scripting.html#restrictions-for-contents-of-script-elements
function sanitizeScript(txt) {
	return txt.replace(/<(!--|script|\/script)/i, "<\\$1")
}

const iframeFooter = result_uid => `
window.addEventListener("message", ({origin, data: {name, N}}) => {
	if (origin === ${JSON.stringify(window.location.origin)}) {
		${result_uid}[name](N).then(time => {
			window.parent.postMessage({name, time, ${result_uid}: 1}, ${JSON.stringify(window.location.origin)})
		}).catch(({stack, message}) => {
			window.parent.postMessage({name, stack, message, ${result_uid}: 1}, ${JSON.stringify(window.location.origin)})
		})
	}
})
`

function compileIframe({tasks, prologue = "", beforeEach = "", afterEach = "", html = ""}) {
	if (ifr.parent == null) document.body.appendChild(ifr)
	ifr.srcdoc = `
<!doctype html>
<meta charset="utf8"><title>Bunchmark sandbox</title>
${sanitizeHTML(html)}
<script type=module>
${sanitizeScript(bake({tasks, prologue, beforeEach, afterEach, footer: iframeFooter}))}
</script>
`
	return new Promise(fulfill => {
		ifr.onload = () => {
			fulfill(tasks.map(t => ({
				...t,
				results: [],
				N: null,
				sample: N => {
					return new Promise((fulfill_, reject_) => {
						window.addEventListener("message", function handler({data}) {
							window.removeEventListener("message", handler)
							if (data[result_uid] === 1 && data.name === t.name) {
								if ("time" in data) fulfill_(data.time)
								else {
									const {name, message, stack} = data
									reject_({name, message, stack})
								}
							}
						})
						ifr.contentWindow.postMessage({name: t.name, N}, "*")
					})
				}
			})))
		}
	})
}
