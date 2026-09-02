require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const store = require("./store");
const youtubeRoutes = require("./routes/youtube");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST", "DELETE"],
  },
});

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000" }));
app.use(express.json());

app.use("/api/youtube", youtubeRoutes);

// In-memory connected users per room (not stored in MySQL)
const roomUsers = new Map();

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function getRoomByCode(roomCode) {
  return store.getRoomByCode(roomCode);
}

function formatQueueRow(row, position) {
  return {
    id: row.id,
    videoId: row.video_id,
    songTitle: row.song_title,
    artist: row.artist,
    thumbnail: row.thumbnail,
    singerName: row.singer_name,
    status: row.status,
    createdAt: row.created_at,
    position,
  };
}

async function getQueueRows(roomId) {
  return store.getQueueRows(roomId);
}

async function buildRoomResponse(room) {
  const rows = await getQueueRows(room.id);
  let waitingPosition = 1;

  const queue = rows.map((row) => {
    const position = row.status === "waiting" ? waitingPosition++ : 0;
    return formatQueueRow(row, position);
  });

  const nowPlaying = queue.find((item) => item.status === "playing") || null;
  const upNext = queue.filter((item) => item.status === "waiting");

  return {
    room: {
      id: room.id,
      roomCode: room.room_code,
      partyName: room.party_name,
      hostName: room.host_name,
    },
    queue,
    upNext,
    nowPlaying,
  };
}

function emitQueueUpdated(roomCode) {
  io.to(roomCode).emit("queue:updated", { roomCode });
}

function emitPlayerChanged(roomCode, song) {
  if (!song) {
    io.to(roomCode).emit("player:changed", {
      queueId: null,
      videoId: null,
      songTitle: null,
      artist: null,
      singerName: null,
      thumbnail: null,
    });
    return;
  }

  io.to(roomCode).emit("player:changed", {
    queueId: song.id,
    videoId: song.video_id,
    songTitle: song.song_title,
    artist: song.artist,
    singerName: song.singer_name,
    thumbnail: song.thumbnail,
  });
}

async function advanceQueue(roomId, roomCode, finishedStatus) {
  const playing = await store.getPlayingItem(roomId);

  if (playing) {
    await store.updateQueueStatus(playing.id, finishedStatus, roomId);
  }

  const next = await store.getNextWaitingItem(roomId);

  if (next) {
    await store.updateQueueStatus(next.id, "playing", roomId);
    emitPlayerChanged(roomCode, next);
  } else {
    emitPlayerChanged(roomCode, null);
  }

  emitQueueUpdated(roomCode);
}

async function createUniqueRoomCode() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateRoomCode();
    const existing = await getRoomByCode(code);
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique room code");
}

// --- Room routes ---

app.post("/api/rooms", async (req, res) => {
  try {
    const partyName = String(req.body.partyName || "").trim();
    const hostName = String(req.body.hostName || "").trim();

    if (!partyName || !hostName) {
      return res
        .status(400)
        .json({ error: "partyName and hostName are required" });
    }

    const roomCode = await createUniqueRoomCode();

    const { insertId } = await store.createRoom({
      roomCode,
      partyName,
      hostName,
    });

    res.status(201).json({
      room: {
        id: insertId,
        roomCode,
        partyName,
        hostName,
      },
    });
  } catch (error) {
    console.error("Create room error:", error);
    res.status(500).json({ error: "Failed to create room" });
  }
});

app.get("/api/rooms/:roomCode", async (req, res) => {
  try {
    const room = await getRoomByCode(req.params.roomCode);

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    const data = await buildRoomResponse(room);
    res.json(data);
  } catch (error) {
    console.error("Get room error:", error);
    res.status(500).json({ error: "Failed to load room" });
  }
});

app.get("/api/rooms/:roomCode/queue", async (req, res) => {
  try {
    const room = await getRoomByCode(req.params.roomCode);

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    const data = await buildRoomResponse(room);
    res.json({ queue: data.queue, nowPlaying: data.nowPlaying, upNext: data.upNext });
  } catch (error) {
    console.error("Get queue error:", error);
    res.status(500).json({ error: "Failed to load queue" });
  }
});

