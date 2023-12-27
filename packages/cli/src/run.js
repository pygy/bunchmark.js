//@ts -check
import {Fragment, createElement, useState} from 'react'
import {render} from 'ink'

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
    const Counter = () => {
        /**
         * @type 
         */
        let entries
        void ([entries, setEntries] = useState(null))
        const quantiles = entries && entries.map(e => getQuantiles(e.workspace))
        const children = [
            showHistogram && entries && createElement(Histogram, {entries, quantiles}),
            showQuartiles && entries && createElement(QuantileTable, {entries, quantiles}),
            showPValues && entries && createElement(PValues, {entries, test: wilcoxon, set: "chronological"})
        ]
        return createElement(Fragment, null, ...children)
    }


    options = {...options}
    let data = null
    let last = Date.now()
    const onTick = options.onTick ?? (()=>{})

    options.onTick = ({entries, i, rep}) => {
        const now = Date.now()
        if (setEntries != null && last < now - 300) {
            last = now
            setEntries(entries)
        }
        onTick({data, i, rep})
    }


    render(createElement(Counter))

    return runBench(options).then(data=>{
        done = true
        setEntries(data.entries)
        return data
    })
}
