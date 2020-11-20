import {shuffled} from "./shuffle.js"
import {compile} from "./compile.js"

function findRepetition(sample) {
	let N = 1
	for (;;) {
		const t = sample(N)
		if (t > 24) {
			N = (N * 24 / t) | 0
			break
		} else {
			N *= 2
		}
	}
	return N
}

function runOne({sample, N, results}) {
	// Uniform sampling in log space between 1 and 2
	// given that the distribution still looks right-skewed in log space
	// this seems reasonable.
	const mul = 2**(1+Math.random()) / 2
	const reps = N * mul | 0
	results.push(sample(reps) / reps)
}

function calibrate({tasks, beforeCalibration, onCalibrationTick}) {
	return new Promise((f, r) => {
		let i = 0
		const reps = 16
		tasks.forEach(t=>t.N = 0)
		try {
			beforeCalibration({reps})
		} catch (e) {
			return r(e)
		}
		const runOnce  = () => {
			onCalibrationTick(i)
			try {
				shuffled(tasks).forEach(t=>{t.N = Math.max(t.N, findRepetition(t.sample))})
			} catch (e) {
				return r(e)
			}
			if (++i === reps) {
				f()
			}
			else setTimeout(runOnce)
		}
		runOnce()
	})
}

export function bunchmark({
	tasks,
	reps = 100,
	prologue = "",
	beforeEach = "",
	afterEach = "",
	deps = {},
	displayEvery = 10,
	onDisplayUpdate = () => {},
	beforeCalibration = () => {},
	onCalibrationTick = () => {},
	onCalibrationDone = () => {},
	beforeRunning = () => {},
	onRunTick = () => {},
}) {
	tasks = Object.entries(tasks).map(([name, v]) => ({
		...v,
		name,
		results: [],
		N: null,
		sample: null
	}))
  
	compile(tasks, {prologue, deps, beforeEach, afterEach})
	return calibrate({tasks, beforeCalibration, onCalibrationTick, onCalibrationDone}).then(()=>new Promise((f, r) => {
		try {
			onCalibrationDone()
			beforeRunning({reps, displayEvery})
		} catch (e) {
			return r(e)
		}

		let i = 0

		const cycle = () => {
			try{
				onRunTick(i)
				shuffled(tasks).forEach(runOne)
			} catch (e) {
				return r(e)
			}
			
			// document.write(".")

			if((onDisplayUpdate && (i % displayEvery === 0))) {
				try {
					onDisplayUpdate({reps, i, tasks: tasks.map(({name, N, results}) => ({name, N, results}))})
				} catch (e) {
					return r(e)
				}		
			}

			if (++i === reps) {
				f(tasks.map(({name, N, results}) => ({name, N, results})))
			}
			else setTimeout(cycle)
			// if ((i) % 32 === 0)document.write("<br>")
		}
		setTimeout(cycle, 100)
	}))
}
