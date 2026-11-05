"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LibraryShell from "@/components/LibraryShell";
import { Notice, fieldClass } from "@/components/LibrarySong";
import { useAuth } from "@/components/AuthProvider";
import {
  createPlaylist,
  listPlaylists,
  type PlaylistSummary,
} from "@/lib/accountApi";

export default function PlaylistsPage() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ready || !user) return;
    let cancelled = false;
    listPlaylists()
      .then((data) => {
        if (!cancelled) setPlaylists(data.playlists);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load playlists");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [ready, user]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await createPlaylist(name, description);
      router.push(`/playlists/${data.playlist.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create playlist");
      setLoading(false);
    }
  }

  return (
    <LibraryShell
      title="My Playlists"
      intro="Personal lists for songs you want to sing. Each playlist belongs only to you."
    >
      <div className="space-y-6">
        {error && <Notice>{error}</Notice>}
        <form
          onSubmit={handleCreate}
          className="space-y-3 rounded-3xl border border-ktv-card-border bg-ktv-card/60 p-4"
        >
          <input
            required
            placeholder="Playlist name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={fieldClass}
          />
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className={`${fieldClass} min-h-20`}
          />
          <button
            type="submit"
            disabled={loading}
            className="ktv-btn-primary rounded-xl px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create playlist"}
          </button>
        </form>

        {playlists.length === 0 ? (
          <p className="text-sm text-white/45">No playlists yet.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {playlists.map((playlist) => (
              <li key={playlist.id}>
                <Link
                  href={`/playlists/${playlist.id}`}
                  className="block rounded-3xl border border-ktv-card-border bg-ktv-card/70 p-5 hover:border-purple-400/40"
                >
                  <p className="text-lg font-semibold text-white">{playlist.name}</p>
                  {playlist.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-white/50">
                      {playlist.description}
                    </p>
                  )}
                  <p className="mt-3 text-xs text-white/35">
                    {playlist.songCount} song{playlist.songCount === 1 ? "" : "s"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </LibraryShell>
  );
}
