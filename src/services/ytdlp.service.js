import { spawn } from 'node:child_process';
import { config } from '../config.js';
import { mapYtdlpError } from '../lib/ytErrors.js';
import { track } from './children.js';

function baseArgs() {
  const args = [...config.ytdlpExtraArgs];
  if (config.ytdlpCookiesFile) args.push('--cookies', config.ytdlpCookiesFile);
  return args;
}

function runCapture(args, { timeoutMs = 20000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(config.ytdlpPath, args, { windowsHide: true });
    track(child);
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(mapYtdlpError('timeout'));
    }, timeoutMs);

    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0 && !stdout.trim()) {
        return reject(mapYtdlpError(stderr));
      }
      resolve({ stdout, stderr, code });
    });
  });
}

export async function searchTracks(query, limit = 20, { lyrics = false } = {}) {
  const effectiveQuery = lyrics ? `${query} lyrics` : query;
  const args = [...baseArgs(), `ytsearch${limit}:${effectiveQuery}`, '--flat-playlist', '--dump-single-json', '--no-warnings'];
  const { stdout } = await runCapture(args, { timeoutMs: 25000 });
  let json;
  try {
    json = JSON.parse(stdout);
  } catch {
    return [];
  }
  const entries = json.entries || [];
  return entries
    .filter((e) => e && e.id)
    .map((e) => ({
      videoId: e.id,
      title: e.title || 'Unknown title',
      channel: e.channel || e.uploader || 'Unknown channel',
      thumbnail: e.thumbnails?.length ? e.thumbnails[e.thumbnails.length - 1].url : `https://i.ytimg.com/vi/${e.id}/hqdefault.jpg`,
      durationSeconds: Math.round(e.duration || 0),
    }));
}

const recCache = new Map(); // genre::limit -> { results, expires }
const REC_TTL_MS = 10 * 60 * 1000;

export async function getRecommendations(genre, limit = 24) {
  const key = `${genre.toLowerCase()}::${limit}`;
  const hit = recCache.get(key);
  if (hit && hit.expires > Date.now()) return hit.results;
  const results = await searchTracks(`best ${genre} songs mix`, limit);
  recCache.set(key, { results, expires: Date.now() + REC_TTL_MS });
  return results;
}

export async function getTrackInfo(videoId) {
  const args = [...baseArgs(), `https://www.youtube.com/watch?v=${videoId}`, '--dump-single-json', '--no-warnings', '--no-playlist'];
  const { stdout } = await runCapture(args, { timeoutMs: 25000 });
  const e = JSON.parse(stdout);
  return {
    videoId: e.id,
    title: e.title,
    channel: e.channel || e.uploader,
    thumbnail: e.thumbnail || `https://i.ytimg.com/vi/${e.id}/hqdefault.jpg`,
    durationSeconds: Math.round(e.duration || 0),
  };
}

// Resolve a direct googlevideo URL for Mode A streaming.
export async function resolveDirectUrl(videoId) {
  const args = [
    ...baseArgs(),
    '-f',
    '140/bestaudio[ext=m4a]/bestaudio',
    '-g',
    `https://www.youtube.com/watch?v=${videoId}`,
    '--no-warnings',
    '--no-playlist',
  ];
  const { stdout } = await runCapture(args, { timeoutMs: 20000 });
  const url = stdout.trim().split('\n').pop();
  if (!url || !url.startsWith('http')) {
    throw mapYtdlpError('Video unavailable');
  }
  return url;
}

// Spawn yt-dlp streaming bestaudio to stdout for Mode B transcode fallback.
export function spawnAudioStream(videoId) {
  const args = [...baseArgs(), '-f', 'bestaudio', '-o', '-', `https://www.youtube.com/watch?v=${videoId}`, '--no-warnings', '--no-playlist'];
  const child = spawn(config.ytdlpPath, args, { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  track(child);
  return child;
}
