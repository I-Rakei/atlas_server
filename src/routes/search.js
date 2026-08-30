import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { searchTracks, getTrackInfo, getRecommendations } from '../services/ytdlp.service.js';
import { AppError } from '../lib/AppError.js';

const router = Router();

router.get('/search', asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const lyrics = req.query.lyrics === '1' || req.query.lyrics === 'true';
  if (!q) throw new AppError(400, 'BAD_REQUEST', 'q is required');
  const results = await searchTracks(q, limit, { lyrics });
  res.json({ results });
}));

router.get('/recommendations', asyncHandler(async (req, res) => {
  const genre = String(req.query.genre || '').trim();
  const limit = Math.min(Number(req.query.limit) || 24, 50);
  if (!genre) throw new AppError(400, 'BAD_REQUEST', 'genre is required');
  const results = await getRecommendations(genre, limit);
  res.json({ genre, results });
}));

router.get('/track/:videoId', asyncHandler(async (req, res) => {
  const track = await getTrackInfo(req.params.videoId);
  res.json(track);
}));

export default router;
