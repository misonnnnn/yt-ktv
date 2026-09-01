"use client";

import { useState } from "react";
import type { SearchResult } from "@/lib/types";
import { mockSearchResults } from "@/lib/mock-data";

type SongSearchProps = {
  onAddToQueue: (song: SearchResult) => void;
  onClose?: () => void;
};

export default function SongSearch({ onAddToQueue, onClose }: SongSearchProps) {
  const [query, setQuery] = useState("");

  const results =
    query.trim() === ""
      ? mockSearchResults
      : mockSearchResults.filter(
          (song) =>
            song.title.toLowerCase().includes(query.toLowerCase()) ||
            song.artist.toLowerCase().includes(query.toLowerCase()) ||
            song.channel.toLowerCase().includes(query.toLowerCase())
        );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
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
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="ktv-btn-secondary rounded-xl px-4 py-3 text-sm font-medium"
          >
            Close
          </button>
        )}
      </div>

      <p className="text-xs text-white/40">
        {results.length} result{results.length !== 1 ? "s" : ""} — mock YouTube
        search
      </p>

      <ul className="space-y-3">
        {results.map((song) => (
          <li
            key={song.id}
            className="flex items-center gap-3 rounded-xl border border-ktv-card-border bg-ktv-card/60 p-3"
          >
            {/* Thumbnail placeholder */}
            <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-900/60 to-pink-900/40">
              <span className="text-2xl">🎵</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-white">
                {song.title}{" "}
                <span className="text-white/50">(Karaoke)</span>
              </p>
              <p className="truncate text-sm text-white/50">
                {song.artist} · {song.channel}
              </p>
              <p className="text-xs text-white/30">{song.duration}</p>
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

      {results.length === 0 && (
        <p className="py-8 text-center text-white/40">
          No songs found. Try a different search term.
        </p>
      )}
    </div>
  );
}
