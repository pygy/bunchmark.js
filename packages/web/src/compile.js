export { compiler, iframeSandbox }

import { bake } from "@bunchmark/core"

function compiler({ tasks, preamble = "", beforeEach = "", afterEach = "", html = "" }) {
	setIframeSrc(html, bake({ tasks, preamble, beforeEach, afterEach, footer: iframeFooter }))

	const samplers = getSamplers(tasks)
	return new Promise(fulfill => {
		iframeSandbox.onload = () => {
			fulfill(samplers)
		}
	})
}

const iframeSandbox = document.createElement("iframe")
iframeSandbox.sandbox = "allow-scripts"

// https://html.spec.whatwg.org/multipage/scripting.html#restrictions-for-contents-of-script-elements
function sanitizeScript(txt) {
	return txt.replace(/<(?=!--|script|\/script)/i, "\\x3ce")
}

// closes every tag so that the HTML can be prepended to the scripts.
const sanitizer = document.createElement("div")
function sanitizeHTML(txt) {
	sanitizer.innerHTML = txt
	return sanitizer.innerHTML
}
//`secret` prevents sandboxed code from sending messages to the harness in the parent.
let secret
const iframeFooter = result_uid => {
	secret = result_uid
	const origin = JSON.stringify(window.location.origin);
	return `
window.addEventListener("message", ({origin, data: {index, N}}) => {
	if (origin === ${origin}) {
		const secret = ${JSON.stringify(secret)}
		${result_uid}[index](N).then(time => {
			window.parent.postMessage({name, time, index}, ${origin})
		}).catch((error) => {
		const t = typeof error
		  error = (error instanceof Error || t !== 'symbol' && t !== 'object' || error === null) ? error : ""
			window.parent.postMessage({index, error}, ${origin})
		})
	}
})
`}

function setIframeSrc(html, scriptSrc) {
	if (iframeSandbox.parentElement == null) {
		iframeSandbox.style = "display:none"
		document.body.appendChild(iframeSandbox)
	}
	const origin = JSON.stringify(window.location.origin);

	iframeSandbox.srcdoc = `
<!doctype html>
<meta charset="utf8"><title>Bunchmark sandbox</title>
<script>window.addEventListener('error', (e) => {
	const secret = ${JSON.stringify(secret)}
	e.preventDefault()
	const {error} = e
	window.parent.postMessage({loadError: true, error, secret}, ${origin})
})
${sanitizeHTML(html)}
<script type=module>
${sanitizeScript(scriptSrc)}
</script>
`
}

function getSamplers(tasks) {
	return tasks.map((t, index) => N => {
		return new Promise((fulfill_, reject_) => {
			window.addEventListener("message", function handler(ev) {
				const { data } = ev
				if (data.secret === secret) {
					window.removeEventListener("message", handler)
					if (data.index === index) {
						if ("time" in data) fulfill_(data.time)
						else {
							const { error } = data
							reject_(Object.assign(error, { taskId: index }));
						}
					} else {
						console.warn("out of time message");
					}	
				}
			})
			iframeSandbox.contentWindow.postMessage({ index, N }, "*")
		})
	})
}
