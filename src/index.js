import { createApp } from './app.js';
import { config } from './config.js';
import { logger } from './lib/logger.js';
import { jsonStore } from './store/jsonStore.js';
import { killAll } from './services/children.js';

const app = createApp();

const server = app.listen(config.port, '127.0.0.1', () => {
  logger.info(`Atlas server listening on http://127.0.0.1:${config.port}`);
});

let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`Received ${signal}, shutting down...`);
  const forceExit = setTimeout(() => {
    logger.warn('Force exit after timeout');
    process.exit(1);
  }, 4000);
  forceExit.unref();

  server.close(() => {
    jsonStore.flush();
    killAll();
    clearTimeout(forceExit);
    process.exit(0);
  });

  // in case server.close hangs (open keep-alive sockets), still clean up
  jsonStore.flush();
  killAll();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
