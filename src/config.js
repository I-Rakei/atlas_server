import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpegPath from 'ffmpeg-static';
import { constants } from 'youtube-dl-exec';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

export const config = {
  port: Number(process.env.PORT) || 8787,
  rootDir,
  dataDir: path.join(rootDir, 'data'),
  cacheDir: path.join(rootDir, 'cache'),
  clientDist: path.resolve(rootDir, '..', 'client', 'dist'),
  ytdlpPath: process.env.YTDLP_PATH || constants.YOUTUBE_DL_PATH,
  ffmpegPath: process.env.FFMPEG_PATH || ffmpegPath,
  ytdlpExtraArgs: (process.env.YTDLP_EXTRA_ARGS || '').split(' ').filter(Boolean),
  ytdlpCookiesFile: process.env.YTDLP_COOKIES_FILE || null,
};
