import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { repository } from '../store/repository.js';

const router = Router();

router.get('/library', asyncHandler(async (req, res) => {
  res.json(repository.getLibrarySnapshot());
}));

export default router;
