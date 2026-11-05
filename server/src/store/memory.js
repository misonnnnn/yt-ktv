let nextRoomId = 1;
let nextQueueId = 1;

const roomsByCode = new Map();
const queueByRoomId = new Map();
/** day (YYYY-MM-DD) → { rooms_created, songs_queued, homepage_views } */
const dailyStats = new Map();
/** videoId → { video_id, title, artist, thumbnail, pick_count, last_picked_at } */
const songPicks = new Map();
const POPULAR_PAGE_SIZE = 7;

function clip(value, max) {
  return String(value || "").trim().slice(0, max);
}

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function bumpDailyStat(column) {
  const key = todayKey();
  const row = dailyStats.get(key) || {
    rooms_created: 0,
    songs_queued: 0,
    homepage_views: 0,
  };
  row[column] = (row[column] || 0) + 1;
  dailyStats.set(key, row);
}

function getRoomByCode(roomCode) {
  return roomsByCode.get(roomCode.toUpperCase()) || null;
}

function createRoom({ roomCode, partyName, hostName }) {
  const id = nextRoomId++;
  const room = {
    id,
    room_code: roomCode,
    party_name: partyName,
    host_name: hostName,
    created_at: new Date(),
  };

  roomsByCode.set(roomCode.toUpperCase(), room);
  queueByRoomId.set(id, []);
  bumpDailyStat("rooms_created");

  return { insertId: id, room };
}

function getQueueRows(roomId) {
  const items = queueByRoomId.get(roomId) || [];
  return items
    .filter((item) => item.status === "waiting" || item.status === "playing")
    .sort((a, b) => a.created_at - b.created_at);
}

function getPlayingItem(roomId) {
  const items = queueByRoomId.get(roomId) || [];
  return items.find((item) => item.status === "playing") || null;
}

function insertQueueItem({
  roomId,
  videoId,
  songTitle,
  artist,
  thumbnail,
  singerName,
  status,
  userId,
}) {
  const id = nextQueueId++;
  const item = {
    id,
    room_id: roomId,
    video_id: videoId,
    song_title: songTitle,
    artist,
    thumbnail,
    singer_name: singerName,
    status,
    user_id: userId || null,
    created_at: new Date(),
  };

  if (!queueByRoomId.has(roomId)) {
    queueByRoomId.set(roomId, []);
  }

  queueByRoomId.get(roomId).push(item);
  bumpDailyStat("songs_queued");
  recordSongPick({
    videoId,
    title: songTitle,
    artist,
    thumbnail,
  });
  return item;
}

function recordSongPick({ videoId, title, artist, thumbnail }) {
  const id = clip(videoId, 50);
  if (!id) return;

  const existing = songPicks.get(id);
  if (existing) {
    existing.pick_count += 1;
    existing.title = clip(title, 255) || existing.title;
    existing.artist = clip(artist, 255);
    const nextThumbnail = clip(thumbnail, 500);
    if (nextThumbnail) existing.thumbnail = nextThumbnail;
    existing.last_picked_at = new Date();
    return;
  }

  songPicks.set(id, {
    video_id: id,
    title: clip(title, 255),
    artist: clip(artist, 255),
    thumbnail: clip(thumbnail, 500),
    pick_count: 1,
    last_picked_at: new Date(),
  });
}

function listPopularSongs(page) {
  const ranked = [...songPicks.values()].sort((a, b) => {
    if (b.pick_count !== a.pick_count) return b.pick_count - a.pick_count;
    return b.last_picked_at - a.last_picked_at;
  });

  const total = ranked.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / POPULAR_PAGE_SIZE);
  const requested = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safePage = totalPages === 0 ? 1 : Math.min(requested, totalPages);
  const offset = (safePage - 1) * POPULAR_PAGE_SIZE;

  return {
    songs: ranked.slice(offset, offset + POPULAR_PAGE_SIZE).map((row) => ({
      videoId: row.video_id,
      title: row.title,
      channelTitle: row.artist,
      thumbnail: row.thumbnail || "",
      pickCount: row.pick_count,
    })),
    page: safePage,
    pageSize: POPULAR_PAGE_SIZE,
    total,
    totalPages,
  };
}

function getQueueItemById(queueId, roomId) {
  const items = queueByRoomId.get(roomId) || [];
  return items.find((item) => item.id === queueId) || null;
}

function deleteQueueItem(queueId, roomId) {
  const items = queueByRoomId.get(roomId) || [];
  const index = items.findIndex((item) => item.id === queueId);

  if (index === -1) return false;

  items.splice(index, 1);
  return true;
}

/** Remove finished/historical rows and any YouTube queue data older than 30 days. */
function deleteQueueOlderThanDays(days) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  let removed = 0;

  for (const [roomId, items] of queueByRoomId.entries()) {
    const kept = items.filter((item) => {
      const isFinished =
        item.status === "completed" || item.status === "skipped";
      const created = new Date(item.created_at).getTime();
      if (isFinished || created < cutoff) {
        removed += 1;
        return false;
      }
      return true;
    });
    queueByRoomId.set(roomId, kept);
  }

  return removed;
}

function updateQueueStatus(queueId, status, roomId) {
  const items = queueByRoomId.get(roomId) || [];
  const item = items.find((entry) => entry.id === queueId);

  if (!item) return null;

  item.status = status;
  return item;
}

function getNextWaitingItem(roomId) {
  const items = queueByRoomId.get(roomId) || [];
  return (
    items
      .filter((item) => item.status === "waiting")
      .sort((a, b) => a.created_at - b.created_at)[0] || null
  );
}

function listRoomCodes() {
  return [...roomsByCode.keys()];
}

function deleteRoomByCode(roomCode) {
  const code = String(roomCode).toUpperCase();
  const room = roomsByCode.get(code);
  if (!room) return false;

  roomsByCode.delete(code);
  queueByRoomId.delete(room.id);
  return true;
}

function recordHomepageView() {
  bumpDailyStat("homepage_views");
  return true;
}

function sumStatsSince(daysAgo) {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - daysAgo);
  const startKey = todayKey(start);

  let roomsCreated = 0;
  let songsQueued = 0;
  let homepageViews = 0;

  for (const [day, row] of dailyStats.entries()) {
    if (day < startKey) continue;
    roomsCreated += row.rooms_created || 0;
    songsQueued += row.songs_queued || 0;
    homepageViews += row.homepage_views || 0;
  }

  return { roomsCreated, songsQueued, homepageViews };
}

function getUsageStats() {
  return {
    today: sumStatsSince(0),
    last7Days: sumStatsSince(6),
    last30Days: sumStatsSince(29),
  };
}

module.exports = {
  getRoomByCode,
  createRoom,
  getQueueRows,
  getPlayingItem,
  insertQueueItem,
  getQueueItemById,
  deleteQueueItem,
  deleteQueueOlderThanDays,
  updateQueueStatus,
  getNextWaitingItem,
  listRoomCodes,
  deleteRoomByCode,
  recordHomepageView,
  getUsageStats,
  listPopularSongs,
};
