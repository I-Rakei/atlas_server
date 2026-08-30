import { spawn } from 'node:child_process';
import { config } from '../config.js';
import { resolveDirectUrl, spawnAudioStream } from './ytdlp.service.js';
import { getCached, setCached } from './cache.service.js';
import { track } from './children.js';
import { AppError } from '../lib/AppError.js';
import { mapYtdlpError } from '../lib/ytErrors.js';

async function getResolvedUrl(videoId) {
  const cached = getCached(videoId);
  if (cached) return cached.url;
  const url = await resolveDirectUrl(videoId);
  setCached(videoId, url);
  return url;
}

// Mode A: Range-proxy the resolved googlevideo URL.
export async function streamModeA(videoId, req, res) {
  const url = await getResolvedUrl(videoId);
  const headers = {};
  if (req.headers.range) headers.range = req.headers.range;

  let upstream;
  try {
    upstream = await fetch(url, { headers, method: req.method === 'HEAD' ? 'HEAD' : 'GET' });
  } catch (err) {
    throw new AppError(502, 'UPSTREAM_ERROR', 'Failed to reach upstream media host');
  }

  if (upstream.status === 403 || upstream.status === 404) {
    // URL expired/invalid — bust cache once and let caller retry Mode A or fall back.
    throw new AppError(403, 'STREAM_EXPIRED', 'Resolved stream URL rejected by upstream');
  }
  if (!upstream.ok && upstream.status !== 206) {
    throw new AppError(502, 'UPSTREAM_ERROR', `Upstream responded ${upstream.status}`);
  }

  res.status(upstream.status);
  const passthroughHeaders = ['content-type', 'content-length', 'content-range', 'accept-ranges'];
  for (const h of passthroughHeaders) {
    const v = upstream.headers.get(h);
    if (v) res.setHeader(h, v);
  }
  if (!res.getHeader('accept-ranges')) res.setHeader('accept-ranges', 'bytes');
  if (!res.getHeader('content-type')) res.setHeader('content-type', 'audio/mp4');

  if (req.method === 'HEAD' || !upstream.body) {
    return res.end();
  }

  const reader = upstream.body.getReader();
  req.on('close', () => reader.cancel().catch(() => {}));
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!res.write(Buffer.from(value))) {
        await new Promise((resolve) => res.once('drain', resolve));
      }
    }
  } catch {
    // client aborted or stream errored; nothing to do
  } finally {
    res.end();
  }
}

// Mode B: yt-dlp stdout -> ffmpeg transcode -> response (audio/mpeg).
export function streamModeB(videoId, req, res) {
  return new Promise((resolve, reject) => {
    const ytChild = spawnAudioStream(videoId);
    const ffArgs = ['-i', 'pipe:0', '-vn', '-c:a', 'libmp3lame', '-b:a', '160k', '-f', 'mp3', 'pipe:1'];
    const ffChild = spawn(config.ffmpegPath, ffArgs, { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
    track(ffChild);

    let settled = false;
    let ytStderr = '';
    ytChild.stderr.on('data', (d) => (ytStderr += d));
    ytChild.stdout.pipe(ffChild.stdin);
    ytChild.stdout.on('error', () => {});
    ffChild.stdin.on('error', () => {}); // swallow EPIPE on client abort

    res.status(200);
    res.setHeader('content-type', 'audio/mpeg');
    res.setHeader('transfer-encoding', 'chunked');
    res.setHeader('accept-ranges', 'none');

    ffChild.stdout.pipe(res);

    const cleanup = () => {
      try { ytChild.kill('SIGKILL'); } catch {}
      try { ffChild.kill('SIGKILL'); } catch {}
    };

    req.on('close', cleanup);

    ffChild.on('error', (err) => {
      if (!settled) { settled = true; cleanup(); reject(err); }
    });
    ytChild.on('error', (err) => {
      if (!settled) { settled = true; cleanup(); reject(err); }
    });
    ffChild.on('close', () => {
      if (!settled) { settled = true; resolve(); }
    });
    ytChild.on('close', (code) => {
      if (code !== 0 && !settled && !res.headersSent) {
        settled = true;
        cleanup();
        reject(mapYtdlpError(ytStderr));
      }
    });
  });
}
