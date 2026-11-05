"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { SongHistoryItem } from "@/lib/songHistory";
import { songHistoryLimit } from "@/lib/songHistory";
import type { SearchResult } from "@/lib/types";

type SongHistoryButtonProps = {
  history: SongHistoryItem[];
  onAdd: (song: SearchResult) => void | Promise<void>;
};

export default function SongHistoryButton({
  history,
  onAdd,
}: SongHistoryButtonProps) {
  const [open, setOpen] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const limit = songHistoryLimit();

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  async function handleAdd(song: SongHistoryItem) {
    if (addingId) return;
    setAddingId(song.videoId);
    try {
      await onAdd(song);
    } finally {
      setAddingId(null);
      setOpen(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Song history"
        aria-expanded={open}
        className="ktv-btn-secondary flex h-9 w-9 items-center justify-center rounded-xl text-white"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 12a9 9 0 1 0 3-6.7" />
          <path d="M3 4v5h5" />
          <path d="M12 8v4l2.5 1.5" />
        </svg>
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex flex-col bg-[#0c0618]">
            <div className="flex shrink-0 items-center justify-between border-b border-ktv-card-border px-4 py-3">
              <div>
                <h2 className="text-lg font-bold text-white">Song history</h2>
                <p className="text-xs text-white/40">
                  {history.length} of {limit} on this device
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="ktv-btn-secondary rounded-xl px-4 py-2 text-sm font-medium text-white"
              >
                Close
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {history.length === 0 ? (
                <p className="py-10 text-center text-sm text-white/40">
                  Songs you add on this device will show up here.
                </p>
              ) : (
                <ul className="mx-auto w-full max-w-2xl space-y-3">
                  {history.map((song) => (
                    <li
                      key={song.videoId}
                      className="flex items-center gap-3 rounded-xl border border-ktv-card-border bg-ktv-card/60 p-3"
                    >
                      {song.thumbnail ? (
                        <img
                          src={song.thumbnail}
                          alt=""
                          className="h-14 w-20 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-900/60 to-pink-900/40">
                          <span className="text-xl">🎵</span>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-white">
                          {song.title}
                        </p>
                        <p className="truncate text-sm text-white/50">
                          {song.channelTitle}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAdd(song)}
                        disabled={addingId !== null}
                        className="ktv-btn-primary shrink-0 rounded-xl px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {addingId === song.videoId ? "Adding..." : "Add"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
