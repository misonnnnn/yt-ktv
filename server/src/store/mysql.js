const { pool } = require("../db");

const STAT_COLUMNS = new Set([
  "rooms_created",
  "songs_queued",
  "homepage_views",
]);

let dailyStatsReady = false;

async function ensureDailyStatsTable() {
  if (dailyStatsReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS daily_stats (
      day DATE NOT NULL PRIMARY KEY,
      rooms_created INT NOT NULL DEFAULT 0,
      songs_queued INT NOT NULL DEFAULT 0,
      homepage_views INT NOT NULL DEFAULT 0
    )
  `);
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

  return rows[0];
}

async function recordHomepageView() {
  await bumpDailyStat("homepage_views");
  return true;
}

async function sumStatsSince(daysAgo) {
  await ensureDailyStatsTable();
  const [rows] = await pool.query(
    `SELECT
       COALESCE(SUM(rooms_created), 0) AS roomsCreated,
       COALESCE(SUM(songs_queued), 0) AS songsQueued,
       COALESCE(SUM(homepage_views), 0) AS homepageViews
     FROM daily_stats
     WHERE day >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
    [daysAgo]
  );
  return {
    roomsCreated: Number(rows[0].roomsCreated) || 0,
    songsQueued: Number(rows[0].songsQueued) || 0,
    homepageViews: Number(rows[0].homepageViews) || 0,
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
  recordHomepageView,
  getUsageStats,
};
