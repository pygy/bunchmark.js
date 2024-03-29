// This can be useful:
// https://alexharri.com/blog/jsdoc-as-an-alternative-typescript-syntax

export type Sampler = ((N: number)=>Promise<number>)

export type Bakable = {
	preamble: Code,
	tasks: Task[],
	beforeEach: Code,
	afterEach: Code,
	footer: (id: string)=> string
}

export type Code = string | (() => void) | (() => Promise<void>)

export type Entry = {
	name?: string,
	workspace: number[],
	chronological: number[],
	calibration: number[],
	N: number
}

export type InnerTask = {
	name?: string,
	i: number,
	sample: Sampler,
	result : Entry,
	N: number,
	keepChrono: boolean
}

export type Options = {
	preamble?: Code,
	tasks: Task[],
	beforeEach?: Code,
	afterEach?: Code,
	keepChrono?: boolean,
	duration?: number,
	reps?: number
	calibrationReps?: number
	handle?: {}
	compiler?: (o:Options)=>(Promise<Sampler[]>|Sampler[])
	onTick?: (t: Result)=>void
}

export type Result = {
	i: number,
	reps: number,
	entries: Entry[]
}

export type ReturnTick = {i: number, reps: number}

export type RunnerOptions = {
	tasks: InnerTask[],
	keepChrono: boolean,
	duration: number,
	reps: number,
	calibrationReps: number,
	onTick?: (t: Result)=>void
}

export type RunnerState = {
	run: boolean,
	done: boolean
}

export type RunResult = {
	result: Promise<Result>,
	pause: (mode?: boolean) => void
	stop: () => void
}

export type Task = {
	name?: string
	before?: Code
	after?: Code
	run: Code
}


export type YieldTask = {kind: "task", task: Promise<void>}
export type YieldTick = {kind: "tick", i: number, reps: number}

