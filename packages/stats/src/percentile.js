export const median = (ary) => {
	return percentile(ary, .5)
}
export const MAD = (results, med = median(results)) => median(results.map(r => Math.abs(r - med)))

export function percentile(ary, n, left = 0) {
	const scale = ary.length - 1
	return quickSelectFloat(ary, n * scale, left * scale)
}

export function quickSelectFloat(ary, target, left = 0) {
	if(left > target) throw new RangeError("left should be smaller than or equal to target")
	const floor = target | 0
	left = Math.ceil(left)
	// this can happen, mostly in small arrays or when dealing with close float values
	// it's just a perf loss.
	if (left === floor + 1) left = 0
	if(left > target) throw new RangeError("left should be smaller than or equal to target")
	if (target === floor) {
		return quickselect(ary, floor, left)
	} else {
		const diff = target - floor
		// linear interpollation between the two values
		return quickselect(ary, floor, left) * (1-diff) + quickselect(ary, floor + 1, floor) * diff
	}
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

export function quickselect(arr, k, left = 0, comparator) {
	if (typeof left !== 'function' && typeof comparator !== 'function') {
		quickselectStepInline(arr, k, left)
	}
	else {
		if (typeof left === 'function') {
			quickselectStep(arr, k, 0, void 0, left)
		} else {
			quickselectStep(arr, k, left, void 0, comparator)
		}
	}
	return arr[k]
}

function quickselectStep(arr, k, left = 0, right = arr.length -1, compare) {
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

function quickselectStepInline(arr, k, left=0, right=arr.length -1) {
	while (right > left) {
		if (right - left > 600) {
			var n = right - left + 1;
			var m = k - left + 1;
			var z = Math.log(n);
			var s = 0.5 * Math.exp(2 * z / 3);
			var sd = 0.5 * Math.sqrt(z * s * (n - s) / n) * (m - n / 2 < 0 ? -1 : 1);
			var newLeft = Math.max(left, Math.floor(k - m * s / n + sd));
			var newRight = Math.min(right, Math.floor(k + (n - m) * s / n + sd));
			quickselectStepInline(arr, k, newLeft, newRight);
		}

		var t = arr[k];
		var i = left;
		var j = right;

		swap(arr, left, k);
		if (arr[right] > t) swap(arr, left, right);

		while (i < j) {
			swap(arr, i, j);
			i++;
			j--;
			while (arr[i] < t) i++;
			while (arr[j] > t) j--;
		}

		if (arr[left] === t) swap(arr, left, j);
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

// end of  https://github.com/mourner/quickselect/blob/26a241497b101167ab43c27c077bed4729c6b697/index.js

