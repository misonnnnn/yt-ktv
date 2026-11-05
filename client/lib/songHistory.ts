import type { SearchResult } from "./types";

const STORAGE_KEY = "tara-song-history";
const DEFAULT_LIMIT = 50;

export type SongHistoryItem = {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
};

/** Newest songs kept on this browser. Set NEXT_PUBLIC_SONG_HISTORY_LIMIT to change it. */
export function songHistoryLimit(): number {
  const raw = Number(process.env.NEXT_PUBLIC_SONG_HISTORY_LIMIT);
  if (!Number.isFinite(raw) || raw < 1) return DEFAULT_LIMIT;
  return Math.floor(raw);
}

function isSongHistoryItem(value: unknown): value is SongHistoryItem {
  if (!value || typeof value !== "object") return false;
  const song = value as SongHistoryItem;
  return (
    typeof song.videoId === "string" &&
    typeof song.title === "string" &&
    typeof song.channelTitle === "string" &&
    typeof song.thumbnail === "string"
  );
}

export function readSongHistory(): SongHistoryItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSongHistoryItem).slice(0, songHistoryLimit());
  } catch {
    return [];
  }
}

/** Put this song at the front. Drop the oldest once the list is over the limit. */
export function rememberSong(song: SearchResult): SongHistoryItem[] {
  const next: SongHistoryItem[] = [
    {
      videoId: song.videoId,
      title: song.title,
      channelTitle: song.channelTitle,
      thumbnail: song.thumbnail || "",
    },
    ...readSongHistory().filter((item) => item.videoId !== song.videoId),
  ].slice(0, songHistoryLimit());

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Queue add already succeeded. A full or blocked store should not undo that.
  }

  return next;
}
