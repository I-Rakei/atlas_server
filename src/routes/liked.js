import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { repository } from '../store/repository.js';
import { AppError } from '../lib/AppError.js';

const router = Router();

router.get('/liked', asyncHandler(async (req, res) => {
  res.json({ tracks: repository.getLiked() });
}));

router.get('/liked/ids', asyncHandler(async (req, res) => {
  res.json({ ids: repository.getLikedIds() });
}));

router.put('/liked/:videoId', asyncHandler(async (req, res) => {
  const track = { videoId: req.params.videoId, ...req.body };
  if (!track.videoId) throw new AppError(400, 'BAD_REQUEST', 'videoId required');
  const tracks = repository.likeTrack(track);
  res.status(200).json({ tracks });
}));

router.delete('/liked/:videoId', asyncHandler(async (req, res) => {
  const tracks = repository.unlikeTrack(req.params.videoId);
  res.status(200).json({ tracks });
}));

export default router;
