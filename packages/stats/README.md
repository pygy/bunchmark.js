# @bunmchmark/stats

This provides the (robust) statistics primitives used in bunchmark.

They all present tradeoffs that favor speed and implementation simplicity, when doing so doesn't impair robustness for our use case. These limitations are systematically documented and could be lifted over time if there is demand.

<!-- START toc -->
- [@bunmchmark/stats](#bunmchmarkstats)
    - [Median, MAD, percentiles and quickselect](#median-mad-percentiles-and-quickselect)
        - [getStats(array: number[], bonferonni: number = 1): Stats](#getstatsarray-number-bonferonni-number--1-stats)
        - [quickselect(array: number[], i: number, left: number = 0): number](#quickselectarray-number-i-number-left-number--0-number)
        - [quickselect<T>(array: T[], i: number, left?: number = 0, compare: <T>(a:T, b: T) => number): number](#quickselecttarray-t-i-number-left-number--0-compare-tat-b-t--number-number)
        - [quickselectFloat(array, i, left): number](#quickselectfloatarray-i-left-number)
        - [percentile(array, p, left)](#percentilearray-p-left)
        - [median(array)](#medianarray)
        - [MAD(array, median = median(array))](#madarray-median--medianarray)
    - [Statistical tests](#statistical-tests)
        - [`mwu(A: number[], B: number[]): {U: number, z: number, p:number}`](#mwua-number-b-number-u-number-z-number-pnumber)
        - [`wilcoxon(D: number[]): {T: number, z: number, p: number}`](#wilcoxond-number-t-number-z-number-p-number)
        - [`wilcoxon(A: number[], B: number): {T: number, z: number, p: number}`](#wilcoxona-number-b-number-t-number-z-number-p-number)
    - [Probability helpers](#probability-helpers)
        - [pForZ(z)](#pforzz)
        - [zForP(p)](#zforpp)<!-- END toc -->

## Median, MAD, percentiles and quickselect

### getStats(array: number[], bonferonni: number = 1): Stats

where `type Stats = {q1: number, lowCI: number, median: number, highCI: number, q3: number, MAD: number}`.

- `median` is the median of the array
- `MAD` is the [**m**edian **a**bsolute **d**eviation](https://en.wikipedia.org/wiki/Median_absolute_deviation) (see the dedicated section).
- `q1` and `q3` are the first and third quartiles
- `lowCI` and `highCI` are the bounds of the p=.95 confidence interval over the median, taking into account the bonferonni factor (the total number of comparisons to make, i.e. `n*(n-1)/2` for `n` categories).

Important: this is built on top of `quickselect()`. It will reorder the content of the array (see `quickselect()` for the details). If you want to do a Wilcoxon rank-sum test, it must be done before this step, or on an independant copy of the data set. This is because the Wilcoxon test relies on the order of the arrays to pair items.

### quickselect(array: number[], i: number, left: number = 0): number
### quickselect<T>(array: T[], i: number, left?: number = 0, compare: <T>(a:T, b: T) => number): number

`i`, `left` are integer indices between `0` and `array.length - 1`. `i` must be larger than or equal to `left`.

Reorders `array` such that
- `array[i]` is the value that we would get when doing `array.sort((a, b)=> a - b)[i]`
- all the elements smaller than that value end up to its left
- thus all the elements larger than `array[i]` end up to its right

Values with indices smaller than `left` are ignored.

A custom `compare` can be be provided. It must return a negative value when `a < b`, `0` when `a === b` and a positive value otherwise. It is mandatory for non-numeric arrays.

Returns `array[i]`.

If several values are needed for a given array, it is strategic to get them from the smallest to the largest index, using the previous index as the `left` parameter. This takes advantage of the way `quickselect()` reoders its input array.

Suppose we want to get both `i0` and `i1` where `i0` < `i1`, we can do

```JS
const v0 = quickselect(array, i0)
const v1 = quickselect(array, i1, i0)
```

When doing the second call, we know that the values at indices smaller than `i0` are smaller than `array[i0]`. They can thus be ignored, saving us some cycles.

Our implementation is derived from Vladimir Agafonkin's https://github.com/mourner/quickselect with minute modifications.

### quickselectFloat(array, i, left): number

Like `quickselect` but `i`, and `left`, can be floats. If the aren't integers, this will return a linear [interpolation](https://en.wikipedia.org/wiki/Percentile#The_linear_interpolation_between_closest_ranks_method)(†) between `Math.floor(i)` and `ceil(i)` proporional to the decimal part. 

`array` ends up with `array[ceil(i)]` equals to `array.sort((a, b) => a-b)[ceil(i)]` (see `quickselect()` for how the rest of the array ends up).

Values at indices smaller than `ceil(left)` are left untouched (see `quickselect` for the details)

†. My implementation is quite naive, there are considerations in that section that are beyond my current understanding.

### percentile(array, p, left)

Where `p` is a decimal value between `0` and `1`.

Equivalent to `quickselectFloat(array, p * (array.length - 1), left * (array.length - 1))`


### median(array)

Equivalent to `percentile(array, .5)`.

### MAD(array, median = median(array))

Returns the [**m**edian **a**bsolute **d**eviation](https://en.wikipedia.org/wiki/Median_absolute_deviation) of the array, a robust mesure of variablility that stands in for standard deviation.

It uses `quickselectFloat(array, (a, b) => abs(a - median) - abs(b - median))` under the hood and reorders the values in `array` accordingly.

## Statistical tests

We provide the Wilcoxon rank-sum test and the Mann-Whitne U test.

These are bare, limited versions of the corresponding SciPy routines. I've only implemented what I need for bunchmark, if you need more feel free to open an issue, or idealy a PR. Some things are easy to implement (one-tailed tests, optional continuity correction). Exact probability calculations and alternative zero-hanlding procedures for the Wilcoxon test would be a bit more involved.

### `mwu(A: number[], B: number[]): {U: number, z: number, p:number}`

The Mann-Whitney U test
- two tailed
- asymptotic p-value estimation (can't be used when N<8), with continuity correction (more conservative)
- Assumes that `A` and `B` don't contain NaNs 

Inspired by the second method found in https://en.wikipedia.org/w/index.php?title=Mann%E2%80%93Whitney_U_test&oldid=1188631305#Calculations 
  and sci-py for the tie correction of the variance computation

### `wilcoxon(D: number[]): {T: number, z: number, p: number}`

A Wilcoxon rank-sum test:
- two tailed
- Pratt signed-rank zero procedure
- asymptotic p-value estimation (can't be used when N < 10), with continuity correction (more conservative)
- Assumes that `D` doesn't contain NaNs

This is based on https://en.wikipedia.org/wiki/Wilcoxon_signed-rank_test#Ties and scipy.stats.wilcoxon

### `wilcoxon(A: number[], B: number): {T: number, z: number, p: number}`

Equivalent to `wilcoxon(D)` where D is the pairwise difference between `A` and `B`.
- Assumes that `A` and `B` don't contain NaNs 


## Probability helpers

Hereunder, "variable" is meant in the statistical sense.

### pForZ(z)

Gets the p-value corresponding to a z-value (the probability of finding a value smaller than z by chance in a normally distributied variable).

This is based on a z-table built with `scipy.stats.sf()` with `0.001` granularity in the z-domain, for `z` between `0` and `9.999`. That level of precision is sufficient for our use case.

To get even more precision, we'd have to approximate the integral from `-Infinity` to `z` for the normal distribution using the sum of trapeze algorithm (there are no closed-form equations to compute these values).

Equivalent to `scipy.stats.cdf(round(z, 3))` in SciPy or `pnorm(round(z, 3))` in R.

### zForP(p)

Find `z` such that the probability of finding a value smaller than than it in a normally distributed variable has a probability `p`.

Equivalent to `scipy.stats.norm.ppf(p)` in SciPy and `qnorm(p)` in R.

This is a direct port of the SciPy C++ version.
