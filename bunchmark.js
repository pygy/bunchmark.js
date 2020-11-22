import {shuffled} from "./shuffle.js"
import {compilePlain, compileIframe} from "./compile.js"
export {compilePlain, compileIframe}
export {stats} from "./stats.js"
const delay = n => new Promise(f => setTimeout(f, n))
// N is the baseline repetition count for a run
async function findN(sample) {
	let N = 1
	for (;;) {
		const t = await sample(N)
		if (t > 24) {
			N = (N * 24 / t) | 0
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

export async function calibrate({tasks, onCalibrationTick}) {
	const reps = 16
	tasks.forEach(t=>t.N = 0)
	for (let i = 0; i < reps; i++) {
		onCalibrationTick(i)
		const sh = shuffled(tasks)
		for (const i in sh) {
			const t = sh[i]
			t.N = Math.max(t.N, await findN(t.sample))
		}
		await delay(0)
	}
}

export async function run({tasks, reps, onRunTick}) {
	let i = 0
	while (i++ < reps()) {
		onRunTick(i)
		const sh = shuffled(tasks)
		for (const i in sh) {
			await runOne(sh[i])
		}
		
		await delay(0)
	}
	return tasks.map(({name, N, results}) => ({name, N, results}))
}


export async function bunchmark({
	tasks,
	reps = 100,
	prologue = "",
	beforeEach = "",
	afterEach = "",
	displayEvery = 10,
	onDisplayUpdate = () => {},
	beforeCalibration = () => {},
	onCalibrationTick = () => {},
	onCalibrationDone = () => {},
	beforeRunning = () => {},
	onRunTick = () => {},
}) {
	tasks = await compilePlain({
		tasks: Object.entries(tasks).map(([name, v]) => ({
			...v,
			name
		})),
		prologue,
		beforeEach,
		afterEach
	})
	beforeCalibration({reps})
	return calibrate({tasks, onCalibrationTick}).then(() => {
		onCalibrationDone()
		beforeRunning({reps, displayEvery})
		return run({tasks, reps(){return reps}, onRunTick(i) {
			onRunTick(i)
			if (i % displayEvery === 0) onDisplayUpdate({
				reps,
				i, 
				tasks: tasks.map(({name, N, results}) => ({name, N, results}))
			})
		}})
	})
}
