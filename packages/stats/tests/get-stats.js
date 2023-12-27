import o from "ospec"
import {getQuantiles, zForP, pForZ, getTable, wilcoxon, mwu} from "../stats.js"


const {round} = Math

o("getQuantiles", () => {
    const ary = [1,2,3,4,5,6]
    const stats = getQuantiles(ary)
    o(stats).deepEquals({
        q1: 2.25,
        lowCI: 2.7458975342173546,
        median: 3.5,
        highCI: 4.254102465782646,
        q3: 4.75,
        MAD: 1.5
    })
})
o("zForP", ()=>{
    o(round(zForP(.975)*100)).equals(196)
    o(round(zForP(.025)*100)).equals(-196)
    o(round(zForP(.5)*100)).equals(0)
})

o.spec("pForZ", ()=>{
    let warn
    o.beforeEach(()=>{
        void ({warn} = console)
        console.warn = o.spy()
    })
    o.afterEach(()=>{
        console.warn = warn
    })
    o("works", ()=>{
        o(round(pForZ(0)*1000)).equals(500)
        o(round(pForZ(-0.004)*1000)).equals(498)
        o(round(pForZ(0.004)*1000)).equals(502)
        o(round(pForZ(1.964)*1000)).equals(975)
        o(round(pForZ(-1.964)*1000)).equals(25)
        o(console.warn.callCount).equals(0)
    })
    o("warns on overflow", ()=>{
        const ref = pForZ(9.999)
        o(console.warn.callCount).equals(0)
        o(pForZ(10)).equals(ref)
        o(console.warn.callCount).equals(1)

    })
})

o.spec("getTable", ()=>{
    const twoEntries = [
        {name:"A", values: [1, 4, 5, 98, 1, 4, 5, 98, 1, 4, 5, 98]},
        {name:"B", values: [2, 3, 5, 12, 2, 3, 5, 12, 2, 3, 5, 12]}
    ]
    const threeEntries = [
        {name:"A", values: [1, 4, 5, 98, 1, 4, 5, 98, 1, 4, 5, 98]},
        {name:"B", values: [2, 3, 5, 12, 2, 3, 5, 12, 2, 3, 5, 12]},
        {name:"C", values: [23, 1, 7, 3, 23, 1, 7, 3, 23, 1, 7, 3]}
    ]
    o("wilcoxon two comparisons", ()=>{
        const entries = twoEntries
        const result = getTable(entries, "values", wilcoxon)
        
        o(result.length).equals(1)

        if (result[0]) {
            o(result[0].axes).deepEquals({y: {name:"A", index: 0}, x: {name: "B", index: 1}})
            o(Object.keys(result[0].stats)).deepEquals(["T", "z", "p"])
            o(Object.values(result[0].stats).map(x=>typeof x)).deepEquals(["number", "number", "number"])
        }
    })
    o("wilcoxon three comparisons", ()=>{
        const entries = threeEntries
        const result = getTable(entries, "values", wilcoxon)

        o(result.length).equals(3)

        if (result[0]) {
            o(result[0].axes).deepEquals({y: {name:"A", index: 0}, x: {name: "B", index: 1}})
            o(Object.keys(result[0].stats)).deepEquals(["T", "z", "p"])
            o(Object.values(result[0].stats).map(x=>typeof x)).deepEquals(["number", "number", "number"])
        }
        if (result[1]) {
            o(result[1].axes).deepEquals({y: {name:"A", index: 0}, x: {name: "C", index: 2}})
            o(Object.keys(result[1].stats)).deepEquals(["T", "z", "p"])
            o(Object.values(result[1].stats).map(x=>typeof x)).deepEquals(["number", "number", "number"])
        }
        if (result[2]) {
            o(result[2].axes).deepEquals({y: {name:"B", index: 1}, x: {name: "C", index: 2}})
            o(Object.keys(result[2].stats)).deepEquals(["T", "z", "p"])
            o(Object.values(result[2].stats).map(x=>typeof x)).deepEquals(["number", "number", "number"])
        }
    })
    o("mwu two comparisons", ()=>{
        const entries = twoEntries
        const result = getTable(entries, "values", mwu)
        
        o(result.length).equals(1)

        if (result[0]) {
            o(result[0].axes).deepEquals({y: {name:"A", index: 0}, x: {name: "B", index: 1}})
            o(Object.keys(result[0].stats)).deepEquals(["U", "z", "p"])
            o(Object.values(result[0].stats).map(x=>typeof x)).deepEquals(["number", "number", "number"])
        }
    })
    o("mwu three comparisons", ()=>{
        const entries = threeEntries
        const result = getTable(entries, "values", mwu)

        o(result.length).equals(3)

        if (result[0]) {
            o(result[0].axes).deepEquals({y: {name:"A", index: 0}, x: {name: "B", index: 1}})
            o(Object.keys(result[0].stats)).deepEquals(["U", "z", "p"])
            o(Object.values(result[0].stats).map(x=>typeof x)).deepEquals(["number", "number", "number"])
        }
        if (result[1]) {
            o(result[1].axes).deepEquals({y: {name:"A", index: 0}, x: {name: "C", index: 2}})
            o(Object.keys(result[1].stats)).deepEquals(["U", "z", "p"])
            o(Object.values(result[1].stats).map(x=>typeof x)).deepEquals(["number", "number", "number"])
        }
        if (result[2]) {
            o(result[2].axes).deepEquals({y: {name:"B", index: 1}, x: {name: "C", index: 2}})
            o(Object.keys(result[2].stats)).deepEquals(["U", "z", "p"])
            o(Object.values(result[2].stats).map(x=>typeof x)).deepEquals(["number", "number", "number"])
        }
    })
})
