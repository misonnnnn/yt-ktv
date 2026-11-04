"use client";

import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from "react";
import {
  mapYouTubeState,
  type PlaybackSyncState,
} from "@/lib/playerSync";

type YouTubePlayerProps = {
  videoId: string | null;
  onEnded: () => void;
  className?: string;
  ref?: Ref<YouTubePlayerHandle>;
  /** Guest players stay muted so only the host TV has sound. */
  muted?: boolean;
  /** Called when YouTube reports a state change (for host → guest sync). */
  onPlaybackStateChange?: (info: {
    state: PlaybackSyncState;
    currentTime: number;
    videoId: string | null;
  }) => void;
};

export type YouTubePlayerHandle = {
  play: (videoId: string) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number;
  getPlaybackState: () => PlaybackSyncState;
};

declare global {
  interface Window {
    YT: {
      Player: new (
        element: string | HTMLElement,
        options: {
          videoId?: string;
          height?: string;
          width?: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (event: { target: YTPlayer }) => void;
            onStateChange?: (event: { data: number; target: YTPlayer }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }

  interface YTPlayer {
    loadVideoById: (
      videoId: string | { videoId: string; startSeconds?: number }
    ) => void;
    playVideo: () => void;
    pauseVideo: () => void;
    stopVideo: () => void;
    seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
    mute: () => void;
    unMute: () => void;
    destroy: () => void;
    getPlayerState?: () => number;
    getCurrentTime?: () => number;
  }
}

let apiReadyPromise: Promise<void> | null = null;

function loadYouTubeApi() {
  if (apiReadyPromise) return apiReadyPromise;

  apiReadyPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve();
      return;
    }

    const existing = document.getElementById("youtube-iframe-api");
    if (!existing) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }

    window.onYouTubeIframeAPIReady = () => resolve();
  });

  return apiReadyPromise;
}

if (typeof window !== "undefined") {
  void loadYouTubeApi();
}

