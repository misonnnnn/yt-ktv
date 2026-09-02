let nextRoomId = 1;
let nextQueueId = 1;

const roomsByCode = new Map();
const queueByRoomId = new Map();

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
    created_at: new Date(),
  };

  if (!queueByRoomId.has(roomId)) {
    queueByRoomId.set(roomId, []);
  }

  queueByRoomId.get(roomId).push(item);
  return item;
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
