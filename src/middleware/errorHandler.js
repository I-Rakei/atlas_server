import { AppError } from '../lib/AppError.js';
import { logger } from '../lib/logger.js';

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    // streaming response already started; just terminate quietly
    logger.warn('Error after headers sent:', err.message);
    return res.end();
  }
  if (err instanceof AppError) {
    return res.status(err.status).json(err.toJSON());
  }
  logger.error(err);
  return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
}
