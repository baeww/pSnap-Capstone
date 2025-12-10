let myId = null;        // pool slot id (stable across tasks)
let taskIndex = null;   // task index for logging/result mapping
let totalWorkers = 0;
let barrier = null; // Int32Array over SharedArrayBuffer

// Atomics-based barrier
async function barrierWait() {
    //stop if no barrier
    if (!barrier) {
        console.warn(`Worker ${myId}: barrierWait() called without barrier initialized!`);
        return;
    }

    const ARRIVE_INDEX = 0;
    const GEN_INDEX = 1;

    // capture current generation
    const myGen = Atomics.load(barrier, GEN_INDEX);

    // increment arrival count
    const prevCount = Atomics.add(barrier, ARRIVE_INDEX, 1);
    const newCount = prevCount + 1;

    console.log(`Worker ${myId}: Arrived at barrier. Count is now ${newCount}/${totalWorkers}`);

    if (newCount === totalWorkers) {
        // Last worker enters here
        console.log(`Worker ${myId}: I am the last one! Releasing the barrier...`);
        
        // reset count and advance generation
        Atomics.store(barrier, ARRIVE_INDEX, 0);
        Atomics.add(barrier, GEN_INDEX, 1);
        
        // Wake up all waiting workers
        Atomics.notify(barrier, GEN_INDEX, totalWorkers - 1);
        
    } else {
        // wait at barrier
        const startWait = Date.now();
        console.log(`Worker ${myId}: 🛑 PAUSING execution at ${startWait}ms. Waiting for ${totalWorkers - newCount} more worker(s)...`);

        // This line freezes this thread until notified by the last worker
        const waitResult = Atomics.wait(barrier, GEN_INDEX, myGen);

        const endWait = Date.now();
        const duration = endWait - startWait;
        
        console.log(`Worker ${myId}: 🟢 RESUMED execution at ${endWait}ms. (Paused for ${duration}ms). Status: ${waitResult}`);
    }
}

// worker message handler
self.onmessage = async function (e) {
    const msg = e.data || {};

    // run message type case in case we want to separate by functionality
    if (msg.type === 'run') {
        const code = msg.code;
        const inputName = msg.inputName || 'value';
        const value = msg.value;
        totalWorkers = msg.totalWorkers;
        taskIndex = msg.index;
        myId = (msg.workerSlot !== undefined && msg.workerSlot !== null)
            ? msg.workerSlot
            : msg.index; // fallback for older messages

        // set up shared barrier from SAB
        if (msg.sharedBuffer) {
            barrier = new Int32Array(msg.sharedBuffer);
        } else {
            console.warn(`Worker ${myId}: no sharedBuffer provided; barrierWait() will be a no-op.`);
        }

            console.log(`Worker ${myId}: Starting execution (Task #${taskIndex}, Input: ${inputName}, Value: ${value})`);

        try {
	    //Fake computation time to test results
	    const randomWaitTime = 0;//Math.floor(Math.random() * 3000); 
            
            console.log(`Worker ${myId}: I am "working" for ${randomWaitTime}ms before hitting the barrier...`);
            
            // This pauses execution artificially to simulate uneven workloads
            await new Promise(resolve => setTimeout(resolve, randomWaitTime));
            // Build async function wrapper
            const asyncWrapperSrc = `
                return (async function(${inputName}) {
                    ${code}
                    return ${inputName}; // Returns the final value of the loop variable
                });
            `;

            const makeFn = new Function(asyncWrapperSrc);
            const fn = makeFn();

            // Execute and await script
            const result = await fn(value);

            console.log(`Worker ${myId}: Execution finished (Task #${taskIndex}), sending result: ${result}`);

            self.postMessage({
                type: 'done',
                index: taskIndex,
                result: result
            });

        } catch (err) {
            console.error(`Worker ${myId}: Script execution failed!`, err);
            self.postMessage({
                type: 'error',
                message: err && err.message ? err.message : String(err)
            });
        }
    }
};

