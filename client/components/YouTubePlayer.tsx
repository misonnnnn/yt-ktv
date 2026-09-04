"use client";

import { useEffect, useRef } from "react";

type YouTubePlayerProps = {
  videoId: string | null;
  onEnded: () => void;
  className?: string;
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

export default function YouTubePlayer({
  videoId,
  onEnded,
  className,
}: YouTubePlayerProps) {
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  // Create a fresh player only when we have a video.
  // (Creating it while hidden often causes black video + working audio.)
  useEffect(() => {
    if (!videoId) return;

    const currentVideoId = videoId;
    let cancelled = false;
    let player: YTPlayer | null = null;

    async function setupPlayer() {
      await loadYouTubeApi();
      if (cancelled) return;

      // YouTube replaces this div with an iframe
      player = new window.YT.Player("youtube-player-container", {
        videoId: currentVideoId,
        height: "100%",
        width: "100%",
        playerVars: {
          autoplay: 1,
          controls: 0, // hide YouTube control bar
          disablekb: 1, // block keyboard shortcuts on the player
          fs: 0, // hide fullscreen button
          iv_load_policy: 3, // hide annotations
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: (event) => {
            // Make sure playback actually starts
            event.target.playVideo();
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              onEndedRef.current();
            }
          },
        },
      });

      // If the song already changed while we were setting up, clean up
      if (cancelled) {
        player.destroy();
        player = null;
      }
    }

    void setupPlayer();

    return () => {
      cancelled = true;
      player?.destroy();
      player = null;
    };
  }, [videoId]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-ktv-card-border bg-black ktv-glow [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:h-full [&_iframe]:w-full ${className ?? "aspect-video w-full"}`}
    >
      {videoId ? (
        // key forces a brand-new empty div for YouTube to fill each song
        <div key={videoId} className="absolute inset-0 h-full w-full">
          <div id="youtube-player-container" className="h-full w-full" />
        </div>
      ) : (
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
