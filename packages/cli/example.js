import { run } from "./cli.js"

const preamble = () => {
	// make sure the benchmarks can't be eliminated as dead code
	let result
	setTimeout(() => console.log(results), 0x7fffffff)

	const array = Array.from({ length: 20000 }, () => Math.random())
	const getArray = (n) => array.slice(0, n)

	function addToResult(x) { result += x }
}

const tasks = [
	{
		name: "for(let i = 0; i < ary.length ...",
		run() {
			const array = getArray(2000)
			for (let i = 0; i < array.length; i++) result += array[i]
		}
	},
	{
		name: "array.forEach(addToResult)",
		run() {
			const array = getArray(2000)
			array.forEach(addToResult)
		}
	},
	{
		name: "array.forEach((x)=>{result += x})",
		run() {
			const array = getArray(2000)
			array.forEach((x) => { result += x })
		}
	},

	{
		name: "for (const i in ary)",
		run() {
			const array = getArray(2000)
			for (const i in array) result += array[i]
		}
	},
	{
		name: "for (const x of ary)",
		run() {
			const array = getArray(2000)
			for (const x of array) result += x
		}
	},
]

await run({
	reps: 100,
	showQuartiles: true,
	preamble,
	beforeEach() {
		// runs before every testing streak.
		// afterEach() is also available
	},
	tasks
})
process.exit(0)