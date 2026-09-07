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
    <div className="flex h-dvh flex-col overflow-y-auto bg-[#08040f] landscape:overflow-hidden lg:overflow-hidden">
      <header className="flex shrink-0 items-center justify-between border-b border-ktv-card-border px-4 py-2 landscape:py-1.5 sm:px-6 sm:py-3 lg:px-8">
        <div className="min-w-0">
          <h1 className="truncate text-base font-bold text-white sm:text-xl lg:text-2xl">
            {partyName}
          </h1>
          <p className="hidden text-sm text-white/50 sm:block landscape:hidden lg:block">
            Hosted by {hostName}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:gap-6">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-white/40 sm:text-xs">
              Party code
            </p>
            <p className="font-mono text-sm font-bold tracking-widest text-purple-300 sm:text-lg">
              {roomCode}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/5 px-2.5 py-1.5 sm:px-4 sm:py-2">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            <span className="text-xs text-white/70 sm:text-sm">
              {guestCount} connected
            </span>
          </div>
        </div>
      </header>

      {/* Side-by-side in landscape so the video fits the short height */}
      <main className="grid grid-cols-1 gap-3 p-3 landscape:min-h-0 landscape:flex-1 landscape:grid-cols-[1fr_200px] landscape:gap-3 sm:gap-4 sm:p-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[1fr_300px] lg:gap-6 lg:p-6 xl:grid-cols-[1fr_320px]">
        <div className="flex min-h-0 flex-col gap-3 landscape:gap-2 sm:gap-4 lg:min-h-0">
          <div className="aspect-video max-h-[42dvh] landscape:aspect-auto landscape:max-h-none landscape:min-h-0 landscape:flex-1 lg:aspect-auto lg:max-h-none lg:min-h-0 lg:flex-1">
            <YouTubePlayer
              ref={playerRef}
              className="h-full w-full"
              videoId={nowPlaying?.videoId || null}
              onEnded={handleSongEnded}
            />
          </div>

          <div className="flex shrink-0 items-end justify-between gap-3 rounded-2xl border border-ktv-card-border bg-ktv-card/60 px-4 py-3 landscape:px-3 landscape:py-2 sm:gap-4 sm:px-6 sm:py-4 lg:px-8 lg:py-5">
            <div className="min-w-0">
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-pink-400 sm:mb-1 sm:text-sm">
                Now Singing
              </p>
              {nowPlaying?.videoId ? (
                <>
                  <p className="truncate text-xl font-extrabold text-white landscape:text-lg sm:text-3xl lg:text-4xl">
                    {nowPlaying.singerName}
                  </p>
                  <p className="mt-0.5 truncate text-base font-bold text-white/90 landscape:text-sm sm:mt-1 sm:text-xl lg:text-2xl">
                    {nowPlaying.songTitle}
                  </p>
                  <p className="truncate text-sm text-white/50 landscape:text-xs">
                    {nowPlaying.artist}
                  </p>
                </>
              ) : (
                <p className="text-lg text-white/50 sm:text-2xl">
                  Waiting for songs...
                </p>
              )}
            </div>
            {nowPlaying?.videoId && (
              <button
                type="button"
                onClick={handleSkip}
                disabled={skipping}
                className="ktv-btn-secondary shrink-0 rounded-xl px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 sm:px-5 sm:py-2.5 sm:text-sm"
              >
                {skipping ? "Skipping..." : "Skip Song"}
              </button>
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-col gap-3 pb-4 landscape:gap-2 landscape:overflow-y-auto landscape:pb-0 sm:gap-4 sm:pb-6 lg:min-h-0 lg:pb-0">
          <div className="flex shrink-0 flex-col items-center rounded-2xl border border-ktv-card-border bg-ktv-card/60 p-3 landscape:p-2 sm:p-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-purple-300 sm:text-sm">
              Scan to Join
            </p>
            <p className="mb-2 hidden text-xs text-white/40 sm:mb-3 landscape:hidden lg:block">
              Guests use their phone — no video on guest devices
            </p>
            <div className="rounded-xl bg-white p-1.5 landscape:p-1 sm:p-2">
              <div className="h-20 w-20 landscape:h-16 landscape:w-16 sm:h-[140px] sm:w-[140px]">
                <QRCodeSVG
                  value={joinUrl}
                  size={140}
                  level="M"
                  className="h-full w-full"
                />
              </div>
            </div>
            <p className="mt-2 font-mono text-xs tracking-widest text-white/60 sm:mt-3 sm:text-sm">
              {roomCode}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowSearch(true)}
            className="ktv-btn-primary w-full shrink-0 rounded-2xl py-2.5 text-sm font-bold text-white landscape:py-2"
          >
            + Add Song
          </button>

          <div className="landscape:min-h-0 landscape:flex-1 landscape:overflow-y-auto lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            <Queue items={upNext} title="Up Next" />
          </div>
        </div>
      </main>

      {/* Full-screen search — roomy on phone + landscape */}
      {showSearch && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#0c0618]">
          <div className="flex shrink-0 items-center justify-between border-b border-ktv-card-border px-4 py-3">
            <h2 className="text-lg font-bold text-white">Add a Song</h2>
            <button
              type="button"
              onClick={() => setShowSearch(false)}
              className="ktv-btn-secondary rounded-xl px-4 py-2 text-sm font-medium text-white"
            >
              Close
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="mx-auto w-full max-w-2xl">
              <SongSearch onAddToQueue={handleAddToQueue} />
            </div>
          </div>
        </div>
      )}
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
