// Registry of spawned yt-dlp / ffmpeg children so we can guarantee no orphans on Windows.
const registry = new Set();

export function track(child) {
  registry.add(child);
  child.once('exit', () => registry.delete(child));
  return child;
}

export function killAll() {
  for (const child of registry) {
    try {
      if (!child.killed) child.kill('SIGKILL');
    } catch {
      // ignore
    }
  }
  registry.clear();
}

export function activeCount() {
  return registry.size;
}

process.on('exit', killAll);
