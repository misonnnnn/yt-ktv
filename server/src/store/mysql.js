const { pool } = require("../db");

const STAT_COLUMNS = new Set([
  "rooms_created",
  "songs_queued",
  "page_views",
]);

let dailyStatsReady = false;
let songPicksReady = false;
const POPULAR_PAGE_SIZE = 7;

function clip(value, max) {
  return String(value || "").trim().slice(0, max);
}

async function ensureDailyStatsTable() {
  if (dailyStatsReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS daily_stats (
      day DATE NOT NULL PRIMARY KEY,
      rooms_created INT NOT NULL DEFAULT 0,
      songs_queued INT NOT NULL DEFAULT 0,
      page_views INT NOT NULL DEFAULT 0
    )
  `);

  const [columns] = await pool.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'daily_stats'`
  );
  const names = new Set(columns.map((row) => row.COLUMN_NAME));

  if (names.has("homepage_views") && names.has("page_views")) {
    await pool.query(
      "UPDATE daily_stats SET page_views = page_views + homepage_views"
    );
    await pool.query("ALTER TABLE daily_stats DROP COLUMN homepage_views");
  } else if (names.has("homepage_views")) {
    await pool.query(
      "ALTER TABLE daily_stats CHANGE homepage_views page_views INT NOT NULL DEFAULT 0"
    );
  } else if (!names.has("page_views")) {
    await pool.query(
      "ALTER TABLE daily_stats ADD COLUMN page_views INT NOT NULL DEFAULT 0"
    );
  }

  dailyStatsReady = true;
}

async function bumpDailyStat(column) {
  if (!STAT_COLUMNS.has(column)) return;
  await ensureDailyStatsTable();
  await pool.query(
    `INSERT INTO daily_stats (day, ${column}) VALUES (CURDATE(), 1)
     ON DUPLICATE KEY UPDATE ${column} = ${column} + 1`
  );
}

async function getRoomByCode(roomCode) {
  const [rows] = await pool.query(
    "SELECT id, room_code, party_name, host_name, created_at FROM rooms WHERE room_code = ?",
    [roomCode.toUpperCase()]
  );
  return rows[0] || null;
}

async function createRoom({ roomCode, partyName, hostName }) {
  const [result] = await pool.query(
    "INSERT INTO rooms (room_code, party_name, host_name) VALUES (?, ?, ?)",
    [roomCode, partyName, hostName]
  );

  const [rows] = await pool.query("SELECT * FROM rooms WHERE id = ?", [
    result.insertId,
  ]);

  try {
    await bumpDailyStat("rooms_created");
  } catch (error) {
    console.error("Failed to bump rooms_created stat:", error);
  }

  return { insertId: result.insertId, room: rows[0] };
}

async function getQueueRows(roomId) {
  const [rows] = await pool.query(
    `SELECT id, video_id, song_title, artist, thumbnail, singer_name, status, created_at
     FROM queue
     WHERE room_id = ? AND status IN ('waiting', 'playing')
     ORDER BY created_at ASC`,
    [roomId]
  );
  return rows;
}

async function getPlayingItem(roomId) {
  const [rows] = await pool.query(
    "SELECT * FROM queue WHERE room_id = ? AND status = 'playing' LIMIT 1",
    [roomId]
  );
  return rows[0] || null;
}

let queueUserColumn = null;

