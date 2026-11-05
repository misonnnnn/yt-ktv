"use client";

import { useEffect, useState } from "react";
import LibraryShell from "@/components/LibraryShell";
import LibrarySong, { Notice } from "@/components/LibrarySong";
import { useAuth } from "@/components/AuthProvider";
import { clearRequests, listRequests, type SavedSong } from "@/lib/accountApi";
import { addSongToActiveParty } from "@/lib/activeParty";

function formatWhen(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function HistoryPage() {
  const { user, ready } = useAuth();
  const [playedOnly, setPlayedOnly] = useState(true);
  const [songs, setSongs] = useState<SavedSong[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !user) return;
    let cancelled = false;
    listRequests(playedOnly)
      .then((data) => {
        if (!cancelled) setSongs(data.songs);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load history");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [playedOnly, ready, user]);

  async function handleClear() {
    if (!window.confirm("Clear your song request history?")) return;
    setError(null);
    try {
      await clearRequests();
      setSongs([]);
      setNotice("History cleared.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not clear history");
    }
  }

  async function replay(song: SavedSong) {
    setAddingId(song.videoId);
    setError(null);
    try {
      await addSongToActiveParty({
        videoId: song.videoId,
        title: song.title || "Saved video",
        artist: song.artist || "YouTube",
        thumbnail: song.thumbnail,
      });
      setNotice("Added to the current party queue.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add song");
    } finally {
      setAddingId(null);
    }
  }

  return (
    <LibraryShell
      title="My History"
      intro="Songs you asked to sing. A turn is recorded once, when your request reaches the stage. Adding a song to the queue is not counted as sung, and TaraSing does not track YouTube watch time."
    >
      <div className="space-y-4">
        {error && <Notice>{error}</Notice>}
        {notice && <Notice tone="ok">{notice}</Notice>}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPlayedOnly(true)}
            className={`rounded-full px-3 py-1.5 text-sm ${
              playedOnly ? "bg-white text-[#140c24]" : "bg-white/5 text-white/70"
            }`}
          >
            Your turn started
          </button>
          <button
            type="button"
            onClick={() => setPlayedOnly(false)}
            className={`rounded-full px-3 py-1.5 text-sm ${
              !playedOnly ? "bg-white text-[#140c24]" : "bg-white/5 text-white/70"
            }`}
          >
            All requests
          </button>
          <button
            type="button"
            onClick={() => void handleClear()}
            className="ml-auto text-sm text-white/40 hover:text-white"
          >
            Clear history
          </button>
        </div>

        {songs.length === 0 ? (
          <p className="text-sm text-white/45">
            {playedOnly
              ? "None of your requests have reached the stage yet."
              : "You have not requested a song while signed in."}
          </p>
        ) : (
          <ul className="space-y-3">
            {songs.map((song) => (
              <LibrarySong
                key={song.id}
                title={song.title}
                artist={song.artist}
                thumbnail={song.thumbnail}
                adding={addingId === song.videoId}
                addLabel="Sing again"
                meta={
                  song.startedAt
                    ? `Turn started ${formatWhen(song.startedAt)}`
                    : `Requested ${formatWhen(song.requestedAt)}`
                }
                onAdd={() => void replay(song)}
              />
            ))}
          </ul>
        )}
      </div>
    </LibraryShell>
  );
}
