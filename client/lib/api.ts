import type {
  ApiQueueItem,
  NowPlaying,
  RoomInfo,
  SearchResult,
} from "./types";
import { decodeHtml } from "./decodeHtml";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: "include",
    });
  } catch {
    throw new Error("Cannot reach the server. Is it running?");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong");
  }

  return data as T;
}

export async function createRoom(partyName: string, hostName: string) {
  return apiRequest<{ room: RoomInfo }>("/api/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ partyName, hostName }),
  });
}

export async function getRoom(roomCode: string) {
  return apiRequest<{
    room: RoomInfo;
    queue: ApiQueueItem[];
    upNext: ApiQueueItem[];
    nowPlaying: ApiQueueItem | null;
  }>(`/api/rooms/${encodeURIComponent(roomCode)}`);
}

export async function getQueue(roomCode: string) {
  return apiRequest<{
    queue: ApiQueueItem[];
    upNext: ApiQueueItem[];
    nowPlaying: ApiQueueItem | null;
  }>(`/api/rooms/${encodeURIComponent(roomCode)}/queue`);
}

export async function addToQueue(
  roomCode: string,
  song: {
    videoId: string;
    songTitle: string;
    artist: string;
    thumbnail: string;
    singerName: string;
  }
) {
  return apiRequest<{ item: ApiQueueItem }>(
    `/api/rooms/${encodeURIComponent(roomCode)}/queue`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(song),
    }
  );
}

export async function removeFromQueue(roomCode: string, queueId: string) {
  return apiRequest<{ success: boolean }>(
    `/api/rooms/${encodeURIComponent(roomCode)}/queue/${queueId}`,
    { method: "DELETE" }
  );
}

export async function searchYouTube(query: string) {
  const params = new URLSearchParams({ q: query });
  return apiRequest<{ results: SearchResult[] }>(
    `/api/youtube/search?${params.toString()}`
  );
}

export async function finishSong(roomCode: string) {
  return apiRequest<{ success: boolean }>(
    `/api/rooms/${encodeURIComponent(roomCode)}/finish`,
    { method: "POST" }
  );
}

export async function skipSong(roomCode: string) {
  return apiRequest<{ success: boolean }>(
    `/api/rooms/${encodeURIComponent(roomCode)}/skip`,
    { method: "POST" }
  );
}

export function apiItemToNowPlaying(
  item: ApiQueueItem | null
): NowPlaying | null {
  if (!item) return null;

  return {
    queueId: item.id,
    videoId: item.videoId,
    songTitle: decodeHtml(item.songTitle),
    artist: decodeHtml(item.artist),
    singerName: item.singerName,
    thumbnail: item.thumbnail,
  };
}

export function getJoinUrl(roomCode: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/join/${roomCode}`;
  }
  return `${
    process.env.NEXT_PUBLIC_CLIENT_URL || "http://localhost:3000"
  }/join/${roomCode}`;
}

export async function recordHomepageView() {
  return apiRequest<{ success: boolean }>("/api/page-views", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: "/" }),
  });
}

export type AdminPeriodStats = {
  roomsCreated: number;
  songsQueued: number;
  homepageViews: number;
};

export type AdminStats = {
  today: AdminPeriodStats;
  last7Days: AdminPeriodStats;
  last30Days: AdminPeriodStats;
  liveConnectedRooms: number;
  liveConnectedUsers: number;
};

export async function getAdminStats(secret: string) {
  return apiRequest<AdminStats>("/api/admin/stats", {
    headers: { "x-admin-secret": secret },
  });
}
