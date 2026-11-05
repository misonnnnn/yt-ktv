require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const store = require("./store");
const accounts = require("./accounts");
const { getSessionUser } = require("./httpAuth");
const { getAllowedOrigins, isOriginAllowed } = require("./origins");
const youtubeRoutes = require("./routes/youtube");
const authRoutes = require("./routes/auth");
const libraryRoutes = require("./routes/library");

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

const allowedOrigins = getAllowedOrigins();

const corsOptions = {
  origin(origin, callback) {
    if (isOriginAllowed(origin)) {
      callback(null, origin || allowedOrigins[0]);
      return;
    }
    callback(new Error(`CORS blocked origin: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
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
app.use("/api/auth", authRoutes);
app.use("/api/me", libraryRoutes);

// In-memory connected users per room (not stored in MySQL)
const roomUsers = new Map();
/** roomCode → timestamp when the room last hit 0 connected users */
const roomEmptySince = new Map();

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

async function advanceQueue(roomId, roomCode) {
  const playing = await store.getPlayingItem(roomId);

  // Remove finished song so YouTube API metadata is not kept after playback.
  if (playing) {
    await store.deleteQueueItem(playing.id, roomId);
  }

  const next = await store.getNextWaitingItem(roomId);

  if (next) {
    await store.updateQueueStatus(next.id, "playing", roomId);
    emitPlayerChanged(roomCode, next);
    // One row per request, the first time this queue item actually starts.
    // This is the singer's party turn, not a YouTube watch-time event.
    try {
      await accounts.markRequestStarted(next.id);
    } catch (error) {
      console.error("Could not mark song request started:", error.message);
    }
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

    try {
      const user = await getSessionUser(req);
      if (user) {
        await accounts.recordPartyVisit({
          userId: user.id,
          roomCode,
          role: "host",
          partyName,
        });
      }
    } catch (error) {
      console.error("Could not record hosted party:", error.message);
    }

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

    let requester = null;
    try {
      requester = await getSessionUser(req);
    } catch (error) {
      console.error("Could not read account session:", error.message);
    }

    const created = await store.insertQueueItem({
      roomId: room.id,
      videoId,
      songTitle,
      artist,
      thumbnail,
      singerName,
      status,
      userId: requester?.id || null,
    });

    if (requester) {
      try {
        await accounts.recordSongRequest({
          userId: requester.id,
          queueItemId: created.id,
          videoId,
          title: songTitle,
          artist,
          thumbnail,
          roomCode: room.room_code,
        });
        if (status === "playing") {
          await accounts.markRequestStarted(created.id);
        }
      } catch (error) {
        console.error("Could not record song request:", error.message);
      }
    }

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

    await advanceQueue(room.id, room.room_code);
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

    await advanceQueue(room.id, room.room_code);
    io.to(room.room_code).emit("player:skipped", { roomCode: room.room_code });
    res.json({ success: true });
  } catch (error) {
    console.error("Skip song error:", error);
    res.status(500).json({ error: "Failed to skip song" });
  }
});

// --- Lightweight usage stats ---

app.post("/api/page-views", async (req, res) => {
  try {
    const path = String(req.body?.path || "").trim();
    // Only count the homepage for now (keeps this simple / hard to spam other paths)
    if (path !== "/") {
      return res.status(400).json({ error: "Unsupported path" });
    }

    await store.recordHomepageView();
    res.json({ success: true });
  } catch (error) {
    console.error("Page view error:", error);
    res.status(500).json({ error: "Failed to record page view" });
  }
});

app.get("/api/admin/stats", async (req, res) => {
  try {
    const secret = process.env.ADMIN_SECRET;
    if (!secret) {
      return res.status(503).json({ error: "Admin stats are not configured" });
    }

    const provided = String(req.headers["x-admin-secret"] || "").trim();
    if (!provided || provided !== secret) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const stats = await store.getUsageStats();
    res.json({
      ...stats,
      liveConnectedRooms: roomUsers.size,
      liveConnectedUsers: [...roomUsers.values()].reduce(
        (sum, users) => sum + users.size,
        0
      ),
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ error: "Failed to load stats" });
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
    roomEmptySince.delete(code);
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
      if (!roomEmptySince.has(code)) {
        roomEmptySince.set(code, Date.now());
      }
    }

    const guestCount = roomUsers.has(code) ? roomUsers.get(code).size : 0;

    io.to(code).emit("room:user-left", { name, guestCount });
  });
});

const PORT = process.env.PORT || 4000;
const YOUTUBE_QUEUE_MAX_DAYS = 30;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ROOM_IDLE_CLOSE_MS =
  Number(process.env.ROOM_IDLE_HOURS || 2) * 60 * 60 * 1000;
const ROOM_IDLE_CHECK_MS = 15 * 60 * 1000; // check every 15 minutes

async function purgeOldYouTubeQueueData() {
  try {
    const removed = await store.deleteQueueOlderThanDays(YOUTUBE_QUEUE_MAX_DAYS);
    if (removed > 0) {
      console.log(
        `Purged ${removed} YouTube queue row(s) (finished or older than ${YOUTUBE_QUEUE_MAX_DAYS} days)`
      );
    }
  } catch (error) {
    console.error("YouTube queue retention cleanup failed:", error);
  }

  try {
    const cleared = await accounts.expireYouTubeMetadata(YOUTUBE_QUEUE_MAX_DAYS);
    if (cleared > 0) {
      console.log(
        `Cleared cached YouTube titles on ${cleared} saved song row(s) older than ${YOUTUBE_QUEUE_MAX_DAYS} days`
      );
    }
  } catch (error) {
    console.error("YouTube metadata retention cleanup failed:", error.message);
  }
}

/** Mark DB rooms with nobody connected so leftover parties can idle-close. */
async function watchEmptyRooms() {
  const codes = await store.listRoomCodes();
  const now = Date.now();

  for (const code of codes) {
    if (roomUsers.has(code)) continue;
    if (!roomEmptySince.has(code)) {
      roomEmptySince.set(code, now);
    }
  }
}

/** Delete rooms that stayed at 0 connected users long enough (queue goes with room). */
async function closeAbandonedRooms() {
  try {
    await watchEmptyRooms();

    const now = Date.now();
    let closed = 0;

    for (const [code, emptySince] of [...roomEmptySince.entries()]) {
      if (roomUsers.has(code)) {
        roomEmptySince.delete(code);
        continue;
      }

      if (now - emptySince < ROOM_IDLE_CLOSE_MS) continue;

      const deleted = await store.deleteRoomByCode(code);
      roomEmptySince.delete(code);
      roomUsers.delete(code);

      if (deleted) closed += 1;
    }

    if (closed > 0) {
      console.log(
        `Closed ${closed} abandoned room(s) (0 users for ${process.env.ROOM_IDLE_HOURS || 2}h)`
      );
    }
  } catch (error) {
    console.error("Abandoned room cleanup failed:", error);
  }
}

async function start() {
  if (store.isDatabaseEnabled()) {
    try {
      await accounts.ensureSchema();
    } catch (error) {
      console.error("Account schema setup failed:", error.message);
    }
  }

  server.listen(PORT, () => {
    const storage = store.isDatabaseEnabled() ? "MySQL" : "in-memory";
    console.log(`Server running on http://localhost:${PORT} (${storage})`);
    console.log(`CORS allowed origins: ${allowedOrigins.join(", ")}`);
    console.log(
      `Abandoned rooms close after ${process.env.ROOM_IDLE_HOURS || 2}h with 0 users`
    );
    void purgeOldYouTubeQueueData();
    void closeAbandonedRooms();
    setInterval(() => {
      void purgeOldYouTubeQueueData();
    }, ONE_DAY_MS);
    setInterval(() => {
      void closeAbandonedRooms();
    }, ROOM_IDLE_CHECK_MS);
  });
}

start();
