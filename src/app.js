import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import fs from 'node:fs';
import { config } from './config.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

import healthRoute from './routes/health.js';
import searchRoute from './routes/search.js';
import streamRoute from './routes/stream.js';
import libraryRoute from './routes/library.js';
import likedRoute from './routes/liked.js';
import playlistsRoute from './routes/playlists.js';
import recentRoute from './routes/recent.js';
import queueRoute from './routes/queue.js';
import settingsRoute from './routes/settings.js';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(morgan('dev'));
  app.use(express.json());

  const api = express.Router();
  api.use(healthRoute);
  api.use(searchRoute);
  api.use(streamRoute);
  api.use(libraryRoute);
  api.use(likedRoute);
  api.use(playlistsRoute);
  api.use(recentRoute);
  api.use(queueRoute);
  api.use(settingsRoute);
  app.use('/api', api);

  if (fs.existsSync(config.clientDist)) {
    app.use(express.static(config.clientDist));
    app.get('/*splat', (req, res) => {
      res.sendFile(`${config.clientDist}/index.html`);
    });
  }

  app.use('/api', notFoundHandler);
  app.use(errorHandler);

  return app;
}
