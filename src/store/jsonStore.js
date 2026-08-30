import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import { logger } from '../lib/logger.js';

const FILE = path.join(config.dataDir, 'library.json');
const TMP = FILE + '.tmp';

function defaultData() {
  return {
    version: 1,
    playlists: [],
    liked: [],
    recentlyPlayed: [],
    queue: { trackIds: [], index: 0 },
    settings: { volume: 1, repeat: 'off', shuffle: false },
  };
}

function load() {
  if (!fs.existsSync(config.dataDir)) fs.mkdirSync(config.dataDir, { recursive: true });
  if (!fs.existsSync(FILE)) {
    const fresh = defaultData();
    fs.writeFileSync(FILE, JSON.stringify(fresh, null, 2));
    return fresh;
  }
  try {
    const raw = fs.readFileSync(FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return { ...defaultData(), ...parsed };
  } catch (err) {
    logger.warn('Corrupt library.json, resetting:', err.message);
    const bad = FILE + '.corrupt.' + Date.now();
    try { fs.renameSync(FILE, bad); } catch {}
    const fresh = defaultData();
    fs.writeFileSync(FILE, JSON.stringify(fresh, null, 2));
    return fresh;
  }
}

let data = load();
let flushTimer = null;
const DEBOUNCE_MS = 250;

function flush() {
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
  try {
    fs.writeFileSync(TMP, JSON.stringify(data, null, 2));
    fs.renameSync(TMP, FILE);
  } catch (err) {
    logger.error('Failed to flush store:', err.message);
  }
}

function scheduleFlush() {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flush, DEBOUNCE_MS);
}

export const jsonStore = {
  get() {
    return data;
  },
  mutate(fn) {
    fn(data);
    scheduleFlush();
    return data;
  },
  flush,
};

process.on('beforeExit', flush);
process.on('exit', flush);
