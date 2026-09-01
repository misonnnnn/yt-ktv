"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import type { Socket } from "socket.io-client";
import Queue from "@/components/Queue";
import SongSearch from "@/components/SongSearch";
import {
  addToQueue,
  apiItemToNowPlaying,
  getRoom,
  removeFromQueue,
} from "@/lib/api";
import { connectToRoom } from "@/lib/socket";
import type { NowPlaying, QueueItem, RoomInfo, SearchResult } from "@/lib/types";
import { toQueueItem } from "@/lib/types";

function GuestScreenContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomCode = ((params.roomId as string) || "").toUpperCase();
  const guestName = searchParams.get("name") || "Guest";

  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [addedMessage, setAddedMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRoom = useCallback(async () => {
    if (!roomCode) return;

    try {
      const data = await getRoom(roomCode);
      setRoom(data.room);
      setQueue(data.queue.map(toQueueItem));
      setNowPlaying(apiItemToNowPlaying(data.nowPlaying));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load room");
    } finally {
      setLoading(false);
    }
  }, [roomCode]);

  useEffect(() => {
    loadRoom();
  }, [loadRoom]);

  useEffect(() => {
    if (!roomCode) return;

    const socket: Socket = connectToRoom(roomCode, guestName);

    socket.on("queue:updated", () => {
      loadRoom();
    });

    socket.on("player:changed", (data: NowPlaying) => {
      setNowPlaying(data);
      loadRoom();
    });

    return () => {
      socket.disconnect();
    };
  }, [roomCode, guestName, loadRoom]);

  const mySongs = queue.filter(
    (item) =>
      item.singer === guestName &&
      item.status === "waiting"
  );

  async function handleAddToQueue(song: SearchResult) {
    try {
      await addToQueue(roomCode, {
        videoId: song.videoId,
        songTitle: song.title,
        artist: song.channelTitle,
        thumbnail: song.thumbnail,
        singerName: guestName,
      });
      setAddedMessage(`"${song.title}" added to queue!`);
      setShowSearch(false);
      setTimeout(() => setAddedMessage(null), 2500);
      await loadRoom();
    } catch (err) {
      setAddedMessage(
        err instanceof Error ? err.message : "Failed to add song"
      );
      setTimeout(() => setAddedMessage(null), 2500);
    }
  }

  async function handleRemoveMySong(id: string) {
    try {
      await removeFromQueue(roomCode, id);
      await loadRoom();
    } catch (err) {
      setAddedMessage(
        err instanceof Error ? err.message : "Failed to remove song"
      );
      setTimeout(() => setAddedMessage(null), 2500);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center text-white/50">
        Joining party...
      </div>
    );
  }

  if (error) {
    return (
      <div className="ktv-bg flex min-h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-red-300">{error}</p>
        <Link href="/join" className="text-purple-300 hover:underline">
          Try a different code
        </Link>
      </div>
    );
  }

  return (
    <div className="ktv-bg flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-ktv-card-border bg-[#0c0618]/90 px-4 py-4 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">
              {room?.partyName || "Karaoke Party"}
            </h1>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              <span className="text-xs text-white/50">
                Connected · {roomCode}
              </span>
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
        <div className="rounded-2xl border border-ktv-card-border bg-gradient-to-br from-purple-900/40 to-pink-900/20 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-pink-400">
            Now Playing
          </p>
          {nowPlaying?.videoId ? (
            <>
              <p className="mt-1 text-2xl font-bold text-white">
                {nowPlaying.songTitle}
              </p>
              <p className="text-sm text-white/50">{nowPlaying.artist}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-lg">🎤</span>
                <span className="font-medium text-purple-300">
                  {nowPlaying.singerName}
                </span>
              </div>
            </>
          ) : (
            <p className="mt-2 text-white/50">Nothing playing yet</p>
          )}
          <div className="mt-4 flex h-6 items-end gap-1">
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
          <div
            className={`rounded-xl px-4 py-3 text-center text-sm ${
              addedMessage.includes("Failed")
                ? "bg-red-500/20 text-red-300"
                : "bg-green-500/20 text-green-300"
            }`}
          >
            {addedMessage}
          </div>
        )}

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

        {mySongs.length > 0 && (
          <Queue
            items={mySongs.map((s, i) => ({ ...s, position: i + 1 }))}
            title="Your Songs"
            showRemove
            onRemove={handleRemoveMySong}
            compact
          />
        )}

        <Queue
          items={queue.filter((item) => item.status === "waiting")}
          title="Party Queue"
        />
      </main>

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
