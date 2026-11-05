"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { listPopularSongs, searchYouTube } from "@/lib/api";
import { addFavorite, listFavorites, removeFavorite } from "@/lib/accountApi";
import type { SearchResult } from "@/lib/types";

const SEARCH_DELAY_MS = 1000; // wait 1 second after typing stops

type SongSearchProps = {
  onAddToQueue: (song: SearchResult) => void | Promise<void>;
  onClose?: () => void;
  actionLabel?: string;
  onFavoritesChange?: () => void;
};

function SongRow({
  song,
  onAdd,
  adding,
  disabled,
  actionLabel,
  saved,
  onToggleSave,
}: {
  song: SearchResult;
  onAdd: (song: SearchResult) => void;
  adding: boolean;
  disabled: boolean;
  actionLabel: string;
  saved: boolean;
  onToggleSave: (song: SearchResult) => void;
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
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => onToggleSave(song)}
          aria-label={saved ? "Remove from favorites" : "Save to favorites"}
          className={`rounded-xl px-2 py-2 text-lg ${
            saved ? "text-pink-400" : "text-white/40 hover:text-pink-300"
          }`}
        >
          {saved ? "♥" : "♡"}
        </button>
        <button
          type="button"
          onClick={() => onAdd(song)}
          disabled={disabled}
          aria-label={adding ? "Adding" : actionLabel}
          className={`ktv-btn-primary flex h-9 w-9 items-center justify-center rounded-xl text-white sm:h-auto sm:w-auto sm:px-4 sm:py-2 ${
            adding ? "" : "disabled:opacity-50"
          }`}
        >
          {adding ? (
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 animate-spin sm:hidden"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                opacity="0.3"
              />
              <path
                d="M12 3a9 9 0 0 1 9 9"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 sm:hidden"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path fill="currentColor" d="M10 8.4v7.2l6.2-3.6z" />
            </svg>
          )}
          <span className="hidden text-sm font-semibold sm:inline">
            {adding ? "Adding..." : actionLabel}
          </span>
        </button>
      </div>
    </li>
  );
}

