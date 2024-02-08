export {makeTimelines}

import {scientific, getBounds, QNDMedian} from "../presentation.js"

const {log: mlog, max: mmax, min:mmin, floor: mfloor} = Math

let RRR = 0

function makeTimelines({entries, totalEntries, target}) {
  RRR++
  const {min,max} = getBounds(entries)
  const lmin = mlog(min)
  const lmax = mlog(max)
 
  const verticalResolution = 1/(lmax - lmin)
  const margin = 30
  const marginBottom = 25
  const totalWidth = Number(document.body.clientWidth) - margin * 2
  const dotWidth = totalWidth / totalEntries
  const rowHeight = 100
  let src = `<svg xmlns="http://www.w3.org/2000/svg"
  width="${totalWidth}"
  height="${entries.length * (rowHeight + margin + marginBottom) + 3}"
  viewBox="0,0,${totalWidth},${entries.length * (rowHeight + margin + marginBottom)}"
  style="margin:10px">`
  
  entries.forEach((entry, i) => {
    const bottom =  (i + 1) * (rowHeight + margin)
    const base = bottom
    const ceiling = bottom - rowHeight

    // title
    const name = entry.name || ((source) => source.slice(source.indexOf('{')+1, 60))(entry.run.toString());
    src += hLine(bottom + 1, totalWidth, "#888888", {"stroke-dasharray":"1"})
    src += hLine(ceiling, totalWidth, "#888888", {"stroke-dasharray":"1"})
    src += `<text
      x="${totalWidth / 2}"
      y="${base-rowHeight - 5}"
      text-anchor="end"
      style="font-family:sans-serif;font-weight: bold;text-shadow: 1px 1px 1px #fffa, -1px -1px 1px #fffa"
    >${name}</text>`
    if (dotWidth > 1) {
      p("B")
    } else {
      const threshold = 1/dotWidth
      const truncated = mfloor(threshold)
      let k = 0
      let floorK = 0
        const ary = []
      for(let j = 0; j< totalWidth; j++) {
        let oneMore = mfloor(k + threshold) > floorK + truncated
        const entriesPerDot = truncated + oneMore
        const target = floorK + entriesPerDot
        k += threshold
        ary.length = 0
        for(; floorK < target; floorK++) {
          if (floorK === entry.chronological.length) break
          ary.push(entry.chronological[floorK])
        }
        const bottom = base - (mlog(mmin(...ary))-lmin) * verticalResolution * rowHeight
        const top = base - (mlog(mmax(...ary))-lmin) * verticalResolution * rowHeight
        if (top < ceiling) {
          console.log({top, ceiling}, mmax(...ary), mlog(mmax(...ary))-lmin, 1/verticalResolution)
          throw "SDFSDF"
        }
        src += vLine({x: j, top, bottom, stroke: "#ff0f00"})
        const y = QNDMedian(ary)
        src += dot({x:j, y:base - (mlog(y)-lmin)*verticalResolution * rowHeight})
        if (floorK === entry.chronological.length) break
      }
    }
    // if (RRR > 10) throw "HUGHH"
  })
  src += `
</svg>`
  target.innerHTML=src
  void ([...target.querySelectorAll(".median-text")].forEach(x=>{
    const bbox = x.getBBox()
    if (bbox.x < 0) {
      x.setAttribute("x", "0")
      x.removeAttribute("text-anchor")
    }
    if (bbox.x + bbox.width > totalWidth){
      x.setAttribute("text-anchor", "end")
      x.setAttribute("x", `${totalWidth}`)
    }
  }))
  // throw "SVG"
  // return {bounds, min, max}
}

const SVGRect = ({x, y, width, height, fill = "#880000", opacity = 1}) => `
  <rect x="${x}" y="${y}" width="${width}" height="${height}"
    style="stroke-width:0;fill:${fill};fill-opacity:${opacity}"></rect>
`

const scale = (min, max, y, width) => `
  <text
    style="font-size: 13px;font-family:sans-serif"
    x="0"
    y="${y}"
  >
    ${scientific(min)} s
  </text>
  <text
    style="font-size: 13px;font-family:sans-serif"
    x="${width}" y="${y}"
    text-anchor="end"
  >${scientific(max)} s</text>
` 

const splat = (options) => Object.entries(options).reduce((res, [k,v])=>res + " " + k+"="+JSON.stringify(v), "")
const hLine = (y, width, stroke, options = {}) => `
  <line x1="0", y1="${y}" x2="${width}" y2="${y}"
    style="stroke-width:1;stroke:${stroke};fill-opacity:0;stroke-opacity:1"${splat(options)}></line>
`
const vLine = ({x, top, bottom, stroke, klass = ''}) => `
  <line class="${klass}" x1="${x}", y1="${top}" x2="${x}" y2="${bottom}"
    style="stroke-width:1;stroke:${stroke};fill-opacity:0;stroke-opacity:1"></line>
`
const dot = ({x, y}) => `
<circle cx="${x}" cy="${y}" r="0.6" />
`
