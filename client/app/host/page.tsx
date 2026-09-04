"use client";

import { QRCodeSVG } from "qrcode.react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import YouTubePlayer, {
  type YouTubePlayerHandle,
} from "@/components/YouTubePlayer";
import Queue from "@/components/Queue";
import SongSearch from "@/components/SongSearch";
import {
  addToQueue,
  apiItemToNowPlaying,
  finishSong,
  getJoinUrl,
  getRoom,
  skipSong,
} from "@/lib/api";
import { connectToRoom } from "@/lib/socket";
import type { NowPlaying, QueueItem, RoomInfo, SearchResult } from "@/lib/types";
import { toQueueItem } from "@/lib/types";

function HostScreenContent() {
  const searchParams = useSearchParams();
  const roomCode = searchParams.get("room")?.toUpperCase() || "";
  const fallbackParty = searchParams.get("party") || "";
  const fallbackHost = searchParams.get("host") || "";

  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [upNext, setUpNext] = useState<QueueItem[]>([]);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [guestCount, setGuestCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skipping, setSkipping] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const playerRef = useRef<YouTubePlayerHandle>(null);
  const upNextRef = useRef(upNext);
  const nowPlayingRef = useRef(nowPlaying);
  upNextRef.current = upNext;
  nowPlayingRef.current = nowPlaying;

  function playNextInQueue() {
    const next = upNextRef.current[0];
    if (next?.videoId) {
      // Call play() in this tap/ended callback. Waiting for the API
      // response loses the mobile user-gesture, so the next video sits paused.
      playerRef.current?.play(next.videoId);
    } else {
      playerRef.current?.stop();
    }
  }

  const loadRoom = useCallback(async () => {
    if (!roomCode) {
      setError("No room code provided");
      setLoading(false);
      return;
    }

    try {
      const data = await getRoom(roomCode);
      setRoom(data.room);
      setUpNext(data.upNext.map(toQueueItem));
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

    const hostName = fallbackHost || "Host";
    const socket: Socket = connectToRoom(roomCode, hostName);

    socket.on("room:user-joined", ({ guestCount: count }) => {
      setGuestCount(count);
    });

    socket.on("room:user-left", ({ guestCount: count }) => {
      setGuestCount(count);
    });

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
  }, [roomCode, fallbackHost, loadRoom]);

  async function handleSongEnded() {
    if (!roomCode) return;
    playNextInQueue();
    try {
      await finishSong(roomCode);
    } catch (err) {
      console.error("Failed to finish song:", err);
    }
  }

  async function handleSkip() {
    if (!roomCode || skipping) return;
    playNextInQueue();
    setSkipping(true);
    try {
      await skipSong(roomCode);
    } catch (err) {
      console.error("Failed to skip song:", err);
    } finally {
      setSkipping(false);
    }
  }

  async function handleAddToQueue(song: SearchResult) {
    const singer = room?.hostName || fallbackHost || "Host";
    if (!nowPlayingRef.current?.videoId) {
      playerRef.current?.play(song.videoId);
    }
    try {
      await addToQueue(roomCode, {
        videoId: song.videoId,
        songTitle: song.title,
        artist: song.channelTitle,
        thumbnail: song.thumbnail,
        singerName: singer,
      });
      setShowSearch(false);
      await loadRoom();
    } catch (err) {
      console.error("Failed to add song:", err);
    }
  }

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#08040f] text-white/50">
        Loading host screen...
      </div>
    );
  }

  if (error || !roomCode) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-[#08040f] px-6 text-center">
        <p className="text-red-300">{error || "Room not found"}</p>
        <a href="/create" className="text-purple-300 hover:underline">
          Create a new party
        </a>
      </div>
    );
  }

  const partyName = room?.partyName || fallbackParty || "Karaoke Party";
  const hostName = room?.hostName || fallbackHost || "Host";
  const joinUrl = getJoinUrl(roomCode);

  return (
    <div className="flex h-dvh flex-col overflow-y-auto bg-[#08040f] lg:overflow-hidden">
      <header className="flex shrink-0 items-center justify-between border-b border-ktv-card-border px-6 py-3 lg:px-8">
        <div>
          <h1 className="text-xl font-bold text-white lg:text-2xl">
            {partyName}
          </h1>
          <p className="text-sm text-white/50">Hosted by {hostName}</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-white/40">
              Party code
            </p>
            <p className="font-mono text-lg font-bold tracking-widest text-purple-300">
              {roomCode}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            <span className="text-sm text-white/70">{guestCount} connected</span>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 gap-4 p-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[1fr_300px] lg:gap-6 lg:p-6 xl:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4 lg:min-h-0">
          <div className="aspect-video lg:aspect-auto lg:min-h-0 lg:flex-1">
            <YouTubePlayer
              ref={playerRef}
              className="h-full w-full"
              videoId={nowPlaying?.videoId || null}
              onEnded={handleSongEnded}
            />
          </div>

          <div className="flex shrink-0 items-end justify-between gap-4 rounded-2xl border border-ktv-card-border bg-ktv-card/60 px-6 py-4 lg:px-8 lg:py-5">
            <div className="min-w-0">
              <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-pink-400">
                Now Singing
              </p>
              {nowPlaying?.videoId ? (
                <>
                  <p className="truncate text-3xl font-extrabold text-white lg:text-4xl">
                    {nowPlaying.singerName}
                  </p>
                  <p className="mt-1 truncate text-xl font-bold text-white/90 lg:text-2xl">
                    {nowPlaying.songTitle}
                  </p>
                  <p className="truncate text-white/50">{nowPlaying.artist}</p>
                </>
              ) : (
                <p className="text-2xl text-white/50">Waiting for songs...</p>
              )}
            </div>
            {nowPlaying?.videoId && (
              <button
                type="button"
                onClick={handleSkip}
                disabled={skipping}
                className="ktv-btn-secondary shrink-0 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {skipping ? "Skipping..." : "Skip Song"}
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 pb-6 lg:min-h-0 lg:pb-0">
          <div className="flex shrink-0 flex-col items-center rounded-2xl border border-ktv-card-border bg-ktv-card/60 p-4">
            <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-purple-300">
              Scan to Join
            </p>
            <p className="mb-3 text-xs text-white/40">
              Guests use their phone — no video on guest devices
            </p>
            <div className="rounded-xl bg-white p-2">
              <QRCodeSVG value={joinUrl} size={140} level="M" />
            </div>
            <p className="mt-3 font-mono text-sm tracking-widest text-white/60">
              {roomCode}
            </p>
          </div>

          {showSearch ? (
            <div className="rounded-2xl border border-ktv-card-border bg-ktv-card/60 p-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
              <SongSearch
                onAddToQueue={handleAddToQueue}
                onClose={() => setShowSearch(false)}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowSearch(true)}
              className="ktv-btn-primary w-full shrink-0 rounded-2xl py-3 text-sm font-bold text-white"
            >
              + Add Song
            </button>
          )}

          {!showSearch && (
            <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
              <Queue items={upNext} title="Up Next" />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function HostPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh items-center justify-center bg-[#08040f] text-white/50">
          Loading host screen...
        </div>
      }
    >
      <HostScreenContent />
    </Suspense>
  );
}