async function queueHasUserColumn() {
  if (queueUserColumn !== null) return queueUserColumn;
  const [rows] = await pool.query(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'queue' AND COLUMN_NAME = 'user_id'`
  );
  queueUserColumn = rows.length > 0;
  return queueUserColumn;
}

async function insertQueueItem({
  roomId,
  videoId,
  songTitle,
  artist,
  thumbnail,
  singerName,
  status,
  userId,
}) {
  const withUser = userId && (await queueHasUserColumn());
  const [result] = withUser
    ? await pool.query(
        `INSERT INTO queue (room_id, video_id, song_title, artist, thumbnail, singer_name, status, user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [roomId, videoId, songTitle, artist, thumbnail, singerName, status, userId]
      )
    : await pool.query(
        `INSERT INTO queue (room_id, video_id, song_title, artist, thumbnail, singer_name, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [roomId, videoId, songTitle, artist, thumbnail, singerName, status]
      );

  const [rows] = await pool.query("SELECT * FROM queue WHERE id = ?", [
    result.insertId,
  ]);

  try {
    await bumpDailyStat("songs_queued");
  } catch (error) {
    console.error("Failed to bump songs_queued stat:", error);
  }

  try {
    await recordSongPick({
      videoId,
      title: songTitle,
      artist,
      thumbnail,
    });
  } catch (error) {
    console.error("Failed to record song pick:", error);
  }

  return rows[0];
}

async function ensureSongPicksTable() {
  if (songPicksReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS song_picks (
      video_id VARCHAR(50) NOT NULL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      artist VARCHAR(255) NOT NULL DEFAULT '',
      thumbnail VARCHAR(500) NULL,
      pick_count INT NOT NULL DEFAULT 0,
      last_picked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_song_picks_rank (pick_count, last_picked_at)
    )
  `);
  songPicksReady = true;
}

async function recordSongPick({ videoId, title, artist, thumbnail }) {
  const id = clip(videoId, 50);
  if (!id) return;

  await ensureSongPicksTable();
  await pool.query(
    `INSERT INTO song_picks (video_id, title, artist, thumbnail, pick_count)
     VALUES (?, ?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE
       pick_count = pick_count + 1,
       title = VALUES(title),
       artist = VALUES(artist),
       thumbnail = IF(VALUES(thumbnail) = '', thumbnail, VALUES(thumbnail))`,
    [id, clip(title, 255), clip(artist, 255), clip(thumbnail, 500)]
  );
}

async function listPopularSongs(page) {
  await ensureSongPicksTable();

  const [countRows] = await pool.query(
    "SELECT COUNT(*) AS total FROM song_picks"
  );
  const total = Number(countRows[0].total) || 0;
  const totalPages = total === 0 ? 0 : Math.ceil(total / POPULAR_PAGE_SIZE);
  const requested = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safePage = totalPages === 0 ? 1 : Math.min(requested, totalPages);
  const offset = (safePage - 1) * POPULAR_PAGE_SIZE;

  const [rows] = await pool.query(
    `SELECT video_id, title, artist, thumbnail, pick_count
     FROM song_picks
     ORDER BY pick_count DESC, last_picked_at DESC
     LIMIT ? OFFSET ?`,
    [POPULAR_PAGE_SIZE, offset]
  );

  return {
    songs: rows.map((row) => ({
      videoId: row.video_id,
      title: row.title,
      channelTitle: row.artist,
      thumbnail: row.thumbnail || "",
      pickCount: Number(row.pick_count) || 0,
    })),
    page: safePage,
    pageSize: POPULAR_PAGE_SIZE,
    total,
    totalPages,
  };
}

async function recordPageView() {
  await bumpDailyStat("page_views");
  return true;
}

async function sumStatsSince(daysAgo) {
  await ensureDailyStatsTable();
  const [rows] = await pool.query(
    `SELECT
       COALESCE(SUM(rooms_created), 0) AS roomsCreated,
       COALESCE(SUM(songs_queued), 0) AS songsQueued,
       COALESCE(SUM(page_views), 0) AS pageViews
     FROM daily_stats
     WHERE day >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
    [daysAgo]
  );
  return {
    roomsCreated: Number(rows[0].roomsCreated) || 0,
    songsQueued: Number(rows[0].songsQueued) || 0,
    pageViews: Number(rows[0].pageViews) || 0,
  };
}

async function getUsageStats() {
  const [today, last7Days, last30Days] = await Promise.all([
    sumStatsSince(0),
    sumStatsSince(6),
    sumStatsSince(29),
  ]);

  return { today, last7Days, last30Days };
}

async function getQueueItemById(queueId, roomId) {
  const [rows] = await pool.query(
    "SELECT * FROM queue WHERE id = ? AND room_id = ?",
    [queueId, roomId]
  );
  return rows[0] || null;
}

async function deleteQueueItem(queueId) {
  await pool.query("DELETE FROM queue WHERE id = ?", [queueId]);
  return true;
}

/** Remove finished/historical rows and any YouTube queue data older than 30 days. */
async function deleteQueueOlderThanDays(days) {
  const [result] = await pool.query(
    `DELETE FROM queue
     WHERE status IN ('completed', 'skipped')
        OR created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
    [days]
  );
  return result.affectedRows || 0;
}

async function updateQueueStatus(queueId, status, _roomId) {
  await pool.query("UPDATE queue SET status = ? WHERE id = ?", [
    status,
    queueId,
  ]);

  const [rows] = await pool.query("SELECT * FROM queue WHERE id = ?", [
    queueId,
  ]);
  return rows[0] || null;
}

async function getNextWaitingItem(roomId) {
  const [rows] = await pool.query(
    "SELECT * FROM queue WHERE room_id = ? AND status = 'waiting' ORDER BY created_at ASC LIMIT 1",
    [roomId]
  );
  return rows[0] || null;
}

async function listRoomCodes() {
  const [rows] = await pool.query("SELECT room_code FROM rooms");
  return rows.map((row) => String(row.room_code).toUpperCase());
}

/** Deletes the room; queue rows go with it via ON DELETE CASCADE. */
async function deleteRoomByCode(roomCode) {
  const [result] = await pool.query("DELETE FROM rooms WHERE room_code = ?", [
    String(roomCode).toUpperCase(),
  ]);
  return (result.affectedRows || 0) > 0;
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
  recordPageView,
  getUsageStats,
  listPopularSongs,
};
