export const median = (results) => {
    const i = (results.length - 1) / 2 | 0
    quickselect(results, i)
    return results [i]
  }
  export const MAD = (results, med) => median(results.map(r => Math.abs(r - med)))
  
  export function pimpStats({results}) {
    // const M = 1e6
    const res = getStats(results)
    const mad = MAD(results, res.median)
    const MADPercent = Math.floor(mad / (res.median) * 1000)/10
    
    res.q1 = scientific(res.q1/1000) + 's'
    res.lowCI = scientific(res.lowCI/1000) + 's'
    res.median = scientific(res.median/1000) + 's'
    res.highCI = scientific(res.highCI/1000) + 's'
    res.q3 = scientific(res.q3/1000) + 's'
    res.MAD =scientific(mad/1000) + "s"
    res["MAD/median"] = MADPercent + "%"
    res.runs = results.length
    return res
  }
  
  const nearestPo2 = (x) => 2**(Math.log2(x)|0)
  
  export function scientific(num) {
    // TODO? handle big numbers?
    if (num > 1) return num.toPrecision(3)
    // num = num / 1000
    let i = 0;
  
    while (num * 10**(++i) < 100);
    const rem = i % 3
    const mantissa = Math.round(num * 10**i) / 10**rem
    return `${Math.round(num * 10**i) / 10**rem} × 10^${-(i-rem)}`
  
  }
  
  export function getStats(ary) {
    const N = ary.length
    const q1i = Math.floor(N/4)
    const medI = Math.floor(N/2)
    const q3i = Math.floor(N*3/4)
  
    // indices for the confidence interval for median
    const Z = 1.96 // p=0.95
    // const Z = 2.58 // p=0.99
    // (length)(.5) +/– 1.96√(length)(.5)(1-.5)
    const lowI = Math.round(N/2  - Z * Math.sqrt(N * .25))
    const hiI = Math.round(N/2  + Z * Math.sqrt(N * .25))
  
    // quickselect mutates the array and leaves
    // the values smaller than the percentile
    // we look for in the left part.
    // So we use it in order, from smaller to
    // larger, bumping the lower bound, for optimal
    // perf. This is way faster than sorting the array
    // then picking the values for arrays larger than 5
    // items.
  
    quickselect(ary, q1i, 0)
    const q1 = ary[q1i]
  
    quickselect(ary, lowI, q1i)
    const lowCI = ary[lowI]
  
    quickselect(ary, medI, lowI)
    const median = ary[medI]
  
    quickselect(ary, hiI, medI)
    const highCI = ary[hiI]
  
    quickselect(ary, q3i, hiI)
    const q3 = ary[q3i]
  
    return {q1, lowCI, median, highCI, q3}
  }
  
  // https://github.com/mourner/quickselect/blob/26a241497b101167ab43c27c077bed4729c6b697/index.js
  
  // ISC License
  
  // Copyright (c) 2018, Vladimir Agafonkin
  
  // Permission to use, copy, modify, and/or distribute this software for any purpose
  // with or without fee is hereby granted, provided that the above copyright notice
  // and this permission notice appear in all copies.
  
  // THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  // REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
  // FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  // INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
  // OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
  // TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
  // THIS SOFTWARE.
  
  // modification
  // hardcoding a qnd comparator makes it ~twice as fast
  
  export function quickselect(arr, k, left, right) {
      quickselectStep(arr, k, left || 0, right || (arr.length - 1));
  }
  
  function quickselectStep(arr, k, left, right) {
  
      while (right > left) {
          if (right - left > 600) {
              var n = right - left + 1;
              var m = k - left + 1;
              var z = Math.log(n);
              var s = 0.5 * Math.exp(2 * z / 3);
              var sd = 0.5 * Math.sqrt(z * s * (n - s) / n) * (m - n / 2 < 0 ? -1 : 1);
              var newLeft = Math.max(left, Math.floor(k - m * s / n + sd));
              var newRight = Math.min(right, Math.floor(k + (n - m) * s / n + sd));
              quickselectStep(arr, k, newLeft, newRight, compare);
          }
  
          var t = arr[k];
          var i = left;
          var j = right;
  
          swap(arr, left, k);
          if (compare(arr[right], t) > 0) swap(arr, left, right);
  
          while (i < j) {
              swap(arr, i, j);
              i++;
              j--;
              while (compare(arr[i], t) < 0) i++;
              while (compare(arr[j], t) > 0) j--;
          }
  
          if (compare(arr[left], t) === 0) swap(arr, left, j);
          else {
              j++;
              swap(arr, j, right);
          }
  
          if (j <= k) left = j + 1;
          if (k <= j) right = j - 1;
      }
  }
  
  function swap(arr, i, j) {
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
  }
  
  function compare(a, b) {
      return a < b ? -1 : a > b ? 1 : 0;
  }
  
  // end of  https://github.com/mourner/quickselect/blob/26a241497b101167ab43c27c077bed4729c6b697/index.js