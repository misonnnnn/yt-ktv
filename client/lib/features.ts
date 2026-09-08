/**
 * NEXT_PUBLIC_ENABLE_GUEST_VIDEO
 * When "true", guests load the same YouTube video (muted) and follow
 * the host's play/pause/time over the room WebSocket.
 * When unset/false, guests only see song info like before.
 */
export const ENABLE_GUEST_VIDEO =
  process.env.NEXT_PUBLIC_ENABLE_GUEST_VIDEO === "true";
