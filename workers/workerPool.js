// Worker pool logic for background tasks
const { Worker } = require('worker_threads');

class WorkerPool {
    constructor(size, workerScript) {
        this.size = size;
        this.workers = [];
        this.queue = [];
        this.workerScript = workerScript;
        this.initialize();
    }

    initialize() {
        for (let i = 0; i < this.size; i++) {
            this.addWorker();
        }
    }

    addWorker() {
        const worker = new Worker(this.workerScript);
        worker.on('error', this.handleWorkerError.bind(this));
        worker.on('exit', (code) => {
            if (code !== 0) {
                this.handleWorkerExit(worker);
            }
        });
        this.workers.push({ worker, busy: false });
    }

    handleWorkerError(error) {
        console.error('Worker error:', error);
    }

    handleWorkerExit(worker) {
        this.workers = this.workers.filter(w => w.worker !== worker);
        this.addWorker();
    }

    async runTask(data) {
        return new Promise((resolve, reject) => {
            const availableWorker = this.workers.find(w => !w.busy);

            if (availableWorker) {
                availableWorker.busy = true;

                const timeoutId = setTimeout(() => {
                    availableWorker.busy = false;
                    reject(new Error('Worker task timed out'));
                }, 30000);

                availableWorker.worker.once('message', (result) => {
                    clearTimeout(timeoutId);
                    availableWorker.busy = false;
                    resolve(result);
                    if (this.queue.length > 0) {
                        const next = this.queue.shift();
                        this.runTask(next.data).then(next.resolve).catch(next.reject);
                    }
                });

                availableWorker.worker.once('error', (error) => {
                    clearTimeout(timeoutId);
                    availableWorker.busy = false;
                    reject(error);
                });

                availableWorker.worker.postMessage(data);
            } else {
                this.queue.push({ data, resolve, reject });
            }
        });
    }
}

module.exports = WorkerPool;
