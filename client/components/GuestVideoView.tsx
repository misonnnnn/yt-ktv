"use client";

import { useEffect, useRef } from "react";
import type { Socket } from "socket.io-client";
import YouTubePlayer, {
  type YouTubePlayerHandle,
} from "@/components/YouTubePlayer";
import {
  PLAYER_SYNC_DRIFT_SECONDS,
  type PlayerSyncPayload,
} from "@/lib/playerSync";

type GuestVideoViewProps = {
  socket: Socket | null;
  /** Current song from the room — so guests load video even before sync arrives. */
  videoId: string | null;
};

/**
 * Guest side: same YouTube video as the host, always muted.
 * Host is the source of truth for play/pause/time via player:sync.
 * YouTubePlayer already places a transparent overlay over the iframe.
 */
export default function GuestVideoView({
  socket,
  videoId,
}: GuestVideoViewProps) {
  const playerRef = useRef<YouTubePlayerHandle>(null);
  const videoIdRef = useRef(videoId);
  videoIdRef.current = videoId;

  useEffect(() => {
    if (!socket) return;

    function applySync(payload: PlayerSyncPayload) {
      if (!payload || typeof payload !== "object") return;

      const player = playerRef.current;
      if (!player) return;

      // Ignore sync for a different song — videoId prop drives which video is loaded
      const expectedId = videoIdRef.current;
      if (!expectedId) return;
      if (payload.videoId && payload.videoId !== expectedId) return;

      const hostTime =
        typeof payload.currentTime === "number" ? payload.currentTime : 0;
      const guestTime = player.getCurrentTime();
      if (Math.abs(guestTime - hostTime) > PLAYER_SYNC_DRIFT_SECONDS) {
        player.seekTo(hostTime);
      }

      // Follow host play/pause. Do not pause on "buffering" or guests get stuck.
      // Ignore early "paused/unstarted" while host is still at 0s — that is often
      // just autoplay not started yet; guest muted autoplay should keep going.
      if (payload.state === "playing") {
        player.resume();
      } else if (payload.state === "ended") {
        player.pause();
      } else if (payload.state === "paused" && hostTime > 0.5) {
        player.pause();
      }
    }

    socket.on("player:sync", applySync);
    socket.emit("player:sync-request");

    return () => {
      socket.off("player:sync", applySync);
    };
  }, [socket]);

  return (
    <div className="overflow-hidden rounded-2xl border border-ktv-card-border bg-black">
      <div className="relative aspect-video w-full">
        <YouTubePlayer
          ref={playerRef}
          className="h-full w-full rounded-none border-0"
          videoId={videoId}
          muted
          onEnded={() => {
            // Host advances the queue — guests only follow sync.
          }}
        />

        {!videoId && (
          <div className="pointer-events-none absolute inset-0 z-40 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-4 text-center">
            <p className="text-sm font-medium text-white/70">
              Waiting for host video…
            </p>
            <p className="text-xs text-white/40">
              Video only — sound stays on the host TV/speaker
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
