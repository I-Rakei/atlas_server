import { spawn } from 'node:child_process';
import { config } from '../config.js';
import { spawnAudioStream } from './ytdlp.service.js';
import { track } from './children.js';
import { mapYtdlpError } from '../lib/ytErrors.js';

// yt-dlp stdout -> ffmpeg transcode -> response (audio/mpeg).
export function streamAudio(videoId, req, res) {
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
