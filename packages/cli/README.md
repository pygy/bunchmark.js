# @bunchmark/cli

`@bunchmark/cli` lets one bencmark JS code from the CLI

[Quick demo](./assets/Bunchmark.webm)

## Usage

In a nutshell:

```JS
// benchmark.js
import {run} from '@bunchmark/cli'

await run({
    preamble: () => {
        let result; setTimeout(()=>console.log(result))
        const ary = Array.from({length: 100}, ()=>Math.random())
    }
    tasks: [
        {
            name: "for loop",
            run(){
                for (let i = 0; i < ary.length; i++) result = ary[i]
            },
        },
        {
            name: "ary.forEach",
            run(){
                ary.forEach(x=>result = x) 
            },
        },
        {
            name: "for of",
            run(){
                for (const x of ary) result = x
            },
        }
    ]
})

process.exit(0)

```

### TODO: document every possible option