import { Router } from 'express';
import { config } from '../config.js';
import { activeCount } from '../services/children.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { spawnSync } from 'node:child_process';

const router = Router();

router.get('/health', asyncHandler(async (req, res) => {
  let ytdlpVersion = null;
  let ffmpegVersion = null;
  try {
    ytdlpVersion = spawnSync(config.ytdlpPath, ['--version'], { windowsHide: true }).stdout.toString().trim();
  } catch {}
  try {
    ffmpegVersion = spawnSync(config.ffmpegPath, ['-version'], { windowsHide: true }).stdout.toString().split('\n')[0];
  } catch {}
  res.json({
    ok: true,
    ytdlpPath: config.ytdlpPath,
    ytdlpVersion,
    ffmpegPath: config.ffmpegPath,
    ffmpegVersion,
    activeChildren: activeCount(),
  });
}));

export default router;
