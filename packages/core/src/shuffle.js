//@ts-check
// MIT License

// Copyright (c) 2018 Phil Busby

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

// Good old Fischer Yates

/**
 * @template T
 * @param {T[]} deck 
 * @param {()=>number} random 
 * @returns {T[]}
 */

export const shuffled = (deck, random = Math.random) => {
	let srcIndex = deck.length
	let dstIndex = 0
	const clone = deck.slice(0)
	const result = Array.from({length: srcIndex})
	
	while(srcIndex) {
		let randIndex = (srcIndex * random()) | 0
		result[dstIndex++] = clone[randIndex]
		clone[randIndex] = clone[--srcIndex]
	}
	
	return result
}
