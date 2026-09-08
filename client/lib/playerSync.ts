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

/** How often the host sends its current time while a song is loaded. */
export const PLAYER_SYNC_INTERVAL_MS = 750;

/** If guest time drifts more than this (seconds), seek to match the host. */
export const PLAYER_SYNC_DRIFT_SECONDS = 1.25;

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
