import {shuffled} from "./shuffle.js"
import {compilePlain, compileIframe} from "./compile.js"
export {compilePlain, compileIframe}
const delay = n => new Promise(f => setTimeout(f, n))
// N is the baseline repetition count for a run
async function findN(sample, duration) {
	let N = 1
	for (;;) {
		const t = await sample(N)
		if (t > duration) {
			N = (N * duration / t)
			break
		} else {
			N *= 2
		}
	}
	return N
}

async function runOne({sample, N, results}) {
	// When using a fixed number of repetitions we can end up with
	// a striped timing distribution (depending on timer resolution),
	// so we use a random multiplier to spread out the measurements.
	// We sample uniformly in log space between 1 and 2.
	// Given that we also plot in log space this seems reasonable.

	const mul = 2**(1 + Math.random()) / 2
	const reps = N * mul | 0
	results.push(await sample(reps) / reps)
}

export async function calibrate({tasks, reps = 16, duration = 24, onTick}) {
	tasks.forEach(t=>t.N = 1)
	for (let i = 0; i < reps; i++) {
		onTick(i)
		const sh = shuffled(tasks)
		for (const j in sh) {
			const t = sh[j]
			const k = 1 / (j + 1)
			const l = 1 - k
			const lastN = await findN(t.sample, duration)
			// running geometric mean
			t.N = i === 0 ?  lastN: Math.exp(Math.log(t.N) * l + Math.log(lastN) * k)
		}
		await delay(0)
	}
	for (const i in tasks) tasks[i].N = (tasks[i].N | 0) + 1
}

export async function run({tasks, reps, onTick}) {
	let i = 0
	while (i++ < reps()) {
		const sh = shuffled(tasks)
		for (const j in sh) {
			await runOne(sh[j])
		}
		onTick({i: i - 1, reps, tasks})
		await delay(0)
	}
	return tasks.map(({name, N, results}) => ({name, N, results}))
}
