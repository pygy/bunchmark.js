export const getRanks = (quantiles) => {
    quantiles = quantiles.map((q, i)=> ({i, ...q})).sort((a, b) => a.median - b.median)
    const result = Array.from(quantiles, (_, i) => ({rank: i, text: "", tied: false, ratio: 1}))
    if(result.length > 1) {
        const firstTied = quantiles[0].highCI > quantiles[1].lowCI
        let best
        quantiles.forEach((q, i) => {
            result[q.i].rank = i
            if (i === 0) {
                result[q.i].text = "the fastest" + (firstTied ? " (tied)" : "")
                result[q.i].tied = firstTied
                best = q.median
            } else {
                const tied = firstTied && quantiles[0].highCI > q.lowCI
                const ratio = q.median / best
                result[q.i].text = `runs ${(ratio).toPrecision(3)} × as long` + (tied ? "(tied)" : "")
                result[q.i].tied = tied
                result[q.i].ratio = ratio
            }
        })
    }
    return result
}
