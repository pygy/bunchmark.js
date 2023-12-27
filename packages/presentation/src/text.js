const {round} = Math

export function prensentStats(stats, runs) {
	return 	{	
		q1: scientific(stats.q1/1000) + 's',
		"median [95%CI]": `${scientific(stats.median/1000)}s [${scientific(stats.lowCI/1000) + 's'}, ${scientific(stats.q3/1000) + 's'}]`,
		q3: scientific(stats.q3/1000) + 's',
		MAD: scientific(stats.MAD/1000) + 's',
		"MAD/median": Math.floor(stats.MAD / (stats.median) * 1000)/10 + "%",
		runs
	}
}

export function scientific(num) {
	// TODO? handle big numbers?
	if (num > 1) return num.toPrecision(3)
	// num = num / 1000
	let i = 0;

	while (num * 10**(++i) < 100);
	const rem = i % 3
	const mantissa = round(num * 10**i) / 10**rem
	return `${mantissa}e${-(i-rem)}`
}
