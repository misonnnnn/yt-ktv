"use client";

import { FormEvent, useState } from "react";
import { searchYouTube } from "@/lib/api";
import type { SearchResult } from "@/lib/types";

type SongSearchProps = {
  onAddToQueue: (song: SearchResult) => void;
  onClose?: () => void;
};

export default function SongSearch({ onAddToQueue, onClose }: SongSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();

    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const data = await searchYouTube(trimmed);
      setResults(data.results);
    } catch (err) {
      setResults([]);
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSearch} className="flex items-center gap-3">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
            🔍
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search karaoke songs..."
            className="w-full rounded-xl border border-ktv-card-border bg-white/5 py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            autoFocus
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="ktv-btn-primary rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "..." : "Search"}
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="ktv-btn-secondary rounded-xl px-4 py-3 text-sm font-medium"
          >
            Close
          </button>
        )}
      </form>

      {error && (
        <div className="rounded-xl bg-red-500/20 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {hasSearched && !loading && !error && (
        <p className="text-xs text-white/40">
          {results.length} result{results.length !== 1 ? "s" : ""}
        </p>
      )}

      {!hasSearched && (
        <p className="text-sm text-white/40">
          Type a song name and press Search. Results come from YouTube.
        </p>
      )}

      <ul className="space-y-3">
        {results.map((song) => (
          <li
            key={song.videoId}
            className="flex items-center gap-3 rounded-xl border border-ktv-card-border bg-ktv-card/60 p-3"
          >
            {song.thumbnail ? (
              <img
                src={song.thumbnail}
                alt=""
                className="h-16 w-24 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-900/60 to-pink-900/40">
                <span className="text-2xl">🎵</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-white">{song.title}</p>
              <p className="truncate text-sm text-white/50">
                {song.channelTitle}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onAddToQueue(song)}
              className="ktv-btn-primary shrink-0 rounded-xl px-4 py-2 text-sm font-semibold text-white"
            >
              Add to Queue
            </button>
          </li>
        ))}
      </ul>

      {hasSearched && !loading && results.length === 0 && !error && (
        <p className="py-8 text-center text-white/40">
          No songs found. Try a different search term.
        </p>
      )}
    </div>
  );
}
