# @bunchmark/run

This contains the Web-related routines. At this point just an iframe-based task compiler.

```JS
// for client-side code:
import {run} from '@bunchmark/core'
import {compiler} from '@bunchmark/web'

await run(
    {
        tasks: [/*see the core documentation*/],
        compiler // this will sandbox the benchmark code in an iframe,
        html
    }
)
```
