//@ts-check
import Table from "@inkkit/ink-table"
//@ts-ignore
import { Text } from 'ink';
import { createElement as h } from 'react';
import { getTable } from "@bunchmark/stats"

const threshold = .005

const numeric = children => typeof children === 'string' && !Number.isNaN(parseFloat(children))

const significant = children => typeof children === 'string' && (
    parseFloat(children) < threshold
    || children.trim() === "< 0.001"
)


const topLeft = "p-values w/ Bonferonni corr."

const DataCell = props => {
    let chProps = null
    if (props.column === 0) chProps = {color: "blue", bold:true}
    else if (significant(props.children)) chProps =  {bold: true}
    else if (!numeric(props.children)) chProps =  {color: "grey"}

    return h(
        Text,
        chProps,
        props.children
    )
}

const Header = props => h(
    Text, 
    props.column === 0 ? null : { bold: true, color: "blue" },
    props.children
)

const getColNames = entries => entries.map((_, i) => i === 0 ? topLeft : (i+1)+'.')

const presentP = p => {
    const rounded = Math.round (p * 1000)
    return rounded !== 0 ? rounded / 1000 : "< 0.001"
}

export const PValues = ({entries, test, set}) => {
    const stats = getTable(entries, set, test)
    const colNames = getColNames(entries)
    const waiting = entries[0][set].length <= 9
    const table = entries.map((e, y) => ({...colNames.reduce(
        (res, name, x) => Object.assign(res, {[name]: name === topLeft ? `${y+1}. ${e.name}` : x === y ? "" : "-"}),
        {}
    )}))

    if (waiting) {
        colNames[0] = "waiting for more samples"
        table.forEach(line => line[colNames[0]] = line[topLeft])
    } else {
        stats.forEach(s => {
            table[s.axes.y.index][(s.axes.x.index + 1) + '.'] = presentP(s.stats.p)
        })
        
    }
    //@ts-ignore
    return h(Table, {
        data: table,
        cell: DataCell,
        header: Header,
        columns: colNames,
    })
}

// getConfig() {
//     return {
//         data: this.props.data,
//         columns: this.props.columns || this.getDataKeys(),
//         padding: this.props.padding || 1,
//         header: this.props.header || Header,
//         cell: this.props.cell || Cell,
//         skeleton: this.props.skeleton || Skeleton,
//     };
// }

// /**
//  * Renders the header of a table.
//  */
// export function Header(props) {
//     return (React.createElement(Text, { bold: true, color: "blue" }, props.children));
// }
// /**
//  * Renders a cell in the table.
//  */
// export function Cell(props) {
//     return React.createElement(Text, null, props.children);
// }
// /**