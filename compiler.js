
const randStr = () => (Math.random() * 0x7fffffff | 0).toString(36)
const uid = randStr() + randStr() + randStr() + randStr()
const header = `
var result_${uid} = {}
`
const footer = `
return result_${uid}
`

const N = "N_" + uid

const compileTask = ({run, before = "", after = "", name}, beforeEach, afterEach) => `
result_${uid}[${JSON.stringify(name)}] = function(${N}){
	${stringify({beforeEach})};
	${stringify({before})};
	var t1 = performance.now()
	while (${N}--) {
${stringify({run})}
	}
	var t2 = performance.now()
	${stringify({after})};
	${stringify({afterEach})};
	return t2 - t1
};
	`

export function compile(tasks, {prologue, deps, beforeEach, afterEach}) {
	let source = `
	${header};
	${stringify({prologue})};
	`
	
	tasks.forEach(task => {
		source += compileTask(task, beforeEach, afterEach)
	})

	source += footer
	const paramNames = Object.keys(deps)
	const paramValues = Object.values(deps)
	// p(source)
	const samplers = new Function(...paramNames, source)(...paramValues)
	tasks.forEach(t=>t.sample = samplers[t.name])
}

function stringify(x) {
	for (const name in x) {
		x = x[name]
		if (typeof x === "string") return x
		if (typeof x !== "function") throw new TypeError(`string or function expected for ${name}, got ${typeof x}`)
		const source = x.toString()
		return source.slice(source.indexOf("{") + 1, source.lastIndexOf("}"))
		
	}
}
