"use client";

import { FormEvent, useEffect, useState } from "react";
import { searchYouTube } from "@/lib/api";
import type { SearchResult } from "@/lib/types";

const POPULAR_QUERY = "karaoke songs";
const POPULAR_LIMIT = 7;
const SEARCH_DELAY_MS = 1000; // wait 1 second after typing stops

type SongSearchProps = {
  onAddToQueue: (song: SearchResult) => void;
  onClose?: () => void;
};

function SongRow({
  song,
  onAddToQueue,
}: {
  song: SearchResult;
  onAddToQueue: (song: SearchResult) => void;
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-ktv-card-border bg-ktv-card/60 p-3">
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
        <p className="truncate text-sm text-white/50">{song.channelTitle}</p>
      </div>
      <button
        type="button"
        onClick={() => onAddToQueue(song)}
        className="ktv-btn-primary shrink-0 rounded-xl px-4 py-2 text-sm font-semibold text-white"
      >
        Add to Queue
      </button>
    </li>
  );
}

export default function SongSearch({ onAddToQueue, onClose }: SongSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [popularSongs, setPopularSongs] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [popularLoading, setPopularLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Load a few real karaoke videos for people who don't know what to pick
  useEffect(() => {
    let cancelled = false;

    async function loadPopular() {
      setPopularLoading(true);
      try {
        const data = await searchYouTube(POPULAR_QUERY);
        if (!cancelled) {
          setPopularSongs(data.results.slice(0, POPULAR_LIMIT));
        }
      } catch {
        // Popular list is optional — search still works if this fails
        if (!cancelled) setPopularSongs([]);
      } finally {
        if (!cancelled) setPopularLoading(false);
      }
    }

    void loadPopular();
    return () => {
      cancelled = true;
    };
  }, []);

  // Debounced search: wait 1s after the user stops typing
  useEffect(() => {
    const trimmed = query.trim();

    // Empty box → show popular songs again
    if (!trimmed) {
      setHasSearched(false);
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let cancelled = false;

    const timer = setTimeout(async () => {
      setHasSearched(true);

      try {
        const data = await searchYouTube(trimmed);
        if (!cancelled) setResults(data.results);
      } catch (err) {
        if (!cancelled) {
          setResults([]);
          setError(err instanceof Error ? err.message : "Search failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, SEARCH_DELAY_MS);

    // If they type again before 1s, cancel this search
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  // Search button still works right away (no waiting for debounce)
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

  function showPopularAgain() {
    setHasSearched(false);
    setResults([]);
    setQuery("");
    setError(null);
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

      {/* Real YouTube karaoke videos before the user searches */}
      {!hasSearched && (
        <div>
          <p className="mb-3 text-sm text-white/50">
            Not sure what to sing? Try one of these:
          </p>

          {popularLoading && (
            <p className="py-6 text-center text-sm text-white/40">
              Loading popular songs...
            </p>
          )}

          {!popularLoading && popularSongs.length === 0 && (
            <p className="py-6 text-center text-sm text-white/40">
              Could not load suggestions. Search for a song above.
            </p>
          )}

          <ul className="space-y-3">
            {popularSongs.map((song) => (
              <SongRow
                key={song.videoId}
                song={song}
                onAddToQueue={onAddToQueue}
              />
            ))}
          </ul>
        </div>
      )}

      {hasSearched && (
        <>
          {!loading && !error && (
            <p className="text-xs text-white/40">
              {results.length} result{results.length !== 1 ? "s" : ""}
              {" · "}
              <button
                type="button"
                onClick={showPopularAgain}
                className="text-purple-300 hover:underline"
              >
                Back to popular
              </button>
            </p>
          )}

          {loading && (
            <p className="py-6 text-center text-sm text-white/40">
              Searching...
            </p>
          )}

          {!loading && (
            <ul className="space-y-3">
              {results.map((song) => (
                <SongRow
                  key={song.videoId}
                  song={song}
                  onAddToQueue={onAddToQueue}
                />
              ))}
            </ul>
          )}

          {!loading && results.length === 0 && !error && (
            <p className="py-8 text-center text-white/40">
              No songs found. Try a different search term.
            </p>
          )}
        </>
      )}
    </div>
  );
}
