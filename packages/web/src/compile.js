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
let result_uid
const iframeFooter = _result_uid => {
	result_uid = _result_uid;
	return `
window.addEventListener("message", ({origin, data: {index, N}}) => {
	if (origin === ${JSON.stringify(window.location.origin)}) {
		${result_uid}[index](N).then(time => {
			window.parent.postMessage({name, time, index}, ${JSON.stringify(window.location.origin)})
		}).catch(({stack, message}) => {
			window.parent.postMessage({index, stack, message, ${result_uid}: 1}, ${JSON.stringify(window.location.origin)})
		})
	}
})
`}

function setIframeSrc(html, scriptSrc) {
	if (iframeSandbox.parentElement == null) {
		iframeSandbox.style = "display:none"
		document.body.appendChild(iframeSandbox)
	}
	iframeSandbox.srcdoc = `
<!doctype html>
<meta charset="utf8"><title>Bunchmark sandbox</title>
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
				window.removeEventListener("message", handler)
				if (data.index === index) {
					if ("time" in data) fulfill_(data.time)
					else {
						const { message, stack } = data
						reject_({ name: t.name, message, stack })
					}
				}
			})
			iframeSandbox.contentWindow.postMessage({ index, N }, "*")
		})
	})
}
