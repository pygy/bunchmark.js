import {shuffled} from "./shuffle.js"
import {median} from "./stats.js"
import {compilePlain, compileIframe} from "./compile.js"

export {compilePlain, compileIframe}
const delay = n => new Promise(f => setTimeout(f, n))
// N is the baseline repetition count for a run

async function findN(task, calibrationTargetDuration) {
	const {sample, results, calibrationResults} = task
  if (typeof sample !== 'function') debugger
	let N = 1
	for (;;) {
		const t = await sample(N)
		if (t > calibrationTargetDuration) {
			results.push(t / N)
			task.N = (N * calibrationTargetDuration / t)
			calibrationResults.push(task.N)
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


export async function run({tasks, reps, onTick}) {
	const calibrationRuns = 15
	const calibrationTargetDuration = 24 // in ms, was deemed good engonh one day, should revisit
	let i = 0
	while (i++ < reps()) {
		const sh = shuffled(tasks)
		if (i < calibrationRuns) {
			for(const task of tasks) {
				findN(task, calibrationTargetDuration)
			}
		} else {
			if (i === calibrationRuns) {
        // set the final iteration number for each task
        // we take the median of the calibration runs.
				for(const task of tasks) {
					task.N = median(task.calibrationResults)
				}
			}
      
			for (const j in sh) {
				await runOne(sh[j])
			}
		}
		onTick({i: i - 1, reps, tasks})
		await delay(0)
	}
	return tasks.map(({name, N, results}) => ({name, N, results}))
}
