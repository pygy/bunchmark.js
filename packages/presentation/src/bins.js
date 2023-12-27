export {getBins}

function getBounds(entries) {
  const min = Math.min(...entries.map(e => Math.min(...e.workspace)))
  const max = Math.max(...entries.map(e => Math.max(...e.workspace)))
  return {min, max}
}


function getBins(entries, quantiles, maxN) {
  const {max, min} = getBounds(entries)
  let minHamBound = 1/0
  let maxHamBound = -1/0
  let largestIQR = -1/0
  quantiles.forEach(q => {
    // find the non-outlier bounds using the IQR
    // method. Given the data distribution,
    // we work in log space as we do for the rest.
    const lq1 = Math.log(q.q1)
    const lq3 = Math.log(q.q3)
    const logIQR = lq3 - lq1
    
    largestIQR = Math.max(logIQR, largestIQR)
    const scaleFactor = 1.75
    minHamBound = Math.min(minHamBound, Math.exp(lq1 - scaleFactor * logIQR))
    maxHamBound = Math.max(maxHamBound, Math.exp(lq3 + scaleFactor * logIQR))
  })
  // clamp the bound to the actual data if needed
  if (maxN < 16){
    minHamBound = Math.max(minHamBound, min)
    maxHamBound = Math.min(maxHamBound, max)
  }
  // maxN = Math.max(0, (Math.min(600,
  //  (entries[0].workspace.length)/(largestIQR)*(maxHamBound-minHamBound)|0)
  // ))
  //   // p(N, 1/(largestIQR)*(maxHamBound-minHamBound), tasks[0].results.length)
  //   maxN = 50
  // // N=Math.min(3,N)
  
  
  // TODO: find a better way to determin the number of bins
  // take data spread into account. The ratio beween the average 
  // normaized IQR and the difference between the fastest and 
  // slowest sound like a good option
  return addBins(entries, maxN, minHamBound, maxHamBound)
}

function addBins(entries, N, min, max) {
  const bounds = Array.from({length: N})
  const mul = (max/min)**(1/N)
  const amplitude = min - max
  let from = min
  for (let i = 0; i < N; i++) {
    bounds[i] = {from, to : (from *= mul)}
  }

  const result = {
    min, max, N, bounds,
    bins: Array.from(
      entries, 
      e => bounds.map(
        ({from, to}, i) => {

          return e.workspace.reduce((acc, res) => acc + (from < res && res <= to), 0)
        }
      )
    ),
    bins2: Array.from(entries, ()=>Array.from(bounds, ()=>0))
  }

  entries.forEach((e, i) => {
    e.workspace.forEach(res => {
      result.bins2[i][Math.floor((res - min)/amplitude)]++
    })
  })
  return result
}
