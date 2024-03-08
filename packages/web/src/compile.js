export { compiler, iframeSandbox }

import { bake } from "@bunchmark/core"

function compiler({ tasks, preamble = "", beforeEach = "", afterEach = "", html = "" }) {
	setIframeSrc(html, bake({ tasks, preamble, beforeEach, afterEach, footer: iframeFooter }))

	const samplers = getSamplers(tasks)
	return new Promise((fulfill, reject) => {
		window.addEventListener("message", function handler(ev) {
			const { data } = ev
			if (data.secret === secret) {
				window.removeEventListener("message", handler)
        if(data.success) fulfill(samplers)
        else {
          iframeSandbox.srcdoc = ''
          reject(data.error)
        }
			}
		})
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
			window.parent.postMessage({name, time, index, secret}, ${origin})
		}).catch((error) => {
		const t = typeof error
		  error = (error instanceof Error || t !== 'symbol' && t !== 'object' || error === null) ? error : ""
			window.parent.postMessage({index, error, secret}, ${origin})
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
<body>
<script>
{
document.scripts[0].remove()
const {
	document: {documentElement, body: {prepend, remove}, createElement}, 
	parent, parent: {postMessage}
} = window
const {assign} = Object
const call = atob.call.bind(atob.call)

let threw = false
const secret = ${JSON.stringify(secret)}
window.addEventListener('error', (e) => {
	threw = true
	e.preventDefault()
	const {error} = e
	call(postMessage, parent, {success: false, error, secret}, ${origin})
}, {once: true})

window.addEventListener('load', ()=>{
	call(prepend, documentElement, 
		assign(
			call(createElement, document, 'script'),
			{
				call,
				remove,
				onload(){
					if (!threw) call(postMessage, parent, {success: true, secret}, ${origin})
				},
        src: "data:text/javascript;base64," +${JSON.stringify(btoa(
          "{const s = document.scripts[0];const {call, remove} = s;call(remove, s) };\n"+
          scriptSrc
        ))},
				type: "module",
			}
		)
	)
})
}
</script>
${sanitizeHTML(html)}
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
