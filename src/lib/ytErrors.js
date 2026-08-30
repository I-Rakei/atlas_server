import { AppError } from './AppError.js';

const PATTERNS = [
  { re: /video (is )?unavailable/i, status: 404, code: 'VIDEO_UNAVAILABLE' },
  { re: /Private video/i, status: 403, code: 'PRIVATE_VIDEO' },
  { re: /age-restricted|age restricted|Sign in to confirm your age/i, status: 403, code: 'AGE_RESTRICTED' },
  { re: /not available in your country|blocked it in your country/i, status: 451, code: 'GEO_BLOCKED' },
  { re: /Sign in to confirm you're not a bot|confirm you.re not a bot/i, status: 429, code: 'BOT_CHECK' },
  { re: /timed out|timeout/i, status: 504, code: 'TIMEOUT' },
];

export function mapYtdlpError(stderr = '') {
  for (const p of PATTERNS) {
    if (p.re.test(stderr)) {
      return new AppError(p.status, p.code, p.code.replace(/_/g, ' ').toLowerCase());
    }
  }
  return new AppError(502, 'YTDLP_ERROR', 'Failed to extract video', { stderr: stderr.slice(0, 500) });
}
