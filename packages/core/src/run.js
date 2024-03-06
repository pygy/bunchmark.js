export { run };

// @ts-check

/**
 * @typedef {import ("./types.ts").Sampler} Sampler
 * @typedef {import("./types.ts").Task} Task
 * @typedef {import("./types.ts").Options} Options
 * @typedef {import("./types.ts").RunnerOptions} RunnerOptions
 * @typedef {import("./types.ts").RunnerState} RunnerState
 * @typedef {import("./types.ts").Result} Result
 * @typedef {import("./types.ts").YieldTask} YieldTask
 * @typedef {import("./types.ts").YieldTick} YieldTick
 * @typedef {import("./types.ts").ReturnTick} ReturnTick
 * @typedef {import("./types.ts").RunResult} RunResult
 * @typedef {import("./types.ts").Entry} Entry
 * @typedef {import("./types.ts").InnerTask} InnerTask
 */

import { shuffled } from "./shuffle.js";
import { median } from "@bunchmark/stats";

const {ceil} = Math
/** 
 * @param {Task} task
 * @returns {Entry}
 */
const Result = ({ name }) => ({
    name,
    // used for the medians, can be re-ordered
    workspace: [],
    // used for the Wilcoxon test
    chronological: [],
    // the calibraion runs absolute time
    calibration: [],
    N: 0,
});

/** 
 * @param {Task} t
 * @param {Sampler} sample
 * @param {number} i
 * @returns {InnerTask}
 */
const Task = (t, sample, i) => ({
    name: t.name,
    i,
    sample,
    result: Result(t),
    N: 0,
    keepChrono: true
});



/** 
 * @param {number} n
 * @returns {Promise<unknown>}
 */
const delay = (n) => new Promise(f => setTimeout(f, n));
// N is the baseline repetition count for a run

/** 
 * @param {InnerTask} task
 * @param {number} calibrationTargetDuration
 * @returns {Promise<number>}
 */
async function findN(task, calibrationTargetDuration) {
    const { sample, result, result: { workspace, chronological, calibration }, keepChrono } = task;
    let N = 1;
    for (;;) {
        const t = await sample(N);
        if (t > calibrationTargetDuration) {
            workspace.push(t / N);
            if (keepChrono)
                chronological.push(t / N);
            result.N = (N * calibrationTargetDuration / t); // Is this needed?
            calibration.push((N * calibrationTargetDuration / t));
            break;
        }
        else {
            N *= 2;
        }
    }
    return N;
}

/** 
 * @returns {Promise<void>} 
 */
async function runOne({ sample, N, result, keepChrono }) {
    // When using a fixed number of repetitions we can end up with
    // a striped timing distribution (depending on timer resolution),
    // so we use a random multiplier to spread out the measurements.
    // We sample uniformly in log space between 1 and 2.
    // This avoids ties which are detrimental to rank-based stats.
    // Given that:
    // - the distribution of runs appears to be log-normal, and
    // - we also plot in log space,
    // this seems reasonable.

    const jitterFactor = 2 ** (1 + Math.random()) / 2;
    const reps = ceil(N * jitterFactor)
    const t = (await sample(reps)) / reps;
    result.workspace.push(t);
    if (keepChrono)
        result.chronological.push(t);
}

/**
 * @param {RunnerOptions} options
 * @param {RunnerState} state
 * @returns {Generator<YieldTask|YieldTick, ReturnTick, never>}
 */
function* runGenerator(options, state) {
    const { tasks, reps } = options;
    const calibrationRuns = options.calibrationReps;
    // in ms, was deemed good engonh as a default for reasons I don't entirely
    // remember... The timing resolution is limited, but the jitter factor smooths
    // things out.
    const calibrationTargetDuration = options.duration ?? 24;
    let i = 0;
    while (i++ < reps && !state.done) {
        const sh = shuffled(tasks);
        if (i < calibrationRuns) {
            for (const task of tasks) {
                yield { kind: "task", task: findN(task, calibrationTargetDuration) };
            }
        }
        else {
            if (i === calibrationRuns) {
                // set the final iteration number for each task
                // we take the median of the calibration runs.
                for (const task of tasks) {
                    task.result.N = task.N = median(task.result.calibration);
                }
            }

            for (const j in sh) {
                yield { kind: "task", task: runOne(sh[j]) };
            }
        }
        yield { kind: "tick", i, reps };
    }
    return { i, reps };
}

/**
 * @param {IteratorYieldResult<YieldTask|YieldTick>} iter
 * @returns {iter is IteratorYieldResult<YieldTick>}
 */
function isTick(iter) {
    return iter.value.kind === "tick";
}
/**
 * @param {IteratorYieldResult<YieldTask|YieldTick>} iter
 * @returns {iter is IteratorYieldResult<YieldTask>}
 */
function isTask(iter) {
    return iter.value.kind === "task";
}


/**
 * @param {Options} options
 * @returns {Promise<Result>}
 */
async function run(options) {

    const {compiler = (await import("./compile.js")).compiler} = options
    const samplers = await compiler(options);

    const runnerOptions = {
        tasks: options.tasks.map((t, i) => Task(t, samplers[i], i)),
        keepChrono: options.keepChrono ?? true,
        reps: options.reps ?? 100,
        duration: options.duration ?? 24,
        calibrationReps: options.calibrationReps ?? 15,
        onTick: options.onTick
    };

    const state = { run: true, done: false };
    if (options.handle != null && typeof options.handle === 'object') {
        options.handle.pause = (mode = true) => {
            if (mode !== state.run)
                return;
            state.run = !mode;
            if (state.run)
                Promise.resolve().then(go).catch(reason => reject(reason));
        };
        options.handle.stop = () => { state.done = true; };    
    }

    const { tasks } = runnerOptions;
    const runner = runGenerator(runnerOptions, state);
    let fulfill, reject;
    const result = new Promise((f, r) => {
        fulfill = f;
        reject = r;
    });
    async function go() {
            /**
             * $typedef IteratorResult<YieldTask | YieldTick, ReturnTick>
             */
            let status;
        do {
            await delay(0);
            try {
                do {
                    status = runner.next();
                    if (!status.done && isTask(status))
                        await (status.value).task;
                    else
                        break;
                } while (true);
            }
            catch (e) {
                reject(e);
                return;
            }
            // appease TypeScript, this can't ever be null
            if (status == null) throw new TypeError("Unexpected null")
            if (!status.done) {
                if (!isTick(status))
                    throw new TypeError("Unexpected YieldResult " + JSON.stringify(status.value));
                runnerOptions.onTick?.({
                    i: status.value.i - 1,
                    reps: status.value.reps,
                    entries: tasks.map(t => t.result)
                });
            }

        } while (!status.done && state.run && !state.done);
        if (status.done || state.done)
            fulfill({
                i: status.value.i - 1,
                reps: status.value.reps,
                entries: tasks.map(t => t.result)
            });
    }
    Promise.resolve().then(go).catch(reason => reject(reason));
    return result
}
