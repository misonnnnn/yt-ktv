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
    destroy: () => void;
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

export default function YouTubePlayer({ videoId, onEnded }: YouTubePlayerProps) {
  const playerRef = useRef<YTPlayer | null>(null);
  const onEndedRef = useRef(onEnded);
  const containerId = "youtube-player-container";

  onEndedRef.current = onEnded;

  useEffect(() => {
    if (!videoId) return;

    let cancelled = false;

    async function setupPlayer() {
      await loadYouTubeApi();
      if (cancelled) return;

      playerRef.current = new window.YT.Player(containerId, {
        height: "100%",
        width: "100%",
        videoId: videoId ?? undefined,
        playerVars: {
          autoplay: 1,
          rel: 0,
          modestbranding: 1,
        },
        events: {
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
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [videoId]);

  if (!videoId) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-ktv-card-border bg-black">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-8">
          <div className="text-4xl">🎤</div>
          <p className="text-xl font-semibold text-white/80">No song playing</p>
          <p className="text-sm text-white/40">
            Add songs to the queue to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-ktv-card-border bg-black ktv-glow">
      <div id={containerId} className="h-full w-full" />
    </div>
  );
}
