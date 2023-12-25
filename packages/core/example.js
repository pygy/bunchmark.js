import {compilePlain, compileIframe, run} from "./bunchmark.js"
import {pimpStats} from './stats.js'
import {svg} from "./viz.js"
const load = performance.now()

  // you can add `before()` and `after()` hooks
  // bunchmark doesn't run the functions, it
  // stitches the sources together in a flat scope
  // to avoid the overhead

const tasks = [
  {
    name: "for(let i = 0; i < ary.le ngth",
    run(){
      const array = getArray(2000)
      for(let i = 0; i < array.length; i++) result += array[i]
    }
  },
  {
    name: "array.forEach",
    run(){
      const array = getArray(2000)
      array.forEach((x)=>{result += x})
    }
  },
  {
    name: "array.forEach(addToResult)",
    run(){
      const array = getArray(2000)
      array.forEach(addToResult)
    }
  },

  {
    name: "for (const i in ary)",
    run(){
      const array = getArray(2000)
      for (const i in array) result+= array[i]
    }
  },
  {
    name: "for (const x of ary)",
    run(){
      const array = getArray(2000)
      for (const x of array) result += x
    }
  },
]



const prologue = () => {
  // make sure the benchmarks can't be eliminated as dead code
  let result
  setTimeout(()=>console.log(results), 0x7fffffff)

  const array = Array.from({length:20000}).map(()=>Math.random())
  const getArray = (n) => array.slice(0, n)
  
  function addToResult(x){result+=x}

}

// const tasks = compilePlain

const tasks2 = await compilePlain({
  reps: 300,
  prologue,
  beforeEach(){
    result = 4
  },
  tasks: Object.keys(tasks).map(name=>({
    name, ...tasks[name]
  }))
})

let loaded = false
run({
  tasks:tasks2,
  reps: ()=>300,
  onTick({i, tasks}){
    if (i <= 5) loading.innerHTML+="."
    else {
      if (!loaded) loading.innerHTML="Timing histogram"
      svg(tasks, Math.min(128, (i+1)))
      displayresults.innerHTML = (`<br>${(performance.now()-load)/1000|0}s, Results:<pre>${JSON.stringify(tasks.reduce((res, task) => {
        res[task.name] = pimpStats(task)
        delete res[task.name].results
        return res
      }, {}), null, 2)}</pre>`)
    }
  }
}).then(tasks=>{
    svg(tasks, 64)
    displayresults.innerHTML = (`<br>${(performance.now()-load)/1000|0}s, Results:<pre>${JSON.stringify(tasks.reduce((res, task) => {
    res[task.name] = pimpStats(task)
    delete task.result
    return res
  }, {}), null, 2)}</pre>`)
})


