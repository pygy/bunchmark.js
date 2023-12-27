//@ts -check
import {Fragment, createElement as h, useState} from 'react'
import {render, Text} from 'ink'

import {run as runBench} from "@bunchmark/core"
import { wilcoxon, getQuantiles } from "@bunchmark/stats"

import { Histogram } from "./histogram.js"
import { PValues } from "./p-values.js"
import { QuantileTable } from "./quantile-table.js"

export async function run(options) {
    let setEntries
    let done = false
    const showHistogram = options.showHistogram ?? true
    const showQuartiles = options.showQuartiles ?? false
    const showPValues = options.showPValues ?? true
    const UI = () => {
        /**
         * @type 
         */
        let result;
        void ([result, setEntries] = useState(null))
        if (result === null) return

        const {entries, reps, i} = result

        const quantiles = entries && entries[0].workspace.length > 2 && entries.map(e => getQuantiles(e.workspace))

        const children = [
            h(Text, {bold:true}, (i+!done), "/", reps),
            showHistogram && quantiles && h(Histogram, {entries, quantiles}),
            showQuartiles  && quantiles && h(QuantileTable, {entries, quantiles}),
            showPValues && h(PValues, {entries, test: wilcoxon, set: "chronological"})
        ]
        return h(Fragment, null, ...children)
    }


    options = {...options}
    let data = null
    let last = Date.now()
    const onTick = options.onTick ?? (()=>{})

    options.onTick = (result) => {
        const now = Date.now()
        if (setEntries != null && last < now - 300) {
            last = now
            setEntries(result)
        }
        onTick(result)
    }


    setTimeout(()=>render(h(UI)))

    return runBench(options).then(result=>{
        done = true
        setEntries(result)
        return result
    })
}
