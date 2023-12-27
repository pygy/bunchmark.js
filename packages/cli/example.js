import { run } from "./cli.js"

const preamble = () => {
	// make sure the benchmarks can't be eliminated as dead code
	let result// @ts-ignore
	setTimeout(() => console.log(results), 0x7fffffff)

	const array = Array.from({ length: 20000 }).map(() => Math.random())
	const getArray = (n) => array.slice(0, n)

	function addToResult(x) { result += x }

}

const tasks = [
	{
		name: "for(let i = 0; i < ary.length ...",
		run() {// @ts-ignore
			const array = getArray(2000)// @ts-ignore
			for (let i = 0; i < array.length; i++) result += array[i]
		}
	},
	{
		name: "array.forEach(addToResult)",
		run() {// @ts-ignore
			const array = getArray(2000)// @ts-ignore
			array.forEach(addToResult)
		}
	},
	{
		name: "array.forEach((x)=>{result += x})",
		run() {// @ts-ignore
			const array = getArray(2000)// @ts-ignore
			array.forEach((x) => { result += x })
		}
	},

	{
		name: "for (const i in ary)",
		run() {// @ts-ignore
			const array = getArray(2000)// @ts-ignore
			for (const i in array) result += array[i]
		}
	},
	{
		name: "for (const x of ary)",
		run() {// @ts-ignore
			const array = getArray(2000)// @ts-ignore
			for (const x of array) result += x
		}
	},
]

await run({
	reps: 100,
	showQuartiles:true,
	preamble,
	beforeEach() {
		// @ts-ignore
		result = 4
	},
	tasks: Object.keys(tasks).map(name => ({
		name, ...tasks[name]
	})),
})
process.exit(0)