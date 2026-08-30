import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { repository } from '../store/repository.js';
import { AppError } from '../lib/AppError.js';

const router = Router();

router.get('/playlists', asyncHandler(async (req, res) => {
  res.json({ playlists: repository.getPlaylists() });
}));

router.post('/playlists', asyncHandler(async (req, res) => {
  const { name, description } = req.body || {};
  if (!name || !name.trim()) throw new AppError(400, 'BAD_REQUEST', 'name is required');
  const playlist = repository.createPlaylist({ name: name.trim(), description });
  res.status(201).json(playlist);
}));

router.get('/playlists/:id', asyncHandler(async (req, res) => {
  const playlist = repository.getPlaylist(req.params.id);
  if (!playlist) throw new AppError(404, 'NOT_FOUND', 'Playlist not found');
  res.json(playlist);
}));

router.patch('/playlists/:id', asyncHandler(async (req, res) => {
  const playlist = repository.updatePlaylist(req.params.id, req.body || {});
  if (!playlist) throw new AppError(404, 'NOT_FOUND', 'Playlist not found');
  res.json(playlist);
}));

router.delete('/playlists/:id', asyncHandler(async (req, res) => {
  const existed = repository.deletePlaylist(req.params.id);
  if (!existed) throw new AppError(404, 'NOT_FOUND', 'Playlist not found');
  res.status(204).end();
}));

router.post('/playlists/:id/tracks', asyncHandler(async (req, res) => {
  const track = req.body;
  if (!track?.videoId) throw new AppError(400, 'BAD_REQUEST', 'videoId required');
  const playlist = repository.addTrackToPlaylist(req.params.id, track);
  if (!playlist) throw new AppError(404, 'NOT_FOUND', 'Playlist not found');
  res.status(200).json(playlist);
}));

router.delete('/playlists/:id/tracks/:videoId', asyncHandler(async (req, res) => {
  const playlist = repository.removeTrackFromPlaylist(req.params.id, req.params.videoId);
  if (!playlist) throw new AppError(404, 'NOT_FOUND', 'Playlist not found');
  res.status(200).json(playlist);
}));

router.patch('/playlists/:id/tracks/order', asyncHandler(async (req, res) => {
  const { order } = req.body || {};
  if (!Array.isArray(order)) throw new AppError(400, 'BAD_REQUEST', 'order must be an array of videoIds');
  const playlist = repository.reorderPlaylistTracks(req.params.id, order);
  if (!playlist) throw new AppError(404, 'NOT_FOUND', 'Playlist not found');
  res.status(200).json(playlist);
}));

export default router;
