"use client";

import { QRCodeSVG } from "qrcode.react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import type { Socket } from "socket.io-client";
import YouTubePlayer from "@/components/YouTubePlayer";
import Queue from "@/components/Queue";
import {
  apiItemToNowPlaying,
  finishSong,
  getJoinUrl,
  getRoom,
  skipSong,
} from "@/lib/api";
import { connectToRoom } from "@/lib/socket";
import type { NowPlaying, QueueItem, RoomInfo } from "@/lib/types";
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

    const hostName = fallbackHost || room?.hostName || "Host";
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
  }, [roomCode, fallbackHost, room?.hostName, loadRoom]);

  async function handleSongEnded() {
    if (!roomCode) return;
    try {
      await finishSong(roomCode);
    } catch (err) {
      console.error("Failed to finish song:", err);
    }
  }

  async function handleSkip() {
    if (!roomCode || skipping) return;
    setSkipping(true);
    try {
      await skipSong(roomCode);
    } catch (err) {
      console.error("Failed to skip song:", err);
    } finally {
      setSkipping(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#08040f] text-white/50">
        Loading host screen...
      </div>
    );
  }

  if (error || !roomCode) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-[#08040f] px-6 text-center">
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
    <div className="min-h-full bg-[#08040f]">
      <header className="flex items-center justify-between border-b border-ktv-card-border px-6 py-4 lg:px-10">
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

      <main className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[1fr_320px] lg:gap-8 lg:p-10 xl:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <YouTubePlayer
            videoId={nowPlaying?.videoId || null}
            onEnded={handleSongEnded}
          />

          {nowPlaying?.videoId && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSkip}
                disabled={skipping}
                className="ktv-btn-secondary rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {skipping ? "Skipping..." : "Skip Song"}
              </button>
            </div>
          )}

          <div className="rounded-2xl border border-ktv-card-border bg-ktv-card/60 p-6 lg:p-8">
            <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-pink-400">
              Now Singing
            </p>
            {nowPlaying?.videoId ? (
              <>
                <p className="text-4xl font-extrabold text-white lg:text-5xl">
                  {nowPlaying.singerName}
                </p>
                <p className="mt-4 text-2xl font-bold text-white/90 lg:text-3xl">
                  {nowPlaying.songTitle}
                </p>
                <p className="mt-1 text-lg text-white/50 lg:text-xl">
                  {nowPlaying.artist}
                </p>
              </>
            ) : (
              <p className="text-2xl text-white/50">Waiting for songs...</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center rounded-2xl border border-ktv-card-border bg-ktv-card/60 p-6">
            <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-purple-300">
              Scan to Join
            </p>
            <p className="mb-4 text-xs text-white/40">
              Guests use their phone — no video on guest devices
            </p>
            <div className="rounded-xl bg-white p-3">
              <QRCodeSVG value={joinUrl} size={160} level="M" />
            </div>
            <p className="mt-4 font-mono text-sm tracking-widest text-white/60">
              {roomCode}
            </p>
          </div>

          <Queue items={upNext} title="Up Next" />
        </div>
      </main>
    </div>
  );
}

export default function HostPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center bg-[#08040f] text-white/50">
          Loading host screen...
        </div>
      }
    >
      <HostScreenContent />
    </Suspense>
  );
}
