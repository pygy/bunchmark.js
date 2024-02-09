export {getBins, getBounds, QNDMedian}


const QNDMedian = ary => {
	ary.sort((a,b)=>{a-b})
	if (ary.length % 2) return ary[(ary.length - 1)/2]
	else return (ary[(ary.length)/2-1] + ary[(ary.length)/2])/2
}
const {
	exp: mexp,
	floor: mfloor,
	log: mlog,
	max: mmax,
	min: mmin,
	round: mround,
} = Math

function getBounds(entries) {
	const min = mmin(...entries.map(e => mmin(...e.workspace)))
	const max = mmax(...entries.map(e => mmax(...e.workspace)))
	return {min, max}
}

function getBins(entries, quantiles, maxN) {
	const {max, min} = getBounds(entries)
	let minHamBound = 1/0
	let maxHamBound = -1/0
	let largestIQR = -1/0
	quantiles.forEach(q => {
		// find the non-outlier bounds using the IQR
		// method. Given the data distribution,
		// we work in log space as we do for the rest.
		const lq1 = mlog(q.q1)
		const lq3 = mlog(q.q3)
		const logIQR = lq3 - lq1

		largestIQR = mmax(logIQR, largestIQR)
		const scaleFactor = 1.75
		minHamBound = mmin(minHamBound, mexp(lq1 - scaleFactor * logIQR))
		maxHamBound = mmax(maxHamBound, mexp(lq3 + scaleFactor * logIQR))
	})
	const N = entries[0].workspace.length
	// one bin per 10 points in the IQR
	// (half of N are, per the IQR definition)
	const binWidth = largestIQR / mmax(N / 2 / 10, 1)
	const span = mlog(maxHamBound)-mlog(minHamBound)
	const numBins = mmin(span / binWidth, maxN)

	return addBins(
		entries,
		mround(numBins),
		// gradually shift from the whole data set
		// to only the non-spam data points.
		interpolate(min, minHamBound, N, 30),
		interpolate(max, maxHamBound, N, 30),
	)
}

function interpolate(exact, ham, n, max) {
	n = mmin(n, max)
	p = n/max
	return (1 - p) * exact + p * ham
}


function addBins(entries, N, min, max) {
	const bounds = Array.from({length: N})
	const mul = (max/min)**(1/N)
	const amplitude = min - max
	let from = min
	for (let i = 0; i < N; i++) {
		bounds[i] = {from, to : (from *= mul)}
	}

	const result = {
		min, max, N, bounds,
		bins: Array.from(
			entries,
			e => bounds.map(
				({from, to}, i) => {

					return e.workspace.reduce((acc, res) => acc + (from < res && res <= to), 0)
				}
			)
		),
		bins2: Array.from(entries, ()=>Array.from(bounds, ()=>0))
	}

	entries.forEach((e, i) => {
		e.workspace.forEach(res => {
			result.bins2[i][mfloor((res - min)/amplitude)]++
		})
	})
	return result
}
