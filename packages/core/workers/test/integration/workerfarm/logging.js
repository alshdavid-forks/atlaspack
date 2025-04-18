// eslint-disable-next-line @atlaspack/no-self-package-imports
const WorkerFarm = require('@atlaspack/workers').default;
const Logger = require('@atlaspack/logger').default;

function run() {
  if (WorkerFarm.isWorker()) {
    // Only test this behavior in workers. Logging in the main process will
    // always work.
    Logger.info({
      origin: 'logging-worker',
      message: 'omg it works'
    });
    Logger.error({
      origin: 'logging-worker',
      message: 'errors objects dont work yet'
    });
  }
}

exports.run = run;
