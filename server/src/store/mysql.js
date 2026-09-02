const { pool } = require("../db");

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

async function insertQueueItem({
  roomId,
  videoId,
  songTitle,
  artist,
  thumbnail,
  singerName,
  status,
}) {
  const [result] = await pool.query(
    `INSERT INTO queue (room_id, video_id, song_title, artist, thumbnail, singer_name, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [roomId, videoId, songTitle, artist, thumbnail, singerName, status]
  );

  const [rows] = await pool.query("SELECT * FROM queue WHERE id = ?", [
    result.insertId,
  ]);

  return rows[0];
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

module.exports = {
  getRoomByCode,
  createRoom,
  getQueueRows,
  getPlayingItem,
  insertQueueItem,
  getQueueItemById,
  deleteQueueItem,
  updateQueueStatus,
  getNextWaitingItem,
};
