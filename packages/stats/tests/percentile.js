import o from "ospec"
import {median, MAD, percentile, quickSelectFloat, quickselect} from "../stats.js"

o.spec('quickselect', ()=>{
    o('basics', ()=>{
        const ref = [2,3,4,1]
        o(quickselect(ref, 1)).equals(2)
        o(ref[1]).equals(2)
    })
    o('left param', ()=>{
        const ref = [2,3,4,1]
        o(quickselect(ref, 1, 1)).equals(1)
        o(ref[1]).equals(1)
    })
    o('callback', ()=>{
        const ref = [2,3,4,1]
        o(quickselect(ref, 1, (a, b) => b - a)).equals(3)
        o(ref[1]).equals(3)
    })
    o('left param and callback', ()=>{
        const ref = [2,3,4,1]
        o(quickselect(ref, 1, 1, (a, b) => b - a)).equals(4)
        o(ref[1]).equals(4)
    })
    o('large array', ()=>{
        const ref = Array.from({length: 1000}, (_, i) => 2 + i * Math.random())
        ref.push(1)
        o(quickselect(ref, 0)).equals(1)
    })
    o('large array with callback', ()=>{
        const ref = Array.from({length: 1000}, (_, i) => 2 + i * Math.random())
        ref.push(100000)
        o(quickselect(ref, 0, (a, b)=>b - a)).equals(100000)
    })
})

o('quickselectFloat', ()=>{
    const ref = [4,3,2,1]
    o(quickSelectFloat(ref, 1)).equals(2)
    o(ref[1]).equals(2)

    o(quickSelectFloat(ref, 1.5)).equals(2.5)
    o(ref[2]).equals(3)
    o(quickSelectFloat(ref, 4/3)).equals(4/3 + 1)
    o(ref[2]).equals(3)
})

o('percentile', ()=>{
    o(percentile([4,3,1,2], 0.5)).equals(2.5)
})

o('median', ()=>{
    o(median([3,2,5,1,4])).equals(3)
    o(median([3,2,1,4])).equals(2.5)
})

o('MAD', ()=> {
    o(MAD([1,2,3,4,5])).equals(1)
    o(MAD([1,2,3,4,5,6,6,8])).equals(1.5)
    o(MAD([1,2,3,4,5,6,7,8])).equals(2)
    o(MAD([1,2,3,4,5,6,7,8,9])).equals(2)
})
