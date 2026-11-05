"use client";

import { useEffect, useState } from "react";
import LibraryShell from "@/components/LibraryShell";
import LibrarySong, { Notice } from "@/components/LibrarySong";
import SongSearch from "@/components/SongSearch";
import { useAuth } from "@/components/AuthProvider";
import { listFavorites, removeFavorite, type SavedSong } from "@/lib/accountApi";
import { addSongToActiveParty } from "@/lib/activeParty";
import type { SearchResult } from "@/lib/types";

export default function FavoritesPage() {
  const { user, ready } = useAuth();
  const [songs, setSongs] = useState<SavedSong[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  async function load() {
    const data = await listFavorites();
    setSongs(data.songs);
  }

  useEffect(() => {
    if (!ready || !user) return;
    let cancelled = false;
    listFavorites()
      .then((data) => {
        if (!cancelled) setSongs(data.songs);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load favorites");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [ready, user]);

  async function addSaved(song: SavedSong) {
    setAddingId(song.videoId);
    setError(null);
    setNotice(null);
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

  async function addFromSearch(song: SearchResult) {
    try {
      await addSongToActiveParty({
        videoId: song.videoId,
        title: song.title,
        artist: song.channelTitle,
        thumbnail: song.thumbnail,
      });
      setError(null);
      setNotice(`Added “${song.title}” to the current party queue.`);
    } catch (err) {
      setNotice(null);
      setError(err instanceof Error ? err.message : "Could not add song");
    }
  }

  return (
    <LibraryShell
      title="My Favorites"
      intro="Songs you saved. Titles refresh from YouTube and are not kept forever."
    >
      <div className="space-y-6">
        {error && <Notice>{error}</Notice>}
        {notice && <Notice tone="ok">{notice}</Notice>}

        <section className="rounded-3xl border border-ktv-card-border bg-black/20 p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/40">
            Find a song
          </h2>
          <SongSearch
            onAddToQueue={addFromSearch}
            actionLabel="Add to party"
            onFavoritesChange={() => void load()}
          />
        </section>

        {songs.length === 0 ? (
          <p className="text-sm text-white/45">
            No favorites yet. Use the heart while searching, or save a song from a party.
          </p>
        ) : (
          <ul className="space-y-3">
            {songs.map((song) => (
              <LibrarySong
                key={song.videoId}
                title={song.title}
                artist={song.artist}
                thumbnail={song.thumbnail}
                adding={addingId === song.videoId}
                onAdd={() => void addSaved(song)}
                onRemove={() => {
                  void removeFavorite(song.videoId)
                    .then(load)
                    .catch((err: unknown) =>
                      setError(err instanceof Error ? err.message : "Could not remove song")
                    );
                }}
              />
            ))}
          </ul>
        )}
      </div>
    </LibraryShell>
  );
}
