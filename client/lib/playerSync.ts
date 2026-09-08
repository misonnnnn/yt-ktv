/** Playback states we sync from host → guests. */
export type PlaybackSyncState =
  | "unstarted"
  | "playing"
  | "paused"
  | "buffering"
  | "ended";

export type PlayerSyncPayload = {
  videoId: string | null;
  state: PlaybackSyncState;
  currentTime: number;
};

/**
 * How often (ms) the host broadcasts its playhead to guests.
 * Lower = tighter sync, slightly more WebSocket traffic.
 */
export const PLAYER_SYNC_INTERVAL_MS = 500;

/**
 * How far apart (seconds) host vs guest can be before the guest seeks.
 * Lower = snappier catch-up after refresh/reconnect; too low can cause seek jitter.
 */
export const PLAYER_SYNC_DRIFT_SECONDS = 0.35;

/**
 * Extra seconds added when seeking while the host is playing.
 * Covers network + YouTube seek lag so the guest does not stay slightly behind.
 */
export const PLAYER_SYNC_SEEK_LEAD_SECONDS = 0.2;

export function mapYouTubeState(ytState: number): PlaybackSyncState {
  // YT.PlayerState: UNSTARTED=-1, ENDED=0, PLAYING=1, PAUSED=2, BUFFERING=3, CUED=5
  switch (ytState) {
    case 1:
      return "playing";
    case 2:
      return "paused";
    case 3:
      return "buffering";
    case 0:
      return "ended";
    default:
      return "unstarted";
  }
}
