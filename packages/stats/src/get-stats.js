import { quickSelectFloat, MAD } from "./percentile.js"
import { zForP } from "./ppf.js"

export {getQuantiles, getTable}

function getQuantiles(ary, bonferonni = 1) {
	const N = ary.length - 1

	const q1i = N/4
	const medI = N/2
	const q3i = N*3/4

	// indices for the confidence interval for median
	const Z = zForP(1 - (.25 / bonferonni))
	// const Z = 2.58 // p=0.99
	// (length)(.5) +/– 1.96√(length)(.5)(1-.5)
	const lowI = N/2  - Z * Math.sqrt(N * .25)
	const highI = N/2  + Z * Math.sqrt(N * .25)

	const result = {q1: 0, lowCI: 0, median: 0, highCI: 0, q3: 0, MAD: 0}

	let last = 0

	// Quickselect mutates the array and leaves
	// the values smaller than the percentile
	// we look for in the left part.
	// So we use it in order, from smaller to
	// larger, bumping the lower bound, for optimal
	// perf. This is way faster than sorting the array
	// then picking the values for arrays larger than 5
	// items.
	// Depending on N and the bonferonni factor, the CI
	// interval may be larger than the interquartile range.
	const indices = [
		{k: 'q1', value: q1i}, 
		{k: 'lowCI', value: lowI}, 
		{k: 'median', value: medI}, 
		{k: 'highCI', value: highI}, 
		{k: 'q3', value: q3i}, 
	].sort((a,b) => a.value - b.value).forEach(({k, value}) =>{
		result[k] = quickSelectFloat(ary, value, last)
		last = value
	})
	result.MAD = MAD(ary, result.median)
	return result
}

function getTable(entries, collection, test)  {
    const result =[]
    for (let i = 0; i < entries.length; i++) {
        for (let j = i + 1; j < entries.length; j++) {
            const A = entries[i]
            const B = entries[j]
            result.push({
                axes: {
                    y: {name: A.name, index: i},
                    x: {name: B.name, index: j}
                },
                stats: test(A[collection], B[collection])
            })
        }
    }
    return result
}
