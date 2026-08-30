import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { streamAudio } from '../services/stream.service.js';

const router = Router();

router.all('/stream/:videoId', asyncHandler(async (req, res) => {
  await streamAudio(req.params.videoId, req, res);
}));

export default router;
