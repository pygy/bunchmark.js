import o from "ospec"
import {getStats, zForP, pForZ} from "../stats.js"


const {round} = Math

o("getStats", () => {
    const ary = [1,2,3,4,5,6]
    const stats = getStats(ary)
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

o("pForZ", ()=>{
    o(round(pForZ(0)*1000)).equals(500)
    o(round(pForZ(-0.004)*1000)).equals(498)
    o(round(pForZ(0.004)*1000)).equals(502)
    o(round(pForZ(1.964)*1000)).equals(975)
    o(round(pForZ(-1.964)*1000)).equals(25)
})
