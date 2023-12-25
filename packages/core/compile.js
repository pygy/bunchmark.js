export {compiler, bake}

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
const ${result_uid} = [];
const ${now_id} = ${hasPerf ? "() => performance.now()" : "process.hrtime.bigint"}
`
const plainFooter = (result_uid) => `
return ${result_uid};
`

const N = "N_" + uid

const bakeTask = ({run, before = "", after = "", name}, beforeEach, afterEach, i) => `
${result_uid}[${i}] = async function(${N}){
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
${tasks.map((task, i) => bakeTask(task, beforeEach, afterEach, i)).join("")}
${footer(result_uid)}
	`
}

function compiler({tasks, prologue = "", beforeEach = "", afterEach = ""}) {
	const source = bake({tasks, prologue, beforeEach, afterEach, footer: plainFooter})
	const samplers = new Function(source)()

	return tasks.map(samplers)
}

