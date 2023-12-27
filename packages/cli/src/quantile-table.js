//@ts -check
import {createElement as h} from 'react'
import Table from "@inkkit/ink-table"
import { prensentStats } from "@bunchmark/presentation"
import { getQuantiles } from "@bunchmark/stats"



export const QuantileTable = ({entries, quantiles=entries.map(e=>getQuantiles(e.workspace))}) => {
    return h(Table, {data: entries.map((entry, i) => {
        return{name: entry.name , ...prensentStats(quantiles[i], entry.workspace.length)}
    })})
}