export default function YouTubePlayer({
  videoId,
  onEnded,
  className,
  ref,
  muted = false,
  onPlaybackStateChange,
}: YouTubePlayerProps) {
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  const onPlaybackStateChangeRef = useRef(onPlaybackStateChange);
  onPlaybackStateChangeRef.current = onPlaybackStateChange;

  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const readyRef = useRef(false);
  const activeVideoIdRef = useRef<string | null>(null);
  const pendingVideoIdRef = useRef<string | null>(null);
  const ignoreEndedRef = useRef(false);
  const switchingRef = useRef(false);
  const playFrameRef = useRef<number | null>(null);
  /** Last mute value sent to this player, so we do not repeat mute/unMute. */
  const appliedMuteRef = useRef<boolean | null>(null);

  const [hasVideo, setHasVideo] = useState(Boolean(videoId));

  function cancelPendingPlay() {
    if (playFrameRef.current == null) return;
    cancelAnimationFrame(playFrameRef.current);
    playFrameRef.current = null;
  }

  function applyMute(player: YTPlayer) {
    const shouldMute = mutedRef.current;
    if (appliedMuteRef.current === shouldMute) return;
    if (shouldMute) {
      player.mute();
    } else if (appliedMuteRef.current === true) {
      // Only unmute when this player was previously muted.
      player.unMute();
    }
    appliedMuteRef.current = shouldMute;
  }

  function reportState(player: YTPlayer, ytState: number) {
    const state = mapYouTubeState(ytState);
    onPlaybackStateChangeRef.current?.({
      state,
      currentTime: player.getCurrentTime?.() ?? 0,
      videoId: activeVideoIdRef.current,
    });
  }

  function loadAndPlay(id: string) {
    activeVideoIdRef.current = id;
    pendingVideoIdRef.current = id;
    ignoreEndedRef.current = false;
    switchingRef.current = true;
    setHasVideo(true);

    const player = playerRef.current;
    if (!player || !readyRef.current) return;

    cancelPendingPlay();
    player.loadVideoById({ videoId: id, startSeconds: 0 });
    applyMute(player);
    player.playVideo();
    // Mobile browsers sometimes ignore the first playVideo() call.
    playFrameRef.current = requestAnimationFrame(() => {
      playFrameRef.current = null;
      const current = playerRef.current;
      if (!current || !readyRef.current) return;
      applyMute(current);
      const state = current.getPlayerState?.();
      const PlayerState = window.YT?.PlayerState;
      // Already starting — a second playVideo() can stall low-power TVs.
      if (
        PlayerState &&
        (state === PlayerState.PLAYING || state === PlayerState.BUFFERING)
      ) {
        return;
      }
      current.playVideo();
    });
  }

  function stopPlayback() {
    cancelPendingPlay();
    pendingVideoIdRef.current = null;
    activeVideoIdRef.current = null;
    ignoreEndedRef.current = true;
    switchingRef.current = false;
    setHasVideo(false);
    playerRef.current?.stopVideo();
  }

  useImperativeHandle(ref, () => ({
    play: (id: string) => {
      loadAndPlay(id);
    },
    stop: () => {
      stopPlayback();
    },
    pause: () => {
      playerRef.current?.pauseVideo();
    },
    resume: () => {
      const player = playerRef.current;
      if (!player) return;
      applyMute(player);
      player.playVideo();
    },
    seekTo: (seconds: number) => {
      playerRef.current?.seekTo(seconds, true);
    },
    getCurrentTime: () => playerRef.current?.getCurrentTime?.() ?? 0,
    getPlaybackState: () => {
      const ytState = playerRef.current?.getPlayerState?.();
      if (ytState == null) return "unstarted";
      return mapYouTubeState(ytState);
    },
  }));

  useEffect(() => {
    let cancelled = false;
    let player: YTPlayer | null = null;

    async function setupPlayer() {
      await loadYouTubeApi();
      if (cancelled || !hostRef.current) return;

      const placeholder = document.createElement("div");
      placeholder.style.width = "100%";
      placeholder.style.height = "100%";
      hostRef.current.replaceChildren(placeholder);

      player = new window.YT.Player(placeholder, {
        height: "100%",
        width: "100%",
        playerVars: {
          autoplay: 1,
          // Muted autoplay is allowed by browsers; required for guest sync players.
          mute: mutedRef.current ? 1 : 0,
          // Standard YouTube chrome: controls, title/link, branding, keyboard, fullscreen.
          controls: 1,
          rel: 0,
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            if (cancelled) return;
            readyRef.current = true;
            playerRef.current = event.target;
            applyMute(event.target);
            const pending = pendingVideoIdRef.current;
            if (pending) {
              event.target.loadVideoById({ videoId: pending, startSeconds: 0 });
              applyMute(event.target);
              event.target.playVideo();
            }
          },
          onStateChange: (event) => {
            const state = event.data;
            const PlayerState = window.YT.PlayerState;

            // Buffering repeats during normal playback. Keep it for the
            // ended-guard below, but do not notify React on every stall.
            if (state !== PlayerState.BUFFERING) {
              applyMute(event.target);
              reportState(event.target, state);
            }

            if (
              state === PlayerState.PLAYING ||
              state === PlayerState.BUFFERING
            ) {
              switchingRef.current = false;
              return;
            }

            if (state === PlayerState.ENDED) {
              if (ignoreEndedRef.current || switchingRef.current) {
                ignoreEndedRef.current = false;
                return;
              }
              onEndedRef.current();
            }
          },
        },
      });

      if (cancelled) {
        player.destroy();
        player = null;
        return;
      }

      playerRef.current = player;
    }

    void setupPlayer();

    return () => {
      cancelled = true;
      cancelPendingPlay();
      readyRef.current = false;
      appliedMuteRef.current = null;
      try {
        player?.destroy();
      } catch {
        // Player may already be gone.
      }
      playerRef.current = null;
      hostRef.current?.replaceChildren();
    };
    // We only want one player instance for the component lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!videoId) {
      if (activeVideoIdRef.current) {
        stopPlayback();
      }
      return;
    }

    if (activeVideoIdRef.current === videoId) return;
    loadAndPlay(videoId);
    // Intentionally not depending on helper fns — they close over refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || !readyRef.current) return;
    applyMute(player);
    // applyMute reads the latest muted flag from a ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [muted]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-ktv-card-border bg-black [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:h-full [&_iframe]:w-full ${className ?? "aspect-video w-full"}`}
    >
      <div ref={hostRef} className="absolute inset-0 h-full w-full" />

      {/* Empty state only — never covers an active YouTube embed */}
      {!hasVideo && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-8">
          <div className="text-4xl">🎤</div>
          <p className="text-xl font-semibold text-white/80">No song playing</p>
          <p className="text-sm text-white/40">
            Add songs to the queue to get started
          </p>
        </div>
      )}
    </div>
  );
}
