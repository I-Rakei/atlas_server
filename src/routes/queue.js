import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { repository } from '../store/repository.js';

const router = Router();

router.get('/queue', asyncHandler(async (req, res) => {
  res.json(repository.getQueue());
}));

router.put('/queue', asyncHandler(async (req, res) => {
  const queue = repository.setQueue(req.body || {});
  res.status(200).json(queue);
}));

export default router;
