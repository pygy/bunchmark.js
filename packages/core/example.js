// @ts-check
import {run} from "./core.js"

// import {pimpStats} from './stats.js'

const load = performance.now()

  // you can add `before()` and `after()` hooks
  // bunchmark doesn't run the functions, it
  // stitches the sources together in a flat scope
  // to avoid the overhead

  
const tasks = [
  {
    name: "for(let i = 0; i < ary.le ngth",
    run(){// @ts-ignore
      const array = getArray(2000)// @ts-ignore
      for(let i = 0; i < array.length; i++) result += array[i]
    }
  },
  {
    name: "array.forEach",
    run(){// @ts-ignore
      const array = getArray(2000)// @ts-ignore
      array.forEach((x)=>{result += x})
    }
  },
  {
    name: "array.forEach(addToResult)",
    run(){// @ts-ignore
      const array = getArray(2000)// @ts-ignore
      array.forEach(addToResult)
    }
  },

  {
    name: "for (const i in ary)",
    run(){// @ts-ignore
      const array = getArray(2000)// @ts-ignore
      for (const i in array) result+= array[i]
    }
  },
  {
    name: "for (const x of ary)",
    run(){// @ts-ignore
      const array = getArray(2000)// @ts-ignore
      for (const x of array) result += x
    }
  },
]


const preamble = () => {
  // make sure the benchmarks can't be eliminated as dead code
  let result// @ts-ignore
  setTimeout(()=>console.log(results), 0x7fffffff)

  const array = Array.from({length:20000}).map(()=>Math.random())
  const getArray = (n) => array.slice(0, n)
  
  function addToResult(x){result+=x}

}

const handle = {}
const result= run({
  reps: 300,
  preamble,
  beforeEach(){
    // @ts-ignore
    result = 4
  },
  tasks: Object.keys(tasks).map(name=>({
    name, ...tasks[name]
  })),
  handle,
  onTick({i, reps, entries}){
    console.log(entries)
    if (i === 5) {
      handle.pause(true)
      const X = setInterval(()=>console.log(i++), 500)
      setTimeout(()=>{
        clearInterval(X)
        console.log("resuming")
        setTimeout(()=>handle.pause(false), 500)
      }, 3000)
    }
  }// @ts-ignore
})

const {i, reps, entries} = await result

console.log("done")
console.log(entries)

