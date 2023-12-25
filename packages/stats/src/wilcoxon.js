import {pForZ} from "./z-table.js"
export {wilcoxon, wilcoxon_raw}
const {abs, min, sqrt} = Math

// Feateure-limited Wilcoxon ranked test
// - two sided
// - Pratt signed-rank zero procedure
// - asymptotic p-value estimation (can't be used when N < 10)
// This is based on https://en.wikipedia.org/wiki/Wilcoxon_signed-rank_test#Ties and scipy.stats.wilcoxon

function wilcoxon(A, B) {
	// single array
	if (B === void 0) return wilcoxon_raw(A.slice().sort((a,b)=> abs(a)-abs(b)))
	// two arrays
	if (A.length !== B.length) throw new RangeError("Both arrays must have the same size")
	return wilcoxon_raw(A.map((a, i) => a - B[i]).sort((a,b)=> abs(a)-abs(b)))
}

// expects an array of number sorted by their absolute values
function wilcoxon_raw(diff) {
	const N = diff.length
	// rank sums
	let Rneg = 0, Rpos = 0
	// other variables
	let Nzeros = 0, tie_term = 0, x
	for(let i = 0; (x = diff[i], i++ < N);) {
		if (x === 0) {
			Nzeros ++
			while (i < N && diff[i] === 0) {
				Nzeros++
				i++
			}
			// zeros are not counted in the tie term
		} else  {
			let Nneg = (x < 0)|0
			let Npos = (x > 0)|0
			let rank = i

			// Mid-rank procedure for ties
			while (i < N && abs(x) === abs(x = diff[i])) {
				Nneg += (x < 0)|0
				Npos += (x > 0)|0
				rank += 0.5
				i++
			}
			Rneg += rank * Nneg
			Rpos += rank * Npos
			const ties = Nneg + Npos
			tie_term += ties**3 - ties
		}
	}
	const T = min(Rneg, Rpos)
	// adjust the mean and sd for zeroes and ties
	const m = (N * (N + 1) - (Nzeros * (Nzeros + 1))) * 0.25
	const sd = sqrt((
		N * (N + 1) * (2 * N + 1) 
		- (Nzeros * (Nzeros + 1) * (2 * Nzeros + 1)) // zeroes
		- (0.5 * tie_term) // ties
	)/24)
	const sign = T - m < 0 ? -1 : 1
	const z = (T - m - sign * 0.5) / sd
	const p = pForZ(-abs(z)) * 2
	return {T, z, p}
}