app.post("/api/rooms/:roomCode/queue", async (req, res) => {
  try {
    const room = await getRoomByCode(req.params.roomCode);

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    const videoId = String(req.body.videoId || "").trim();
    const songTitle = String(req.body.songTitle || "").trim();
    const artist = String(req.body.artist || "").trim();
    const thumbnail = String(req.body.thumbnail || "").trim();
    const singerName = String(req.body.singerName || "").trim();

    if (!videoId || !songTitle || !singerName) {
      return res.status(400).json({
        error: "videoId, songTitle, and singerName are required",
      });
    }

    const playing = await store.getPlayingItem(room.id);
    const status = playing ? "waiting" : "playing";

    const created = await store.insertQueueItem({
      roomId: room.id,
      videoId,
      songTitle,
      artist,
      thumbnail,
      singerName,
      status,
    });

    if (status === "playing") {
      emitPlayerChanged(room.room_code, created);
    }

    emitQueueUpdated(room.room_code);

    res.status(201).json({
      item: formatQueueRow(created, status === "waiting" ? 1 : 0),
    });
  } catch (error) {
    console.error("Add to queue error:", error);
    res.status(500).json({ error: "Failed to add song to queue" });
  }
});

app.delete("/api/rooms/:roomCode/queue/:queueId", async (req, res) => {
  try {
    const room = await getRoomByCode(req.params.roomCode);

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    const queueId = Number(req.params.queueId);

    const item = await store.getQueueItemById(queueId, room.id);

    if (!item) {
      return res.status(404).json({ error: "Queue item not found" });
    }

    if (item.status === "playing") {
      return res
        .status(400)
        .json({ error: "Cannot remove the song that is currently playing" });
    }

    await store.deleteQueueItem(queueId, room.id);
    emitQueueUpdated(room.room_code);

    res.json({ success: true });
  } catch (error) {
    console.error("Remove queue item error:", error);
    res.status(500).json({ error: "Failed to remove queue item" });
  }
});

app.post("/api/rooms/:roomCode/finish", async (req, res) => {
  try {
    const room = await getRoomByCode(req.params.roomCode);

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    await advanceQueue(room.id, room.room_code, "completed");
    res.json({ success: true });
  } catch (error) {
    console.error("Finish song error:", error);
    res.status(500).json({ error: "Failed to finish song" });
  }
});

app.post("/api/rooms/:roomCode/skip", async (req, res) => {
  try {
    const room = await getRoomByCode(req.params.roomCode);

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    await advanceQueue(room.id, room.room_code, "skipped");
    io.to(room.room_code).emit("player:skipped", { roomCode: room.room_code });
    res.json({ success: true });
  } catch (error) {
    console.error("Skip song error:", error);
    res.status(500).json({ error: "Failed to skip song" });
  }
});

// --- Socket.IO ---

io.on("connection", (socket) => {
  socket.on("room:join", ({ roomCode, name }) => {
    if (!roomCode) return;

    const code = String(roomCode).toUpperCase();
    socket.join(code);
    socket.data.roomCode = code;
    socket.data.name = String(name || "Guest").trim() || "Guest";

    if (!roomUsers.has(code)) {
      roomUsers.set(code, new Map());
    }

    roomUsers.get(code).set(socket.id, socket.data.name);
    const guestCount = roomUsers.get(code).size;

    io.to(code).emit("room:user-joined", {
      name: socket.data.name,
      guestCount,
    });
  });

  socket.on("disconnect", () => {
    const code = socket.data.roomCode;
    const name = socket.data.name;

    if (!code || !roomUsers.has(code)) return;

    roomUsers.get(code).delete(socket.id);

    if (roomUsers.get(code).size === 0) {
      roomUsers.delete(code);
    }

    const guestCount = roomUsers.has(code) ? roomUsers.get(code).size : 0;

    io.to(code).emit("room:user-left", { name, guestCount });
  });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  const storage = store.isDatabaseEnabled() ? "MySQL" : "in-memory";
  console.log(`Server running on http://localhost:${PORT} (${storage})`);
});
