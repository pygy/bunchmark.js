//@ts-check
//@ts-ignore
import { Text, Box } from 'ink';
import { Fragment, createElement as h } from 'react';
import { getBins, getRanks } from "@bunchmark/presentation"
const {ceil, max} = Math

const blocks = [..." ▁▂▃▄▅▆▇█"]
export const Histogram = ({entries, quantiles}) => {
    const {rows: tRows, columns: tCols} = process.stdout
    const ranks = getRanks(quantiles)
    const bins = getBins(entries, quantiles, tCols)
    const largest = max(...bins.bins.map(bin=>max(...bin)))
    // console.log(bins)
    // process.exit(0)
    return h(Fragment, null, ...entries.map((e, i) => {
        return h(Box, {key:"X"+i, flexDirection: "column"},
            h(Box, {flexDirection: "row"}, 
                h(Text, null, bins.bins[i].map(bin => blocks[ceil(bin/largest*(blocks.length - 1))]).join(""))
            ),
            h(Box, {flexDirection: "row"},h(Text, null, h(Text, {bold:true}, e.name), " ", ranks[i].text)),
        )
    }))
}
const p = (x) => (console.log(x), x)