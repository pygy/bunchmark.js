// @ts-check
export { compiler, bake };


/**
 * @typedef {import("./types.ts").Bakable} Bakable
 * @typedef {import("./types.ts").Code} Code
 * @typedef {import("./types.ts").Options} Options
 * @typedef {import("./types.ts").Sampler} Sampler
 * @typedef {import("./types.ts").Task} Task
 */



/** @param {{[key: string]: string | Function}} x
 * @returns {string}
 */
function stringify(x) {
    for (const name in x) {
        let src = x[name];
        if (typeof src === "string")
            return src;
        if (typeof src !== "function")
            throw new TypeError(`string or function expected for ${name}, got ${typeof x}`);
        const source = src.toString();
        return source
            .replace(/^async(?:\s*\/\*[^]*?\*\/)+/, 'async ')
            .slice(source.indexOf("{") + 1, source.lastIndexOf("}"));
    }
    return "";
}

/** @returns {string} */
const randStr = () => (Math.random() * 0x7fffffff | 0).toString(36);
const uid = [randStr(), randStr(), randStr(), randStr()].join("_");
const result_uid = `result_${uid}`;
const now_id = `now_${uid}`;
const hasPerf = typeof performance !== "undefined";
const header = `
const ${result_uid} = [];
const ${now_id} = ${hasPerf ? "() => performance.now()" : "process.hrtime.bigint"}
`;
/** 
 * @param {string} result_uid
 * @returns {string}
 */
const footer = (result_uid) => `
return ${result_uid};
`;

const N = "N_" + uid;

/**
 * @param {Task} task // TODO find a way to use {Task} instead of {object}
 * @param {Code} beforeEach
 * @param {Code} afterEach
 * @returns {string}
 */
const bakeTask = ({ run, before = "", after = "" }, beforeEach, afterEach) => `
${result_uid}.push(async function(${N}){
	${stringify({ beforeEach })};
	${stringify({ before })};
	const t1 = ${now_id}()
	while (${N}--) {
${stringify({ run })}
	}
	const t2 = ${now_id}()
	${stringify({ after })};
	${stringify({ afterEach })};
	return Number(t2 - t1)${hasPerf ? "" : " / 1e6"}
});
`;


/**
 * @param {Bakable} bakable
 * @returns {string}
 */
function bake({ tasks, preamble = "", beforeEach = "", afterEach = "", header, footer }) {
    return `
${stringify({ preamble })};

${header};

${tasks.map(task => bakeTask(task, beforeEach, afterEach)).join("")}

${footer(result_uid)}
`;
}

/**
 * @param {Options} options
 * @returns {Sampler[]}
 */
function compiler({ tasks, preamble = "", beforeEach = "", afterEach = "" }) {
    const source = bake({ tasks, preamble, beforeEach, afterEach, header, footer });
    /**
     * @type {Sampler[]} samplers
     */
    const samplers = new Function(source)();

    return samplers
}
