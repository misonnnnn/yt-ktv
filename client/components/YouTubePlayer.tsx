"use client";

import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from "react";

type YouTubePlayerProps = {
  videoId: string | null;
  onEnded: () => void;
  className?: string;
  ref?: Ref<YouTubePlayerHandle>;
};

export type YouTubePlayerHandle = {
  play: (videoId: string) => void;
  stop: () => void;
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
    loadVideoById: (videoId: string | { videoId: string; startSeconds?: number }) => void;
    playVideo: () => void;
    pauseVideo: () => void;
    stopVideo: () => void;
    destroy: () => void;
    getPlayerState?: () => number;
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
}: YouTubePlayerProps) {
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const readyRef = useRef(false);
  const activeVideoIdRef = useRef<string | null>(null);
  const pendingVideoIdRef = useRef<string | null>(null);
  const ignoreEndedRef = useRef(false);
  const switchingRef = useRef(false);
  const gestureTimerRef = useRef<number | null>(null);

  const [hasVideo, setHasVideo] = useState(Boolean(videoId));
  const [needsGesture, setNeedsGesture] = useState(false);

  function clearGestureTimer() {
    if (gestureTimerRef.current != null) {
      window.clearTimeout(gestureTimerRef.current);
      gestureTimerRef.current = null;
    }
  }

  function loadAndPlay(id: string) {
    activeVideoIdRef.current = id;
    pendingVideoIdRef.current = id;
    ignoreEndedRef.current = false;
    switchingRef.current = true;
    setHasVideo(true);
    setNeedsGesture(false);
    clearGestureTimer();

    const player = playerRef.current;
    if (!player || !readyRef.current) return;

    player.loadVideoById({ videoId: id, startSeconds: 0 });
    player.playVideo();
    // Mobile browsers sometimes ignore the first playVideo() call.
    requestAnimationFrame(() => player.playVideo());
  }

  function stopPlayback() {
    pendingVideoIdRef.current = null;
    activeVideoIdRef.current = null;
    ignoreEndedRef.current = true;
    switchingRef.current = false;
    setHasVideo(false);
    setNeedsGesture(false);
    clearGestureTimer();
    playerRef.current?.stopVideo();
  }

  useImperativeHandle(ref, () => ({
    play: (id: string) => {
      loadAndPlay(id);
    },
    stop: () => {
      stopPlayback();
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
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            if (cancelled) return;
            readyRef.current = true;
            playerRef.current = event.target;
            const pending = pendingVideoIdRef.current;
            if (pending) {
              event.target.loadVideoById({ videoId: pending, startSeconds: 0 });
              event.target.playVideo();
            }
          },
          onStateChange: (event) => {
            const state = event.data;
            const PlayerState = window.YT.PlayerState;

            if (
              state === PlayerState.PLAYING ||
              state === PlayerState.BUFFERING
            ) {
              switchingRef.current = false;
              setNeedsGesture(false);
              clearGestureTimer();
              return;
            }

            if (state === PlayerState.ENDED) {
              if (ignoreEndedRef.current || switchingRef.current) {
                ignoreEndedRef.current = false;
                return;
              }
              onEndedRef.current();
              return;
            }

            if (
              state === PlayerState.CUED ||
              state === PlayerState.PAUSED ||
              state === PlayerState.UNSTARTED
            ) {
              if (!pendingVideoIdRef.current && !activeVideoIdRef.current) {
                return;
              }
              clearGestureTimer();
              gestureTimerRef.current = window.setTimeout(() => {
                const current = playerRef.current?.getPlayerState?.();
                if (
                  current === PlayerState.PLAYING ||
                  current === PlayerState.BUFFERING
                ) {
                  return;
                }
                setNeedsGesture(true);
              }, 400);
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
      readyRef.current = false;
      clearGestureTimer();
      try {
        player?.destroy();
      } catch {
        // Player may already be gone.
      }
      playerRef.current = null;
      hostRef.current?.replaceChildren();
    };
    // clearGestureTimer is stable enough for unmount cleanup; we only want one player.
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

  function handleTapToPlay() {
    const id = activeVideoIdRef.current || pendingVideoIdRef.current || videoId;
    if (!id) return;
    loadAndPlay(id);
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-ktv-card-border bg-black ktv-glow [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:h-full [&_iframe]:w-full ${className ?? "aspect-video w-full"}`}
    >
      <div ref={hostRef} className="absolute inset-0 h-full w-full" />

      {!hasVideo && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-8">
          <div className="text-4xl">🎤</div>
          <p className="text-xl font-semibold text-white/80">No song playing</p>
          <p className="text-sm text-white/40">
            Add songs to the queue to get started
          </p>
        </div>
      )}

      {hasVideo && needsGesture && (
        <button
          type="button"
          onClick={handleTapToPlay}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/55"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-3xl text-black">
            ▶
          </span>
          <span className="text-sm font-semibold text-white">Tap to play</span>
        </button>
      )}
    </div>
  );
}
