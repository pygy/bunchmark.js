import {pForZ} from "./z-table.js"

// Simplified Mann Witney test
// - always two tailed
// - continuity correction
// - p-value computed using the asymptotic method
// Inspired by the second method found in https://en.wikipedia.org/w/index.php?title=Mann%E2%80%93Whitney_U_test&oldid=1188631305#Calculations 
//   and sci-py for the tie correction of the variance computation

export function mwu(A, B) {
    return mwUonSortedArrays(A.slice(0).sort(),B.slice(0).sort())
}

export function mwUonSortedArrays(A,B) {
	const Na = A.length
    const Nb = B.length
	const Nab = Na + Nb
    const NNab = Na * Nb
	let a, b, Ai = 0, Bi = 0, RSa = 0, countA = 0, RSb = 0, countB = 0, ties = 1, tie_term = 0, rank = 0
    const Ca = [], Cb = []
    for (let i = 0; i < Nab; i++) {
        const a = A[Ai] ?? 1/0, b = B[Bi] ?? 1/0
        if (a < b) {
            if (ties === 1) rank = i + 1
            else rank += .5
            countA++
            Ai++
            if (a === A[Ai]) {
                ties++
                continue
            }
        } else {
            if (ties === 1) rank = i + 1
            else rank += .5
            countB++
            Bi++
            if (a === b || b === B[Bi]) {
                ties++
                continue
            }
        }
        Array.from({length: countA}).forEach(()=>Ca.push(rank))
        Array.from({length: countB}).forEach(()=>Cb.push(rank))
        RSa += countA * rank
        RSb += countB * rank
        tie_term += ties**3 - ties
        ties = 1
        countA = countB = rank = 0
    }

	const Ua = RSa - (Na * (Na + 1)) / 2
    const Ub = NNab - Ua
    const U = Math.max(Ua, Ub)
	// determine the p-value using the asymptotic method with tie correction
    // 1) get the mean and std dev
	const mu = NNab / 2
	const s = Math.sqrt(NNab/12 * (Nab+1 - tie_term/(Nab*(Nab-1))))
	// 2) compute the z statistic
	const z = (U - mu - 0.5) / s // -0.5 for continuity correction
    // 3) get the corresponding p-value
	const p = pForZ(-z, true) * 2 // * 2 because two tails
	return {U, z, p}
}


function checkTies(set, key, v) {
	if (set[key]) set[key].push(v)
	else set[key] = [v]
	return v
}

export function mwUnaive(A, B) {
	const Na = A.length
    const Nb = B.length
	const Nab = Na + Nb
    const NNab = Na * Nb

    const ties = {}
	const AB = A.map(v => checkTies(ties, v, {v, from: 0, rank: 0}))
        .concat(B.map(v => checkTies(ties, v,{v, from: 1, rank: 0})))
        .sort(((a, b) => a.v - b.v))

	AB.forEach((x,i) => {
		x.rank = i + 1
	})

	for (const tied of Object.values(ties)) if (tied.length != 1) {
        let rankAverage = tied.reduce((sum, x) => sum + x.rank, 0) / tied.length
        tied.forEach(x => x.rank = rankAverage)
	}

	const RSa = AB.reduce((res, x) => {
        return res + (x.from === 0 ? x.rank : 0)
	}, 0)

    const Ua = RSa - (Na * (Na + 1)) / 2
    const Ub = NNab - Ua
    const U = Math.max(Ua, Ub)

	// determine the p-value using the asymptotic method with tie correction
    // 1) get the mean and std dev
	const mu = NNab / 2
    const tie_term = Object.values(ties).reduce((sum, {length: t}) => sum + (t**3 - t), 0)
	const s = Math.sqrt(NNab/12 * (Nab+1 - tie_term/(Nab*(Nab-1))))
	// 2) compute the z statistic
	const z = (U - mu - 0.5) / s // -0.5 for continuity correction
    // 3) get the corresponding p-value
	const p = pForZ(-z) * 2 // * 2 because two tails
	return {U, z, p}
}
