// Resolved-URL cache: videoId -> { url, expiresAt }
const cache = new Map();

function parseExpiry(url) {
  try {
    const u = new URL(url);
    const expire = u.searchParams.get('expire');
    if (expire) return Number(expire) * 1000;
  } catch {
    // ignore
  }
  return Date.now() + 5 * 60 * 1000; // fallback 5 min
}

export function getCached(videoId) {
  const entry = cache.get(videoId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt - 15000) {
    cache.delete(videoId);
    return null;
  }
  return entry;
}

export function setCached(videoId, url) {
  const expiresAt = parseExpiry(url);
  const entry = { url, expiresAt };
  cache.set(videoId, entry);
  return entry;
}

export function stats() {
  return { size: cache.size };
}
