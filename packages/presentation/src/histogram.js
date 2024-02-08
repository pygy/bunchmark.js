// Rudimentary visualisations for the Web
import {scientific, getRanks, getBins} from "../presentation.js"

const {log: mlog, max: mmax} = Math
export function histogram(entries, quantiles, _N, target) {
  const {min,max, N, bins, bounds} = getBins(entries, quantiles)
  const ranks = getRanks(quantiles)
 
  const verticalResolution = 1/(mmax(...bins.map(bin => mmax(...bin))))
  const margin = 30;
  const marginBottom = 25;
  const totalWidth = Number(document.body.clientWidth) - margin * 2
  const width = totalWidth / N
  const rowHeight = 30
  const lmax = mlog(max)
  const lmin = mlog(min)
  const widthInDataSpace = lmax - lmin
  let src = `<svg xmlns="http://www.w3.org/2000/svg"
  width="${totalWidth}"
  height="${entries.length * (rowHeight + margin + marginBottom) + 3}"
  viewBox="0,0,${totalWidth},${entries.length * (rowHeight + margin + marginBottom)}"
  style="margin:10px">`
  
  entries.forEach((entry, i) => {
    const lmed = mlog(quantiles[i].median)
    const lmedLo = mlog(quantiles[i].lowCI)
    const lmedHi = mlog(quantiles[i].highCI)
    const medianPosition = (lmed-lmin)/widthInDataSpace*totalWidth
    const lowCIPosition = (lmedLo-lmin)/widthInDataSpace*totalWidth
    const highCIPosition = (lmedHi-lmin)/widthInDataSpace*totalWidth

    const bottom =  (i + 1) * (rowHeight + margin + marginBottom )
    const base = bottom - marginBottom

    // the histogram
   bins[i].forEach((n, j) => {
      const height = n === 0 ? 0 : mmax(1, n * verticalResolution * rowHeight)
      src += SVGRect({
        x: j * width,
        width,
        y: base - height,
        height
      })
    })
    // ci over the median
    src+= SVGRect({
      x:lowCIPosition,
      width: highCIPosition - lowCIPosition,
      y: base - rowHeight - margin + 10,
      height: rowHeight *1.7,
      fill: "#ff8844",
      opacity: 0.4
    })
    // median
    src += vLine({x: medianPosition, top: base - 85, bottom: base + 25, stroke: "#ff0f00", klass: "bunchmark-median"})
    // title
    const name = entry.name || ((source) => source.slice(source.indexOf('{')+1, 60))(entry.run.toString());
    src += hLine(base + 1, totalWidth, "#888888")
        src+=`<text
      x="${totalWidth / 2}"
      y="${base-rowHeight - 5}"
      text-anchor="end"
      style="font-family:sans-serif;font-weight: bold;text-shadow: 1px 1px 1px #fffa, -1px -1px 1px #fffa"
    >${name}</text><text
      x="${totalWidth / 2}"
      y="${base-rowHeight - 5}"
      style="font-size:13px;font-family:sans-serif;text-shadow: 1px 1px 1px #fffa, -1px -1px 1px #fffa"
    >, ${ranks[i].text}</text>`
    // median label
    src += `<text
      class="median-text"
      x="${medianPosition}"
      y="${base + marginBottom - 8}"
      text-anchor="middle"
      style="font-size: 13px;font-family:sans-serif;text-shadow: 1px 1px 1px #fffa, -1px -1px 1px #fffa"
    >
      ${scientific(quantiles[i].median/1000)}s
    </text>`
    // src += scale(min, max, base + marginBottom - 8, totalWidth )
    // src += hLine(bottom + 2, totalWidth, "#333333")
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
  >
    ${scientific(max)} s
  </text>
` 
const hLine = (y, width, stroke) => `
  <line x1="0", y1="${y}" x2="${width}" y2="${y}"
    style="stroke-width:1;stroke:${stroke};fill-opacity:0;stroke-opacity:1"></line>
`
const vLine = ({x, top, bottom, stroke, klass = ''}) => `
  <line class="${klass}" x1="${x}", y1="${top}" x2="${x}" y2="${bottom}"
    style="stroke-width:1;stroke:${stroke};fill-opacity:0;stroke-opacity:1"></line>
`

