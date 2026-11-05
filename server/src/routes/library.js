const express = require("express");
const bcrypt = require("bcryptjs");
const accounts = require("../accounts");
const store = require("../store");
const {
  validateDisplayName,
  validatePassword,
  cleanVideoId,
  cleanHttpsUrl,
  clip,
} = require("../authRules");
const { requireUser, rejectBadOrigin, endSession } = require("../httpAuth");

const router = express.Router();

function sendError(res, error, fallback) {
  const status = error.status || 500;
  if (status >= 500) console.error(fallback, error.message);
  res.status(status).json({
    error: status >= 500 ? fallback : error.message,
  });
}

function readSong(body) {
  const videoId = cleanVideoId(body.videoId);
  if (!videoId) return { error: "A valid YouTube video id is required." };
  return {
    song: {
      videoId,
      title: body.title || body.songTitle || "",
      artist: body.artist || body.channelTitle || "",
      thumbnail: body.thumbnail || "",
    },
  };
}

router.use(async (req, res, next) => {
  try {
    if (rejectBadOrigin(req, res)) return;
    const user = await requireUser(req, res);
    if (!user) return;
    if (!user.email_verified) {
      res.status(403).json({
        error: "Confirm your email before using your TaraSing library.",
      });
      return;
    }
    req.account = user;
    next();
  } catch (error) {
    console.error("Account route error:", error.message);
    res.status(500).json({ error: "Could not check your account" });
  }
});

router.get("/", (req, res) => {
  res.json({ user: accounts.publicUser(req.account) });
});

router.patch("/", async (req, res) => {
  try {
    const fields = {};

    if (req.body.displayName !== undefined) {
      const name = validateDisplayName(req.body.displayName);
      if (name.error) return res.status(400).json({ error: name.error });
      fields.displayName = name.displayName;
    }

    if (req.body.avatarUrl !== undefined) {
      const avatar = cleanHttpsUrl(req.body.avatarUrl);
      if (avatar === undefined) {
        return res
          .status(400)
          .json({ error: "Profile picture must be an https link, or left blank." });
      }
      fields.avatarUrl = avatar;
    }

    const user = await accounts.updateUser(req.account.id, fields);
    res.json({ user: accounts.publicUser(user) });
  } catch (error) {
    sendError(res, error, "Could not update profile");
  }
});

router.post("/password", async (req, res) => {
  try {
    const nextPassword = validatePassword(req.body.password);
    if (nextPassword.error) {
      return res.status(400).json({ error: nextPassword.error });
    }
    if (req.body.password !== req.body.confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match." });
    }

    if (req.account.password_hash) {
      const current = String(req.body.currentPassword || "");
      const matches = await bcrypt.compare(current, req.account.password_hash);
      if (!matches) {
        return res.status(400).json({ error: "Current password is incorrect." });
      }
    }

    const passwordHash = await bcrypt.hash(nextPassword.password, 12);
    const user = await accounts.updateUser(req.account.id, { passwordHash });
    res.json({ user: accounts.publicUser(user) });
  } catch (error) {
    sendError(res, error, "Could not change password");
  }
});

router.post("/delete", async (req, res) => {
  try {
    if (req.account.password_hash) {
      const matches = await bcrypt.compare(
        String(req.body.password || ""),
        req.account.password_hash
      );
      if (!matches) {
        return res.status(400).json({ error: "Password is incorrect." });
      }
    } else if (String(req.body.confirm || "") !== "DELETE") {
      return res
        .status(400)
        .json({ error: 'Type DELETE to confirm account deletion.' });
    }

    await accounts.deleteUser(req.account.id);
    await endSession(req, res);
    res.json({ success: true });
  } catch (error) {
    sendError(res, error, "Could not delete account");
  }
});

router.post("/parties", async (req, res) => {
  try {
    const roomCode = String(req.body.roomCode || "").trim().toUpperCase();
    const role = req.body.role === "host" ? "host" : req.body.role === "guest" ? "guest" : "";
    if (!/^[A-Z0-9]{4,10}$/.test(roomCode) || !role) {
      return res.status(400).json({ error: "A valid party and role are required." });
    }

    const room = await store.getRoomByCode(roomCode);
    if (!room) return res.status(404).json({ error: "Party not found" });

    await accounts.recordPartyVisit({
      userId: req.account.id,
      roomCode,
      role,
      partyName: room.party_name,
    });
    res.json({ success: true });
  } catch (error) {
    sendError(res, error, "Could not save party visit");
  }
});

