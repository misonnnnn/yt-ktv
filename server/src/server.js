require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const store = require("./store");
const youtubeRoutes = require("./routes/youtube");

/** Turn YouTube HTML entities (like &#39;) into normal text. */
function decodeHtml(text) {
  if (!text) return "";

  return String(text)
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

const app = express();
const server = http.createServer(app);

/** Add both www and non-www variants of a site origin. */
function withWwwVariants(origin) {
  try {
    const url = new URL(origin);
    const host = url.hostname;
    const variants = [url.origin];

    // Skip localhost / IPs — www does not apply there
    if (host === "localhost" || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) {
      return variants;
    }

    if (host.startsWith("www.")) {
      url.hostname = host.slice(4);
    } else {
      url.hostname = `www.${host}`;
    }
    variants.push(url.origin);
    return variants;
  } catch {
    return [origin];
  }
}

/** Normalize and collect allowed browser origins for CORS / Socket.IO. */
function getAllowedOrigins() {
  const defaults = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ];

  const fromEnv = String(process.env.CLIENT_URL || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    // Fix common mistakes like http://http://host:3000/:3000
    .map((value) => value.replace(/^http:\/\/http:\/\//i, "http://"))
    .map((value) => value.replace(/\/:(\d+)$/, ":$1"))
    .map((value) => value.replace(/\/$/, ""))
    .flatMap(withWwwVariants);

  return [...new Set([...defaults, ...fromEnv])];
}

const allowedOrigins = getAllowedOrigins();

function isOriginAllowed(origin) {
  if (!origin) return true; // same-origin / non-browser tools
  return allowedOrigins.includes(origin);
}

const corsOptions = {
  origin(origin, callback) {
    if (isOriginAllowed(origin)) {
      callback(null, origin || allowedOrigins[0]);
      return;
    }
    callback(new Error(`CORS blocked origin: ${origin}`));
  },
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
};

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "DELETE"],
  },
});

app.use(cors(corsOptions));
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
    songTitle: decodeHtml(row.song_title),
    artist: decodeHtml(row.artist),
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
    songTitle: decodeHtml(song.song_title),
    artist: decodeHtml(song.artist),
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
    const songTitle = decodeHtml(String(req.body.songTitle || "").trim());
    const artist = decodeHtml(String(req.body.artist || "").trim());
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

  // Host → guests: YouTube play/pause/time sync (no WebRTC)
  socket.on("player:sync", (payload) => {
    const code = socket.data.roomCode;
    if (!code || !payload || typeof payload !== "object") return;

    socket.to(code).emit("player:sync", {
      videoId: payload.videoId ?? null,
      state: payload.state || "unstarted",
      currentTime:
        typeof payload.currentTime === "number" ? payload.currentTime : 0,
    });
  });

  // Guest joined mid-song — ask host to send a fresh sync snapshot
  socket.on("player:sync-request", () => {
    const code = socket.data.roomCode;
    if (!code) return;
    socket.to(code).emit("player:sync-request");
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
  console.log(`CORS allowed origins: ${allowedOrigins.join(", ")}`);
});
