from numpy import (isscalar, r_, log, around, unique, asarray, zeros,
                   arange, sort, amin, amax, sqrt, array, atleast_1d,  # noqa: F401
                   compress, pi, exp, ravel, count_nonzero, sin, cos,
                   arctan2, hypot)

import numpy as np

from collections import namedtuple

def rankdata(a, method='average', *, axis=None, nan_policy='propagate'):
    a = np.asarray(a)
    arr = np.ravel(a)
    nan_indexes = None
    algo = 'quicksort'
    sorter = np.argsort(arr, kind=algo)
    inv = np.empty(sorter.size, dtype=np.intp)
    inv[sorter] = np.arange(sorter.size, dtype=np.intp)
    arr = arr[sorter]
    obs = np.r_[True, arr[1:] != arr[:-1]]
    dense = obs.cumsum()[inv]
    count = np.r_[np.nonzero(obs)[0], len(obs)]
    result = .5 * (count[dense] + count[dense - 1] + 1)
    return result



RepeatedResults = namedtuple('RepeatedResults', ('values', 'counts'))

def _find_repeats(arr):
    # This function assumes it may clobber its input.
    if len(arr) == 0:
        return np.array(0, np.float64), np.array(0, np.intp)
    # XXX This cast was previously needed for the Fortran implementation,
    # should we ditch it?
    arr = np.asarray(arr, np.float64).ravel()
    arr.sort()
    # Taken from NumPy 1.9's np.unique.
    change = np.concatenate(([True], arr[1:] != arr[:-1]))
    unique = arr[change]
    change_idx = np.concatenate(np.nonzero(change) + ([arr.size],))
    freq = np.diff(change_idx)
    atleast2 = freq > 1
    return unique[atleast2], freq[atleast2]

def find_repeats(arr):
    return RepeatedResults(*_find_repeats(np.array(arr, dtype=np.float64)))


WilcoxonResult = namedtuple('WilcoxonResult', ('T', 'z', 'p'))

def wilcoxon_outputs(kwds):
    method = kwds.get('method', 'auto')
    if method == 'approx':
        return 3
    return 2

def wilcoxon(x, y=None):
    if y is None:
        d = asarray(x)
        if d.ndim > 1:
            raise ValueError('Sample x must be one-dimensional.')
    else:
        x, y = map(asarray, (x, y))
        if x.ndim > 1 or y.ndim > 1:
            raise ValueError('Samples x and y must be one-dimensional.')
        if len(x) != len(y):
            raise ValueError('The samples x and y must have the same length.')
        # Future enhancement: consider warning when elements of `d` appear to
        # be tied but are numerically distinct.
        d = x - y
    n_zero = np.sum(d == 0)
    if n_zero == len(d):
        raise ValueError("zero_method 'wilcox' and 'pratt' do not "
                            "work if x - y is zero for all elements.")
    count = len(d)
    r = rankdata(abs(d))
    r_plus = np.sum((d > 0) * r)
    r_minus = np.sum((d < 0) * r)
    print ("r plus: ", r_plus, ", r minus: ", r_minus)
    T = min(r_plus, r_minus)
    mn = count * (count + 1.) * 0.25
    se = count * (count + 1.) * (2. * count + 1.)
    r = r[d != 0]
    # normal approximation needs to be adjusted, see Cureton (1967)
    mn -= n_zero * (n_zero + 1.) * 0.25
    se -= n_zero * (n_zero + 1.) * (2. * n_zero + 1.)
    replist, repnum = find_repeats(r)
    if repnum.size != 0:
        # Correction for repeated elements.
        se -= 0.5 * (repnum * (repnum * repnum - 1)).sum()
    se = sqrt(se / 24)
    # apply continuity correction if applicable
    d = 0.5 * np.sign(T - mn)
    # compute statistic and p-value using normal approximation
    print ("m: ", mn, ", sd: ", se, ", d: ", d)
    z = (T - mn - d) / se
    prob = 2. *  stats.norm.sf(abs(z))
    res = WilcoxonResult(T, z, prob)
    return res