router.get("/favorites", async (req, res) => {
  try {
    const songs = await accounts.listFavorites(req.account.id);
    res.json({ songs });
  } catch (error) {
    sendError(res, error, "Could not load favorites");
  }
});

router.post("/favorites", async (req, res) => {
  try {
    const parsed = readSong(req.body);
    if (parsed.error) return res.status(400).json({ error: parsed.error });
    await accounts.addFavorite(req.account.id, parsed.song);
    res.status(201).json({ success: true });
  } catch (error) {
    sendError(res, error, "Could not save favorite");
  }
});

router.delete("/favorites/:videoId", async (req, res) => {
  try {
    const videoId = cleanVideoId(req.params.videoId);
    if (!videoId) return res.status(400).json({ error: "Invalid video id" });
    await accounts.removeFavorite(req.account.id, videoId);
    res.json({ success: true });
  } catch (error) {
    sendError(res, error, "Could not remove favorite");
  }
});

router.get("/playlists", async (req, res) => {
  try {
    const playlists = await accounts.listPlaylists(req.account.id);
    res.json({ playlists });
  } catch (error) {
    sendError(res, error, "Could not load playlists");
  }
});

router.post("/playlists", async (req, res) => {
  try {
    const name = clip(req.body.name, 120);
    if (!name) return res.status(400).json({ error: "Playlist name is required." });
    const description = clip(req.body.description, 500);
    const playlist = await accounts.createPlaylist(
      req.account.id,
      name,
      description
    );
    res.status(201).json({ playlist });
  } catch (error) {
    sendError(res, error, "Could not create playlist");
  }
});

router.get("/playlists/:id", async (req, res) => {
  try {
    const playlist = await accounts.getPlaylist(
      req.account.id,
      Number(req.params.id)
    );
    if (!playlist) return res.status(404).json({ error: "Playlist not found" });
    res.json({ playlist });
  } catch (error) {
    sendError(res, error, "Could not load playlist");
  }
});

router.patch("/playlists/:id", async (req, res) => {
  try {
    const name = clip(req.body.name, 120);
    if (!name) return res.status(400).json({ error: "Playlist name is required." });
    const description = clip(req.body.description, 500);
    const playlist = await accounts.updatePlaylist(
      req.account.id,
      Number(req.params.id),
      name,
      description
    );
    if (!playlist) return res.status(404).json({ error: "Playlist not found" });
    res.json({ playlist });
  } catch (error) {
    sendError(res, error, "Could not update playlist");
  }
});

router.delete("/playlists/:id", async (req, res) => {
  try {
    const removed = await accounts.deletePlaylist(
      req.account.id,
      Number(req.params.id)
    );
    if (!removed) return res.status(404).json({ error: "Playlist not found" });
    res.json({ success: true });
  } catch (error) {
    sendError(res, error, "Could not delete playlist");
  }
});

router.post("/playlists/:id/songs", async (req, res) => {
  try {
    const parsed = readSong(req.body);
    if (parsed.error) return res.status(400).json({ error: parsed.error });
    const playlist = await accounts.addPlaylistSong(
      req.account.id,
      Number(req.params.id),
      parsed.song
    );
    if (!playlist) return res.status(404).json({ error: "Playlist not found" });
    res.status(201).json({ playlist });
  } catch (error) {
    sendError(res, error, "Could not add song");
  }
});

router.delete("/playlists/:id/songs/:videoId", async (req, res) => {
  try {
    const videoId = cleanVideoId(req.params.videoId);
    if (!videoId) return res.status(400).json({ error: "Invalid video id" });
    const removed = await accounts.removePlaylistSong(
      req.account.id,
      Number(req.params.id),
      videoId
    );
    if (!removed) return res.status(404).json({ error: "Song not found" });
    res.json({ success: true });
  } catch (error) {
    sendError(res, error, "Could not remove song");
  }
});

router.get("/requests", async (req, res) => {
  try {
    const songs = await accounts.listRequests(req.account.id, {
      playedOnly: req.query.played === "1",
    });
    res.json({ songs });
  } catch (error) {
    sendError(res, error, "Could not load history");
  }
});

router.delete("/requests", async (req, res) => {
  try {
    await accounts.clearRequests(req.account.id);
    res.json({ success: true });
  } catch (error) {
    sendError(res, error, "Could not clear history");
  }
});

router.get("/activity", async (req, res) => {
  try {
    const activity = await accounts.getActivity(req.account.id);
    res.json(activity);
  } catch (error) {
    sendError(res, error, "Could not load activity");
  }
});

module.exports = router;
