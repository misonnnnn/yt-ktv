import { addToQueue } from "./api";
import type { SearchResult } from "./types";

const ROOM_KEY = "tara-active-room";
const SINGER_KEY = "tara-active-singer";
const ROLE_KEY = "tara-active-role";

export function rememberActiveParty(
  roomCode: string,
  singerName: string,
  role?: "host" | "guest"
) {
  if (typeof window === "undefined" || !roomCode) return;
  sessionStorage.setItem(ROOM_KEY, roomCode.toUpperCase());
  sessionStorage.setItem(SINGER_KEY, singerName || "");
  if (role) sessionStorage.setItem(ROLE_KEY, role);
}

export function readActiveParty() {
  if (typeof window === "undefined") {
    return { roomCode: "", singerName: "", role: "" as const };
  }
  const role = sessionStorage.getItem(ROLE_KEY);
  return {
    roomCode: sessionStorage.getItem(ROOM_KEY) || "",
    singerName: sessionStorage.getItem(SINGER_KEY) || "",
    role: role === "host" || role === "guest" ? role : "",
  };
}

export function activePartyPath() {
  const party = readActiveParty();
  if (!party.roomCode) return "";
  if (party.role === "host") {
    const params = new URLSearchParams({ room: party.roomCode });
    if (party.singerName) params.set("host", party.singerName);
    return `/host?${params.toString()}`;
  }
  const params = new URLSearchParams();
  if (party.singerName) params.set("name", party.singerName);
  const query = params.toString();
  return `/join/${party.roomCode}${query ? `?${query}` : ""}`;
}

export async function addSongToActiveParty(song: {
  videoId: string;
  title: string;
  artist: string;
  thumbnail?: string | null;
}) {
  const { roomCode, singerName } = readActiveParty();
  if (!roomCode) {
    throw new Error("Join or host a party first, then you can add this song to its queue.");
  }

  await addToQueue(roomCode, {
    videoId: song.videoId,
    songTitle: song.title,
    artist: song.artist,
    thumbnail: song.thumbnail || "",
    singerName: singerName || "You",
  });
}

export function searchResultFromSaved(song: {
  videoId: string;
  title: string | null;
  artist: string | null;
  thumbnail: string | null;
}): SearchResult {
  return {
    videoId: song.videoId,
    title: song.title || "Saved video",
    channelTitle: song.artist || "YouTube",
    thumbnail: song.thumbnail || "",
  };
}
