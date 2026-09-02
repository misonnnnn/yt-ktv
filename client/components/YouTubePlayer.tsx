"use client";

import { useEffect, useRef } from "react";

type YouTubePlayerProps = {
  videoId: string | null;
  onEnded: () => void;
};

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
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
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }

  interface YTPlayer {
    loadVideoById: (videoId: string) => void;
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

function playVideo(player: YTPlayer, videoId: string) {
  player.loadVideoById(videoId);
  player.playVideo();
}

export default function YouTubePlayer({ videoId, onEnded }: YouTubePlayerProps) {
  const playerRef = useRef<YTPlayer | null>(null);
  const playerReadyRef = useRef(false);
  const onEndedRef = useRef(onEnded);
  const videoIdRef = useRef(videoId);
  const containerId = "youtube-player-container";

  onEndedRef.current = onEnded;
  videoIdRef.current = videoId;

  useEffect(() => {
    let cancelled = false;

    async function setupPlayer() {
      await loadYouTubeApi();
      if (cancelled || playerRef.current) return;

      playerRef.current = new window.YT.Player(containerId, {
        height: "100%",
        width: "100%",
        playerVars: {
          autoplay: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: (event) => {
            playerReadyRef.current = true;
            const id = videoIdRef.current;
            if (id) {
              playVideo(event.target, id);
            }
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              onEndedRef.current();
            }
          },
        },
      });
    }

    setupPlayer();

    return () => {
      cancelled = true;
      playerReadyRef.current = false;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const player = playerRef.current;
    if (!videoId) {
      if (playerReadyRef.current && player) {
        player.stopVideo();
      }
      return;
    }

    if (playerReadyRef.current && player) {
      playVideo(player, videoId);
    }
  }, [videoId]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-ktv-card-border bg-black ktv-glow">
      <div
        id={containerId}
        className={videoId ? "h-full w-full" : "pointer-events-none h-full w-full opacity-0"}
      />
      {!videoId && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-8">
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
