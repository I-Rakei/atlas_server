import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { streamModeA, streamModeB } from '../services/stream.service.js';
import { logger } from '../lib/logger.js';

const router = Router();

router.all('/stream/:videoId', asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const forceTranscode = req.query.transcode === '1';

  if (forceTranscode) {
    return streamModeB(videoId, req, res);
  }

  try {
    await streamModeA(videoId, req, res);
  } catch (err) {
    if (res.headersSent) throw err;
    logger.warn(`Mode A failed for ${videoId}, falling back to Mode B:`, err.message);
    return streamModeB(videoId, req, res);
  }
}));

export default router;
