import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { repository } from '../store/repository.js';

const router = Router();

router.get('/settings', asyncHandler(async (req, res) => {
  res.json(repository.getSettings());
}));

router.patch('/settings', asyncHandler(async (req, res) => {
  const settings = repository.patchSettings(req.body || {});
  res.status(200).json(settings);
}));

export default router;
