"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Queue from "@/components/Queue";
import SongSearch from "@/components/SongSearch";
import {
  mockCurrentSong,
  mockParty,
  mockQueue,
} from "@/lib/mock-data";
import type { QueueItem, SearchResult } from "@/lib/types";

function GuestScreenContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = (params.roomId as string) || mockParty.roomId;
  const guestName = searchParams.get("name") || "You";

  const [queue, setQueue] = useState<QueueItem[]>(mockQueue);
  const [mySongs, setMySongs] = useState<QueueItem[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [addedMessage, setAddedMessage] = useState<string | null>(null);

  function handleAddToQueue(song: SearchResult) {
    const newItem: QueueItem = {
      id: `guest-${Date.now()}`,
      position: queue.length + mySongs.length + 1,
      singer: guestName,
      title: song.title,
      artist: song.artist,
    };
    setMySongs((prev) => [...prev, newItem]);
    setQueue((prev) => [...prev, newItem]);
    setAddedMessage(`"${song.title}" added to queue!`);
    setShowSearch(false);
    setTimeout(() => setAddedMessage(null), 2500);
  }

  function handleRemoveMySong(id: string) {
    setMySongs((prev) => prev.filter((s) => s.id !== id));
    setQueue((prev) =>
      prev
        .filter((s) => s.id !== id)
        .map((s, i) => ({ ...s, position: i + 1 }))
    );
  }

  return (
    <div className="ktv-bg flex min-h-full flex-1 flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-ktv-card-border bg-[#0c0618]/90 px-4 py-4 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">{mockParty.name}</h1>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              <span className="text-xs text-white/50">Connected · {roomId}</span>
            </div>
          </div>
          <Link
            href="/"
            className="text-xs text-white/40 hover:text-white/70"
          >
            Leave
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 py-4 pb-28">
        {/* Now playing card — no video, controller style */}
        <div className="rounded-2xl border border-ktv-card-border bg-gradient-to-br from-purple-900/40 to-pink-900/20 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-pink-400">
            Now Playing
          </p>
          <p className="mt-1 text-2xl font-bold text-white">
            {mockCurrentSong.title}
          </p>
          <p className="text-sm text-white/50">{mockCurrentSong.artist}</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-lg">🎤</span>
            <span className="font-medium text-purple-300">
              {mockCurrentSong.singer}
            </span>
          </div>
          {/* Fake waveform */}
          <div className="mt-4 flex items-end gap-1 h-6">
            {[3, 5, 4, 6, 3, 5, 2, 4, 6, 3, 5, 4].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm bg-purple-500/50"
                style={{ height: `${h * 4}px` }}
              />
            ))}
          </div>
        </div>

        {addedMessage && (
          <div className="rounded-xl bg-green-500/20 px-4 py-3 text-center text-sm text-green-300">
            {addedMessage}
          </div>
        )}

        {/* Search toggle / panel */}
        {showSearch ? (
          <div className="rounded-2xl border border-ktv-card-border bg-ktv-card/60 p-4">
            <SongSearch
              onAddToQueue={handleAddToQueue}
              onClose={() => setShowSearch(false)}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowSearch(true)}
            className="ktv-btn-secondary flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-semibold text-white"
          >
            <span>🔍</span> Search Songs
          </button>
        )}

        {/* My queued songs */}
        {mySongs.length > 0 && (
          <Queue
            items={mySongs.map((s, i) => ({ ...s, position: i + 1 }))}
            title="Your Songs"
            showRemove
            onRemove={handleRemoveMySong}
            compact
          />
        )}

        {/* Full queue */}
        <Queue items={queue} title="Party Queue" />
      </main>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-ktv-card-border bg-[#0c0618]/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <p className="text-xs text-white/40">
            Singing as <span className="text-white/70">{guestName}</span>
          </p>
          <button
            type="button"
            onClick={() => setShowSearch(true)}
            className="ktv-btn-primary rounded-xl px-5 py-2.5 text-sm font-bold text-white"
          >
            + Add Song
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GuestPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center text-white/50">
          Joining party...
        </div>
      }
    >
      <GuestScreenContent />
    </Suspense>
  );
}
