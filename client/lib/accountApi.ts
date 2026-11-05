import { apiRequest } from "./api";

export type AccountUser = {
  id: number;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  hasPassword: boolean;
  createdAt: string;
};

export type SavedSong = {
  id: number;
  videoId: string;
  title: string | null;
  artist: string | null;
  thumbnail: string | null;
  roomCode?: string | null;
  requestedAt?: string | null;
  startedAt?: string | null;
  createdAt?: string | null;
};

export type PlaylistSummary = {
  id: number;
  name: string;
  description: string | null;
  songCount: number;
  createdAt: string;
  updatedAt: string;
};

export type PlaylistDetail = PlaylistSummary & {
  songs: SavedSong[];
};

export type Activity = {
  songsRequested: number;
  turnsStarted: number;
  partiesHosted: number;
  partiesJoined: number;
  recentRequests: SavedSong[];
  recentParties: {
    roomCode: string;
    role: "host" | "guest";
    partyName: string | null;
    visitedAt: string;
  }[];
};

type SongInput = {
  videoId: string;
  title?: string | null;
  artist?: string | null;
  thumbnail?: string | null;
};

function songBody(song: SongInput) {
  return {
    videoId: song.videoId,
    title: song.title || "",
    artist: song.artist || "",
    thumbnail: song.thumbnail || "",
  };
}

export async function getSession() {
  return apiRequest<{ user: AccountUser | null }>("/api/auth/me");
}

export async function registerAccount(input: {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
}) {
  return apiRequest<{ needsVerification: boolean; email: string }>("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function loginAccount(email: string, password: string) {
  return apiRequest<{ user: AccountUser }>("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export async function logoutAccount() {
  return apiRequest<{ success: boolean }>("/api/auth/logout", { method: "POST" });
}

export async function loginWithGoogle(credential: string) {
  return apiRequest<{ user: AccountUser }>("/api/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });
}

export async function forgotPassword(email: string) {
  return apiRequest<{ message: string }>("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(input: {
  token: string;
  password: string;
  confirmPassword: string;
}) {
  return apiRequest<{ user: AccountUser }>("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function verifyEmail(token: string) {
  return apiRequest<{ success: boolean; user?: AccountUser }>("/api/auth/verify-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
}

export async function resendVerification(email?: string) {
  return apiRequest<{ success: boolean; message?: string }>(
    "/api/auth/resend-verification",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(email ? { email } : {}),
    }
  );
}

export async function updateProfile(input: {
  displayName?: string;
  avatarUrl?: string;
}) {
  return apiRequest<{ user: AccountUser }>("/api/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function changePassword(input: {
  currentPassword?: string;
  password: string;
  confirmPassword: string;
}) {
  return apiRequest<{ user: AccountUser }>("/api/me/password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function deleteAccount(input: { password?: string; confirm?: string }) {
  return apiRequest<{ success: boolean }>("/api/me/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function recordPartyVisit(roomCode: string, role: "host" | "guest") {
  return apiRequest<{ success: boolean }>("/api/me/parties", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomCode, role }),
  });
}

export async function listFavorites() {
  return apiRequest<{ songs: SavedSong[] }>("/api/me/favorites");
}

export async function addFavorite(song: SongInput) {
  return apiRequest<{ success: boolean }>("/api/me/favorites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(songBody(song)),
  });
}

export async function removeFavorite(videoId: string) {
  return apiRequest<{ success: boolean }>(
    `/api/me/favorites/${encodeURIComponent(videoId)}`,
    { method: "DELETE" }
  );
}

export async function listPlaylists() {
  return apiRequest<{ playlists: PlaylistSummary[] }>("/api/me/playlists");
}

export async function createPlaylist(name: string, description: string) {
  return apiRequest<{ playlist: PlaylistDetail }>("/api/me/playlists", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description }),
  });
}

export async function getPlaylist(id: number) {
  return apiRequest<{ playlist: PlaylistDetail }>(`/api/me/playlists/${id}`);
}

export async function updatePlaylist(id: number, name: string, description: string) {
  return apiRequest<{ playlist: PlaylistDetail }>(`/api/me/playlists/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description }),
  });
}

export async function deletePlaylist(id: number) {
  return apiRequest<{ success: boolean }>(`/api/me/playlists/${id}`, {
    method: "DELETE",
  });
}

export async function addPlaylistSong(id: number, song: SongInput) {
  return apiRequest<{ playlist: PlaylistDetail }>(`/api/me/playlists/${id}/songs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(songBody(song)),
  });
}

export async function removePlaylistSong(id: number, videoId: string) {
  return apiRequest<{ success: boolean }>(
    `/api/me/playlists/${id}/songs/${encodeURIComponent(videoId)}`,
    { method: "DELETE" }
  );
}

export async function listRequests(playedOnly = false) {
  const query = playedOnly ? "?played=1" : "";
  return apiRequest<{ songs: SavedSong[] }>(`/api/me/requests${query}`);
}

export async function clearRequests() {
  return apiRequest<{ success: boolean }>("/api/me/requests", { method: "DELETE" });
}

export async function getActivity() {
  return apiRequest<Activity>("/api/me/activity");
}
