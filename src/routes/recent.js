import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { repository } from '../store/repository.js';
import { AppError } from '../lib/AppError.js';

const router = Router();

router.get('/recent', asyncHandler(async (req, res) => {
  res.json({ tracks: repository.getRecent() });
}));

router.post('/recent', asyncHandler(async (req, res) => {
  const track = req.body;
  if (!track?.videoId) throw new AppError(400, 'BAD_REQUEST', 'videoId required');
  const tracks = repository.addRecent(track);
  res.status(200).json({ tracks });
}));

router.delete('/recent', asyncHandler(async (req, res) => {
  repository.clearRecent();
  res.status(204).end();
}));

export default router;