export default function SongSearch({
  onAddToQueue,
  onClose,
  actionLabel = "Add to Queue",
  onFavoritesChange,
}: SongSearchProps) {
  const { user, ready } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [popularSongs, setPopularSongs] = useState<SearchResult[]>([]);
  const [popularPage, setPopularPage] = useState(1);
  const [popularToken, setPopularToken] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [prevPageToken, setPrevPageToken] = useState<string | null>(null);
  const [popularSource, setPopularSource] = useState<"youtube" | "picks">("youtube");
  const [popularTotalPages, setPopularTotalPages] = useState(0);
  const [popularRefresh, setPopularRefresh] = useState(0);
  const [popularError, setPopularError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [popularLoading, setPopularLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [addingVideoId, setAddingVideoId] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [accountPrompt, setAccountPrompt] = useState(false);

  // Server chooses the list: YouTube search, or songs people queued.
  useEffect(() => {
    let cancelled = false;

    async function loadPopular() {
      setPopularLoading(true);
      setPopularError(false);
      try {
        const data = await listPopularSongs(popularPage, popularToken);
        if (!cancelled) {
          setPopularSongs(data.songs);
          setPopularTotalPages(data.totalPages);
          setNextPageToken(data.nextPageToken);
          setPrevPageToken(data.prevPageToken);
          setPopularSource(data.source);
          if (data.source === "picks" && data.page !== popularPage) {
            setPopularPage(data.page);
          }
        }
      } catch {
        if (!cancelled) {
          setPopularSongs([]);
          setPopularTotalPages(0);
          setNextPageToken(null);
          setPrevPageToken(null);
          setPopularError(true);
        }
      } finally {
        if (!cancelled) setPopularLoading(false);
      }
    }

    void loadPopular();
    return () => {
      cancelled = true;
    };
  }, [popularPage, popularToken, popularRefresh]);

  useEffect(() => {
    if (!user) {
      setFavoriteIds(new Set());
      return;
    }

    let cancelled = false;
    listFavorites()
      .then((data) => {
        if (!cancelled) {
          setFavoriteIds(new Set(data.songs.map((song) => song.videoId)));
        }
      })
      .catch(() => {
        if (!cancelled) setFavoriteIds(new Set());
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

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

  async function handleAdd(song: SearchResult) {
    if (addingVideoId) return;
    setAddingVideoId(song.videoId);
    try {
      await onAddToQueue(song);
      if (popularSource === "picks") {
        setPopularRefresh((current) => current + 1);
      }
    } finally {
      setAddingVideoId(null);
    }
  }

  async function toggleFavorite(song: SearchResult) {
    if (!ready) return;
    if (!user) {
      setAccountPrompt(true);
      return;
    }

    const saved = favoriteIds.has(song.videoId);
    try {
      if (saved) {
        await removeFavorite(song.videoId);
        setFavoriteIds((current) => {
          const next = new Set(current);
          next.delete(song.videoId);
          return next;
        });
      } else {
        await addFavorite({
          videoId: song.videoId,
          title: song.title,
          artist: song.channelTitle,
          thumbnail: song.thumbnail,
        });
        setFavoriteIds((current) => new Set(current).add(song.videoId));
      }
      onFavoritesChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update favorites");
    }
  }

  const canGoPopularPrev =
    popularSource === "picks" ? popularPage > 1 : Boolean(prevPageToken);
  const canGoPopularNext =
    popularSource === "picks"
      ? popularTotalPages > popularPage
      : Boolean(nextPageToken);

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

      {accountPrompt && (
        <div className="rounded-2xl border border-ktv-card-border bg-ktv-card/80 px-4 py-4">
          <p className="text-sm leading-relaxed text-white/70">
            Save your favorite songs, create personal playlists, and keep track
            of your karaoke history. Create your free TaraSing account today!
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/register"
              className="ktv-btn-primary rounded-xl px-4 py-2 text-sm font-semibold text-white"
            >
              Create account
            </Link>
            <Link
              href="/login"
              className="ktv-btn-secondary rounded-xl px-4 py-2 text-sm font-semibold text-white"
            >
              Sign in
            </Link>
            <button
              type="button"
              onClick={() => setAccountPrompt(false)}
              className="rounded-xl px-3 py-2 text-sm text-white/50 hover:text-white"
            >
              Not now
            </button>
          </div>
        </div>
      )}

      {!hasSearched && (
        <div>
          <p className="mb-3 text-sm text-white/50">
            Not sure what to sing? Try one of these:
          </p>

          {popularLoading && popularSongs.length === 0 && (
            <p className="py-6 text-center text-sm text-white/40">
              Loading popular songs...
            </p>
          )}

          {!popularLoading && popularError && (
            <p className="py-6 text-center text-sm text-white/40">
              Could not load popular songs. Search for a song above.
            </p>
          )}

          {!popularLoading && !popularError && popularSongs.length === 0 && (
            <p className="py-6 text-center text-sm text-white/40">
              {popularSource === "picks"
                ? "Nothing here yet. Songs show up after someone adds them to a party."
                : "No songs found. Search for a song above."}
            </p>
          )}

          {!popularError && popularSongs.length > 0 && (
            <ul className="space-y-3">
              {popularSongs.map((song) => (
                <SongRow
                  key={song.videoId}
                  song={song}
                  onAdd={handleAdd}
                  adding={addingVideoId === song.videoId}
                  disabled={addingVideoId !== null}
                  actionLabel={actionLabel}
                  saved={favoriteIds.has(song.videoId)}
                  onToggleSave={toggleFavorite}
                />
              ))}
            </ul>
          )}

          {!popularError && (canGoPopularPrev || canGoPopularNext) && (
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                disabled={!canGoPopularPrev || popularLoading}
                onClick={() => {
                  setPopularLoading(true);
                  setPopularSongs([]);
                  setPopularToken(prevPageToken);
                  setPopularPage((current) => Math.max(1, current - 1));
                }}
                className="ktv-btn-secondary rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm font-medium text-white/70">
                {popularTotalPages > 1
                  ? `${popularPage} / ${popularTotalPages}`
                  : `Page ${popularPage}`}
              </span>
              <button
                type="button"
                disabled={!canGoPopularNext || popularLoading}
                onClick={() => {
                  setPopularLoading(true);
                  setPopularSongs([]);
                  setPopularToken(nextPageToken);
                  setPopularPage((current) => current + 1);
                }}
                className="ktv-btn-primary rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
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
                  onAdd={handleAdd}
                  adding={addingVideoId === song.videoId}
                  disabled={addingVideoId !== null}
                  actionLabel={actionLabel}
                  saved={favoriteIds.has(song.videoId)}
                  onToggleSave={toggleFavorite}
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
