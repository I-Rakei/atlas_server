import { nanoid } from 'nanoid';
import { jsonStore } from './jsonStore.js';

export const repository = {
  // --- library hydration ---
  getLibrarySnapshot() {
    const d = jsonStore.get();
    return {
      playlists: d.playlists,
      likedCount: d.liked.length,
      recentlyPlayed: d.recentlyPlayed,
      settings: d.settings,
    };
  },

  // --- liked ---
  getLiked() {
    return jsonStore.get().liked;
  },
  getLikedIds() {
    return jsonStore.get().liked.map((t) => t.videoId);
  },
  likeTrack(track) {
    return jsonStore.mutate((d) => {
      if (!d.liked.find((t) => t.videoId === track.videoId)) {
        d.liked.unshift({ ...track, likedAt: Date.now() });
      }
    }).liked;
  },
  unlikeTrack(videoId) {
    return jsonStore.mutate((d) => {
      d.liked = d.liked.filter((t) => t.videoId !== videoId);
    }).liked;
  },

  // --- playlists ---
  getPlaylists() {
    return jsonStore.get().playlists;
  },
  getPlaylist(id) {
    return jsonStore.get().playlists.find((p) => p.id === id);
  },
  createPlaylist({ name, description = '' }) {
    const playlist = { id: nanoid(10), name, description, tracks: [], createdAt: Date.now(), updatedAt: Date.now() };
    jsonStore.mutate((d) => d.playlists.unshift(playlist));
    return playlist;
  },
  updatePlaylist(id, patch) {
    let updated = null;
    jsonStore.mutate((d) => {
      const p = d.playlists.find((x) => x.id === id);
      if (p) {
        Object.assign(p, patch, { updatedAt: Date.now() });
        updated = p;
      }
    });
    return updated;
  },
  deletePlaylist(id) {
    let existed = false;
    jsonStore.mutate((d) => {
      const before = d.playlists.length;
      d.playlists = d.playlists.filter((p) => p.id !== id);
      existed = d.playlists.length !== before;
    });
    return existed;
  },
  addTrackToPlaylist(id, track) {
    let updated = null;
    jsonStore.mutate((d) => {
      const p = d.playlists.find((x) => x.id === id);
      if (p && !p.tracks.find((t) => t.videoId === track.videoId)) {
        p.tracks.push({ ...track, addedAt: Date.now() });
        p.updatedAt = Date.now();
      }
      updated = p;
    });
    return updated;
  },
  removeTrackFromPlaylist(id, videoId) {
    let updated = null;
    jsonStore.mutate((d) => {
      const p = d.playlists.find((x) => x.id === id);
      if (p) {
        p.tracks = p.tracks.filter((t) => t.videoId !== videoId);
        p.updatedAt = Date.now();
      }
      updated = p;
    });
    return updated;
  },
  reorderPlaylistTracks(id, orderedVideoIds) {
    let updated = null;
    jsonStore.mutate((d) => {
      const p = d.playlists.find((x) => x.id === id);
      if (p) {
        const byId = new Map(p.tracks.map((t) => [t.videoId, t]));
        p.tracks = orderedVideoIds.map((vid) => byId.get(vid)).filter(Boolean);
        p.updatedAt = Date.now();
      }
      updated = p;
    });
    return updated;
  },

  // --- recent ---
  getRecent() {
    return jsonStore.get().recentlyPlayed;
  },
  addRecent(track) {
    return jsonStore.mutate((d) => {
      d.recentlyPlayed = [{ ...track, playedAt: Date.now() }, ...d.recentlyPlayed.filter((t) => t.videoId !== track.videoId)].slice(0, 50);
    }).recentlyPlayed;
  },
  clearRecent() {
    jsonStore.mutate((d) => (d.recentlyPlayed = []));
  },

  // --- queue ---
  getQueue() {
    return jsonStore.get().queue;
  },
  setQueue(queue) {
    return jsonStore.mutate((d) => (d.queue = queue)).queue;
  },

  // --- settings ---
  getSettings() {
    return jsonStore.get().settings;
  },
  patchSettings(patch) {
    return jsonStore.mutate((d) => Object.assign(d.settings, patch)).settings;
  },
};
