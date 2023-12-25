import {shuffled} from "./shuffle.js"
import {median} from "./stats.js"

export {compile, run}

function Task(t, sample) {
	return {
		...t,
		results: [],
		chronological: [],
		N: null,
		calibrationResults: [],
		sample
	}
}

async function compile(tasks, compiler) {
	const samplers = await compiler(tasks)
	return tasks.map((t, i) => Task(t, samplers[i]))
}

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

async function runOne({sample, N, results, chronological}) {
	// When using a fixed number of repetitions we can end up with
	// a striped timing distribution (depending on timer resolution),
	// so we use a random multiplier to spread out the measurements.
	// We sample uniformly in log space between 1 and 2.
	// This avoids ties which are detrimental to rank-based stats.
	// Given that we also plot in log space this seems reasonable.

	const mul = 2**(1 + Math.random()) / 2
	const reps = N * mul | 0
	const t = await sample(reps) / reps
	results.push(t)
	chronological.push(t)
}


function* _run({tasks, reps}, state) {
	const calibrationRuns = 15
	const calibrationTargetDuration = 24 // in ms, was deemed good engonh one day, should revisit
	let i = 0
	while (i++ < reps && !state.done) {
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
				yield ({kind: "task", task: runOne(sh[j])})
			}
		}
		yield {kind: "tick", i}
	}
	return tasks.map(({name, N, results}) => ({name, N, results}))
}

function run(options) {
	let state = {run: true, done: false}
	const pause = (mode = true) => {
		if (mode !== state.run) return
		state.run = !mode
		if (state.run) go()
	}
	const stop = () => {state.done = true}
	const runner = _run(options, state)
	let fulfill, reject
	const result = new Promise((f,r) => {
		fulfill = f
		reject = r
	})
	async function go(){
		let status
		do {
			await delay(0)
			try {
				while (true) {
					status = runner.next()
					if (status.done || status.value.kind === 'tick') break
					await status.value.task
				}
			} catch(e) {
				reject(e)
			}
			if  (!status.done) options.onTick({i: status.value.i - 1, reps, tasks})

		} while (!status.done && state.run && !state.done)
		if (status.done || state.done) fulfill(status.value)
	}
	Promise.resolve().then(go)
	return {result, pause, stop}
}

