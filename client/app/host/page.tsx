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
import { ENABLE_GUEST_VIDEO } from "@/lib/features";
import {
  PLAYER_SYNC_INTERVAL_MS,
  type PlaybackSyncState,
  type PlayerSyncPayload,
} from "@/lib/playerSync";
import { connectToRoom } from "@/lib/socket";
import type { NowPlaying, QueueItem, RoomInfo, SearchResult } from "@/lib/types";
import { toQueueItem } from "@/lib/types";

/** Phone landscape only (not desktop). Video goes fullscreen behind the UI. */
const MOBILE_LANDSCAPE_QUERY =
  "(max-width: 1023px) and (orientation: landscape)";
const CONTROLS_HIDE_MS = 4000;

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
  const [showQrModal, setShowQrModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const playerRef = useRef<YouTubePlayerHandle>(null);
  const socketRef = useRef<Socket | null>(null);
  const upNextRef = useRef(upNext);
  const nowPlayingRef = useRef(nowPlaying);
  const hideControlsTimer = useRef<number | null>(null);
  const showSearchRef = useRef(showSearch);
  const showQrModalRef = useRef(showQrModal);
  upNextRef.current = upNext;
  nowPlayingRef.current = nowPlaying;
  showSearchRef.current = showSearch;
  showQrModalRef.current = showQrModal;

  // Detect phone landscape
  useEffect(() => {
    const media = window.matchMedia(MOBILE_LANDSCAPE_QUERY);

    function update() {
      setIsMobileLandscape(media.matches);
    }

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  // Show overlays, then hide them after a few seconds of no touch
  function bumpControls() {
    setShowControls(true);

    if (hideControlsTimer.current) {
      window.clearTimeout(hideControlsTimer.current);
    }

    hideControlsTimer.current = window.setTimeout(() => {
      // Keep UI visible while a modal/search is open
      if (showSearchRef.current || showQrModalRef.current) return;
      setShowControls(false);
    }, CONTROLS_HIDE_MS);
  }

  useEffect(() => {
    if (!isMobileLandscape) {
      setShowControls(true);
      if (hideControlsTimer.current) {
        window.clearTimeout(hideControlsTimer.current);
      }
      return;
    }

    bumpControls();

    return () => {
      if (hideControlsTimer.current) {
        window.clearTimeout(hideControlsTimer.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobileLandscape]);

  function emitPlayerSync(overrides?: Partial<PlayerSyncPayload>) {
    if (!ENABLE_GUEST_VIDEO) return;
    const socket = socketRef.current;
    if (!socket) return;

    const player = playerRef.current;
    const payload: PlayerSyncPayload = {
      videoId: nowPlayingRef.current?.videoId ?? null,
      state: player?.getPlaybackState() ?? "unstarted",
      currentTime: player?.getCurrentTime() ?? 0,
      ...overrides,
    };
    socket.emit("player:sync", payload);
  }

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
    socketRef.current = socket;

    socket.on("room:user-joined", ({ guestCount: count }) => {
      setGuestCount(count);
      // New guest may need the current playhead right away
      emitPlayerSync();
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

    if (ENABLE_GUEST_VIDEO) {
      socket.on("player:sync-request", () => {
        emitPlayerSync();
      });
    }

    return () => {
      socketRef.current = null;
      socket.disconnect();
    };
    // emitPlayerSync reads refs only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, fallbackHost, loadRoom]);

  // Periodically send host time so guests can correct drift
  useEffect(() => {
    if (!ENABLE_GUEST_VIDEO) return;

    const timer = window.setInterval(() => {
      if (!nowPlayingRef.current?.videoId) return;
      emitPlayerSync();
    }, PLAYER_SYNC_INTERVAL_MS);

    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tell guests to clear their player when the host has nothing playing
  useEffect(() => {
    if (!ENABLE_GUEST_VIDEO) return;
    if (nowPlaying?.videoId) return;
    emitPlayerSync({ videoId: null, state: "unstarted", currentTime: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowPlaying?.videoId]);

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

  function handlePlayPause() {
    if (isPlaying) {
      playerRef.current?.pause();
      setIsPlaying(false);
    } else {
      playerRef.current?.resume();
      setIsPlaying(true);
    }
  }

  function handlePlaybackStateChange(info: {
    state: PlaybackSyncState;
    currentTime: number;
    videoId: string | null;
  }) {
    setIsPlaying(info.state === "playing");

    if (ENABLE_GUEST_VIDEO) {
      emitPlayerSync({
        videoId: info.videoId || nowPlayingRef.current?.videoId || null,
        state: info.state,
        currentTime: info.currentTime,
      });
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
  const controlsVisible = !isMobileLandscape || showControls;

  const player = (
    <YouTubePlayer
      ref={playerRef}
      className="h-full w-full"
      videoId={nowPlaying?.videoId || null}
      onEnded={handleSongEnded}
      onPlaybackStateChange={handlePlaybackStateChange}
    />
  );

  const nowSingingPanel = (
    <div
      className={`flex shrink-0 items-end justify-between gap-3 rounded-2xl px-4 py-3 sm:gap-4 sm:px-6 sm:py-4 lg:px-8 lg:py-5 ${
        isMobileLandscape
          ? "border border-white/15 bg-black/45 px-3 py-2 backdrop-blur-sm"
          : "border border-ktv-card-border bg-ktv-card/60 landscape:px-3 landscape:py-2"
      }`}
    >
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
          <p className="text-lg text-white/50 sm:text-2xl">Waiting for songs...</p>
        )}
      </div>
      {nowPlaying?.videoId && (
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handlePlayPause}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="ktv-btn-secondary flex h-9 w-9 items-center justify-center rounded-xl text-white sm:h-10 sm:w-10"
          >
            {isPlaying ? (
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 fill-current"
                aria-hidden="true"
              >
                <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 fill-current"
                aria-hidden="true"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={handleSkip}
            disabled={skipping}
            className="ktv-btn-secondary rounded-xl px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 sm:px-5 sm:py-2.5 sm:text-sm"
          >
            {skipping ? "Skipping..." : "Skip Song"}
          </button>
        </div>
      )}
    </div>
  );

  const sidePanel = (
    <div
      className={`flex min-h-0 flex-col gap-3 pb-4 sm:gap-4 sm:pb-6 lg:min-h-0 lg:pb-0 ${
        isMobileLandscape
          ? "w-52 gap-2 overflow-y-auto pb-0"
          : "landscape:gap-2 landscape:overflow-y-auto landscape:pb-0"
      }`}
    >
      {/* Full QR card — hidden in mobile landscape (icon + modal instead) */}
      {!isMobileLandscape && (
        <div className="flex shrink-0 flex-col items-center rounded-2xl border border-ktv-card-border bg-ktv-card/60 p-3 landscape:p-2 sm:p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-purple-300 sm:text-sm">
            Scan to Join
          </p>
          <p className="mb-2 hidden text-xs text-white/40 sm:mb-3 landscape:hidden lg:block">
            {ENABLE_GUEST_VIDEO
              ? "Guests see a muted copy of this video on their phones"
              : "Guests use their phone — no video on guest devices"}
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
      )}

      <button
        type="button"
        onClick={() => setShowSearch(true)}
        className={`ktv-btn-primary w-full shrink-0 rounded-2xl py-2.5 text-sm font-bold text-white landscape:py-2 ${
          isMobileLandscape ? "py-2 text-xs" : ""
        }`}
      >
        + Add Song
      </button>

      <div className="min-h-0 flex-1 overflow-y-auto landscape:min-h-0 lg:min-h-0">
        <Queue items={upNext} title="Up Next" glass={isMobileLandscape} compact={isMobileLandscape} />
      </div>
    </div>
  );

  return (
    <div
      className={`flex h-dvh flex-col bg-[#08040f] ${
        isMobileLandscape
          ? "relative overflow-hidden"
          : "overflow-y-auto landscape:overflow-hidden lg:overflow-hidden"
      }`}
      onPointerDown={isMobileLandscape ? bumpControls : undefined}
    >
      {/* Fullscreen video background (phone landscape only) */}
      {isMobileLandscape && (
        <div className="pointer-events-none absolute inset-0 z-0">{player}</div>
      )}

      {/* UI chrome — fades away after idle in phone landscape */}
      <div
        className={`relative z-10 flex min-h-0 flex-1 flex-col transition-opacity duration-500 ${
          controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <header
          className={`flex shrink-0 items-center justify-between px-4 py-2 sm:px-6 sm:py-3 lg:px-8 ${
            isMobileLandscape
              ? "border-transparent bg-gradient-to-b from-black/70 to-transparent py-1.5"
              : "border-b border-ktv-card-border landscape:py-1.5"
          }`}
        >
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold text-white sm:text-xl lg:text-2xl">
              {partyName}
            </h1>
            <p className="hidden text-sm text-white/50 sm:block landscape:hidden lg:block">
              Hosted by {hostName}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-6">
            {isMobileLandscape && (
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                aria-label="Show QR code"
                className="ktv-btn-secondary flex h-9 w-9 items-center justify-center rounded-xl text-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 fill-current"
                  aria-hidden="true"
                >
                  <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm12-2h2v2h-2v-2zm4 0h2v2h-2v-2zm-4 4h2v2h-2v-2zm4 0h2v2h-2v-2zm-4 4h2v2h-2v-2zm4 0h2v2h-2v-2z" />
                </svg>
              </button>
            )}
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

        {isMobileLandscape ? (
          <main className="flex min-h-0 flex-1 gap-2 p-2">
            <div className="flex min-w-0 flex-1 flex-col justify-end">
              {nowSingingPanel}
            </div>
            {sidePanel}
          </main>
        ) : (
          <main className="grid grid-cols-1 gap-3 p-3 landscape:min-h-0 landscape:flex-1 landscape:grid-cols-[1fr_300px] landscape:gap-3 sm:gap-4 sm:p-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[1fr_340px] lg:gap-6 lg:p-6 xl:grid-cols-[1fr_360px]">
            <div className="flex min-h-0 flex-col gap-3 landscape:gap-2 sm:gap-4 lg:min-h-0">
              <div className="aspect-video max-h-[42dvh] landscape:aspect-auto landscape:max-h-none landscape:min-h-0 landscape:flex-1 lg:aspect-auto lg:max-h-none lg:min-h-0 lg:flex-1">
                {player}
              </div>
              {nowSingingPanel}
            </div>
            {sidePanel}
          </main>
        )}
      </div>

      {/* QR modal — phone landscape */}
      {showQrModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => {
            setShowQrModal(false);
            bumpControls();
          }}
        >
          <div
            className="rounded-2xl border border-white/15 bg-[#0c0618] p-5 text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-purple-300">
              Scan to Join
            </p>
            <div className="mx-auto inline-block rounded-xl bg-white p-3">
              <QRCodeSVG value={joinUrl} size={180} level="M" />
            </div>
            <p className="mt-3 font-mono text-sm tracking-widest text-white/70">
              {roomCode}
            </p>
            <button
              type="button"
              onClick={() => {
                setShowQrModal(false);
                bumpControls();
              }}
              className="ktv-btn-secondary mt-4 rounded-xl px-4 py-2 text-sm text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Full-screen search — roomy on phone + landscape */}
      {showSearch && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#0c0618]">
          <div className="flex shrink-0 items-center justify-between border-b border-ktv-card-border px-4 py-3">
            <h2 className="text-lg font-bold text-white">Add a Song</h2>
            <button
              type="button"
              onClick={() => {
                setShowSearch(false);
                if (isMobileLandscape) bumpControls();
              }}
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
