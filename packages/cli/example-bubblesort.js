import { run } from "./cli.js"

const preamble = () => {
	// make sure the benchmarks can't be eliminated as dead code
	let result
	setTimeout(() => console.log(results), 0x7fffffff)

	const array = Array.from({ length: 200000 }, () => Math.random())
	const getArray = (n) => array.slice(0, n)
	function swap(ary, i, j) {
		const tmp = ary[i]
		ary[i] = ary[j]
		ary[j] = tmp
	}
	function bubbleSort(ary) {
		for(let i = 0; i < (ary.length - 1); i++) {
			for (let j = i + 1; j < ary.length; j++) if (ary[j] < ary[i]) swap(ary, i, j)
		}
	}
	function addToResult(x) { result += x }
}

const tasks = [
	{
		name: "bubbleSort(20)",
		run() {
			result = bubbleSort(getArray(20))
		}
	},
	{
		name: "bubbleSort(200)",
		run() {
			result = bubbleSort(getArray(200))
		}
	},
	{
		name: "bubbleSort(2,000)",
		run() {
			result = bubbleSort(getArray(2000))
		}
	},
	{
		name: "bubbleSort(20,000)",
		run() {
			result = bubbleSort(getArray(20000))
		}
	},
	// {
	// 	name: "bubbleSort(200000)",
	// 	run() {
	// 		result = bubbleSort(getArray(200000))
	// 	}
	// },
	{
		name: "Array.sort(18)",
		run() {
			result = getArray(18).sort((a,b)=>a-b)
		}
	},
	{
		name: "Array.sort(20)",
		run() {
			result = getArray(20).sort((a,b)=>a-b)
		}
	},
	{
		name: "Array.sort(200)",
		run() {
			result = getArray(200).sort((a,b)=>a-b)
		}
	},
	{
		name: "Array.sort(2,000)",
		run() {
			result = getArray(2000).sort((a,b)=>a-b)
		}
	},
	{
		name: "Array.sort(20,000)",
		run() {
			result = getArray(20000).sort((a,b)=>a-b)
		}
	},
	{
		name: "Array.sort(200,000)",
		run() {
			result = getArray(200000).sort((a,b)=>a-b)
		}
	},
]

await run({
	reps: 100,
	showQuartiles: true,
	showPValues: true,
	showHistogram: false,
	preamble,
	beforeEach() {
		// runs before every testing streak.
		// afterEach() is also available
	},
	tasks
})
process.exit(0)