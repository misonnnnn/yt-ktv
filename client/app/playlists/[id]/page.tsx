"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import LibraryShell from "@/components/LibraryShell";
import LibrarySong, { Notice, fieldClass } from "@/components/LibrarySong";
import SongSearch from "@/components/SongSearch";
import { useAuth } from "@/components/AuthProvider";
import {
  addPlaylistSong,
  deletePlaylist,
  getPlaylist,
  removePlaylistSong,
  updatePlaylist,
  type PlaylistDetail,
} from "@/lib/accountApi";
import { addSongToActiveParty } from "@/lib/activeParty";
import type { SearchResult } from "@/lib/types";

export default function PlaylistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, ready } = useAuth();
  const playlistId = Number(params.id);
  const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = await getPlaylist(playlistId);
    setPlaylist(data.playlist);
    setName(data.playlist.name);
    setDescription(data.playlist.description || "");
  }, [playlistId]);

  useEffect(() => {
    if (!ready || !user || !Number.isFinite(playlistId)) return;
    let cancelled = false;
    getPlaylist(playlistId)
      .then((data) => {
        if (cancelled) return;
        setPlaylist(data.playlist);
        setName(data.playlist.name);
        setDescription(data.playlist.description || "");
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load playlist");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [playlistId, ready, user]);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const data = await updatePlaylist(playlistId, name, description);
      setPlaylist(data.playlist);
      setNotice("Playlist saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save playlist");
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this playlist?")) return;
    try {
      await deletePlaylist(playlistId);
      router.push("/playlists");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete playlist");
    }
  }

  async function handleSearchAdd(song: SearchResult) {
    setError(null);
    try {
      const data = await addPlaylistSong(playlistId, {
        videoId: song.videoId,
        title: song.title,
        artist: song.channelTitle,
        thumbnail: song.thumbnail,
      });
      setPlaylist(data.playlist);
      setNotice(`Saved “${song.title}” to this playlist.`);
    } catch (err) {
      setNotice(null);
      setError(err instanceof Error ? err.message : "Could not add song");
    }
  }

  async function addToParty(song: PlaylistDetail["songs"][number]) {
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

  async function addAll() {
    if (!playlist) return;
    setError(null);
    try {
      for (const song of playlist.songs) {
        await addSongToActiveParty({
          videoId: song.videoId,
          title: song.title || "Saved video",
          artist: song.artist || "YouTube",
          thumbnail: song.thumbnail,
        });
      }
      setNotice("Added the playlist to the current party queue.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add the playlist");
    }
  }

  return (
    <LibraryShell title={playlist?.name || "Playlist"}>
      <div className="space-y-6">
        <Link href="/playlists" className="text-sm text-purple-300 hover:underline">
          ← All playlists
        </Link>
        {error && <Notice>{error}</Notice>}
        {notice && <Notice tone="ok">{notice}</Notice>}

        <form
          onSubmit={handleSave}
          className="space-y-3 rounded-3xl border border-ktv-card-border bg-ktv-card/60 p-4"
        >
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={fieldClass}
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description"
            className={`${fieldClass} min-h-20`}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="ktv-btn-primary rounded-xl px-4 py-2 text-sm font-bold text-white"
            >
              Save details
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              className="ktv-btn-secondary rounded-xl px-4 py-2 text-sm text-white"
            >
              Delete playlist
            </button>
            {playlist && playlist.songs.length > 0 && (
              <button
                type="button"
                onClick={() => void addAll()}
                className="ktv-btn-secondary rounded-xl px-4 py-2 text-sm text-white"
              >
                Add all to party
              </button>
            )}
          </div>
        </form>

        <section className="rounded-3xl border border-ktv-card-border bg-black/20 p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/40">
            Add songs
          </h2>
          <SongSearch onAddToQueue={handleSearchAdd} actionLabel="Save" />
        </section>

        {!playlist || playlist.songs.length === 0 ? (
          <p className="text-sm text-white/45">This playlist is empty.</p>
        ) : (
          <ul className="space-y-3">
            {playlist.songs.map((song) => (
              <LibrarySong
                key={song.videoId}
                title={song.title}
                artist={song.artist}
                thumbnail={song.thumbnail}
                adding={addingId === song.videoId}
                onAdd={() => void addToParty(song)}
                onRemove={() => {
                  void removePlaylistSong(playlistId, song.videoId)
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
