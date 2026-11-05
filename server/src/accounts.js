const { pool, isDatabaseEnabled } = require("./db");
const { clip } = require("./authRules");
const { refreshStoredMetadata, presentSong } = require("./youtubeCache");

let schemaReady = false;

async function ensureSchema() {
  if (!isDatabaseEnabled()) return;
  if (schemaReady) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      display_name VARCHAR(80) NOT NULL,
      email VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NULL,
      avatar_url VARCHAR(1000) NULL,
      email_verified TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_users_email (email)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_auth_providers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      provider VARCHAR(32) NOT NULL,
      provider_user_id VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_provider_subject (provider, provider_user_id),
      KEY idx_provider_user (user_id),
      CONSTRAINT fk_provider_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      token_hash CHAR(64) NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_session_token (token_hash),
      KEY idx_session_user (user_id),
      CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      purpose ENUM('verify_email', 'reset_password') NOT NULL,
      token_hash CHAR(64) NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_user_token (token_hash),
      KEY idx_user_token_user (user_id),
      CONSTRAINT fk_user_token_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pending_signups (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      display_name VARCHAR(80) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      token_hash CHAR(64) NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_pending_email (email),
      UNIQUE KEY uq_pending_token (token_hash)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_favorites (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      video_id VARCHAR(20) NOT NULL,
      title VARCHAR(255) NULL,
      artist VARCHAR(255) NULL,
      thumbnail VARCHAR(500) NULL,
      metadata_cached_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_user_favorite (user_id, video_id),
      KEY idx_favorite_user (user_id, created_at),
      CONSTRAINT fk_favorite_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_playlists (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      name VARCHAR(120) NOT NULL,
      description VARCHAR(500) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_playlist_user (user_id, updated_at),
      CONSTRAINT fk_playlist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_playlist_songs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      playlist_id INT NOT NULL,
      video_id VARCHAR(20) NOT NULL,
      title VARCHAR(255) NULL,
      artist VARCHAR(255) NULL,
      thumbnail VARCHAR(500) NULL,
      metadata_cached_at DATETIME NULL,
      position INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_playlist_video (playlist_id, video_id),
      KEY idx_playlist_song_order (playlist_id, position),
      CONSTRAINT fk_playlist_song FOREIGN KEY (playlist_id) REFERENCES user_playlists(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_song_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      queue_item_id INT NULL,
      video_id VARCHAR(20) NOT NULL,
      title VARCHAR(255) NULL,
      artist VARCHAR(255) NULL,
      thumbnail VARCHAR(500) NULL,
      metadata_cached_at DATETIME NULL,
      room_code VARCHAR(10) NULL,
      requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      started_at DATETIME NULL,
      KEY idx_request_user_time (user_id, requested_at),
      KEY idx_request_queue (queue_item_id),
      CONSTRAINT fk_request_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_party_visits (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      room_code VARCHAR(10) NOT NULL,
      role ENUM('host', 'guest') NOT NULL,
      party_name VARCHAR(255) NULL,
      visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_user_party_role (user_id, room_code, role),
      KEY idx_party_user_time (user_id, visited_at),
      CONSTRAINT fk_party_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  try {
    const [columns] = await pool.query(
      `SELECT 1 FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'queue' AND COLUMN_NAME = 'user_id'`
    );

    if (columns.length === 0) {
      await pool.query("ALTER TABLE queue ADD COLUMN user_id INT NULL");
      await pool.query("ALTER TABLE queue ADD KEY idx_queue_user (user_id)");
      await pool.query(
        `ALTER TABLE queue
         ADD CONSTRAINT fk_queue_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL`
      );
    }
  } catch (error) {
    console.error("Could not attach accounts to the queue table:", error.message);
  }

  schemaReady = true;
}

function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    displayName: row.display_name,
    email: row.email,
    avatarUrl: row.avatar_url,
    emailVerified: Boolean(row.email_verified),
    hasPassword: Boolean(row.password_hash),
    createdAt: row.created_at,
  };
}

async function findUserByEmail(email) {
  const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
    email,
  ]);
  return rows[0] || null;
}

async function findUserById(id) {
  const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
  return rows[0] || null;
}

async function createUser({ displayName, email, passwordHash, avatarUrl, emailVerified }) {
  const [result] = await pool.query(
    `INSERT INTO users (display_name, email, password_hash, avatar_url, email_verified)
     VALUES (?, ?, ?, ?, ?)`,
    [
      displayName,
      email,
      passwordHash || null,
      avatarUrl || null,
      emailVerified ? 1 : 0,
    ]
  );
  return findUserById(result.insertId);
}

async function updateUser(id, fields) {
  const sets = [];
  const values = [];

  if (fields.displayName !== undefined) {
    sets.push("display_name = ?");
    values.push(fields.displayName);
  }
  if (fields.avatarUrl !== undefined) {
    sets.push("avatar_url = ?");
    values.push(fields.avatarUrl);
  }
  if (fields.passwordHash !== undefined) {
    sets.push("password_hash = ?");
    values.push(fields.passwordHash);
  }
  if (fields.emailVerified !== undefined) {
    sets.push("email_verified = ?");
    values.push(fields.emailVerified ? 1 : 0);
  }

  if (sets.length === 0) return findUserById(id);

  values.push(id);
  await pool.query(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`, values);
  return findUserById(id);
}

async function deleteUser(id) {
  await pool.query("DELETE FROM users WHERE id = ?", [id]);
}

async function findUserByProvider(provider, providerUserId) {
  const [rows] = await pool.query(
    `SELECT users.* FROM users
     JOIN user_auth_providers providers ON providers.user_id = users.id
     WHERE providers.provider = ? AND providers.provider_user_id = ?`,
    [provider, providerUserId]
  );
  return rows[0] || null;
}

async function linkProvider(userId, provider, providerUserId) {
  await pool.query(
    `INSERT INTO user_auth_providers (user_id, provider, provider_user_id)
     VALUES (?, ?, ?)`,
    [userId, provider, providerUserId]
  );
}

async function createSession(userId, tokenHash, expiresAt) {
  await pool.query(
    "DELETE FROM user_sessions WHERE expires_at < NOW()"
  );
  await pool.query(
    "INSERT INTO user_sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
    [userId, tokenHash, expiresAt]
  );
}

async function findUserBySession(tokenHash) {
  const [rows] = await pool.query(
    `SELECT users.* FROM users
     JOIN user_sessions sessions ON sessions.user_id = users.id
     WHERE sessions.token_hash = ? AND sessions.expires_at > NOW()`,
    [tokenHash]
  );
  return rows[0] || null;
}

async function deleteSession(tokenHash) {
  await pool.query("DELETE FROM user_sessions WHERE token_hash = ?", [
    tokenHash,
  ]);
}

async function saveToken(userId, purpose, tokenHash, expiresAt) {
  await pool.query(
    "DELETE FROM user_tokens WHERE user_id = ? AND purpose = ?",
    [userId, purpose]
  );
  await pool.query(
    `INSERT INTO user_tokens (user_id, purpose, token_hash, expires_at)
     VALUES (?, ?, ?, ?)`,
    [userId, purpose, tokenHash, expiresAt]
  );
}

async function savePendingSignup({
  email,
  displayName,
  passwordHash,
  tokenHash,
  expiresAt,
}) {
  await pool.query("DELETE FROM pending_signups WHERE expires_at < NOW()");
  await pool.query(
    `INSERT INTO pending_signups
      (email, display_name, password_hash, token_hash, expires_at)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       display_name = VALUES(display_name),
       password_hash = VALUES(password_hash),
       token_hash = VALUES(token_hash),
       expires_at = VALUES(expires_at)`,
    [email, displayName, passwordHash, tokenHash, expiresAt]
  );
}

async function findPendingByEmail(email) {
  const [rows] = await pool.query(
    "SELECT * FROM pending_signups WHERE email = ? AND expires_at > NOW()",
    [email]
  );
  return rows[0] || null;
}

async function consumePendingSignup(tokenHash) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(
      `SELECT * FROM pending_signups
       WHERE token_hash = ? AND expires_at > NOW()
       FOR UPDATE`,
      [tokenHash]
    );
    const row = rows[0];
    if (!row) {
      await connection.rollback();
      return null;
    }
    await connection.query("DELETE FROM pending_signups WHERE id = ?", [row.id]);
    await connection.commit();
    return row;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function deletePendingSignup(email) {
  await pool.query("DELETE FROM pending_signups WHERE email = ?", [email]);
}

async function consumeToken(purpose, tokenHash) {
  const [rows] = await pool.query(
    `SELECT * FROM user_tokens
     WHERE purpose = ? AND token_hash = ? AND expires_at > NOW()`,
    [purpose, tokenHash]
  );
  const row = rows[0];
  if (!row) return null;
  await pool.query("DELETE FROM user_tokens WHERE id = ?", [row.id]);
  return row;
}

function songMeta(song) {
  return [
    clip(song.title, 255),
    clip(song.artist, 255),
    clip(song.thumbnail, 500),
  ];
}

async function addFavorite(userId, song) {
  const [title, artist, thumbnail] = songMeta(song);
  try {
    await pool.query(
      `INSERT INTO user_favorites
        (user_id, video_id, title, artist, thumbnail, metadata_cached_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [userId, song.videoId, title, artist, thumbnail]
    );
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      const duplicate = new Error("That song is already in your favorites");
      duplicate.status = 409;
      throw duplicate;
    }
    throw error;
  }
}

async function removeFavorite(userId, videoId) {
  const [result] = await pool.query(
    "DELETE FROM user_favorites WHERE user_id = ? AND video_id = ?",
    [userId, videoId]
  );
  return result.affectedRows > 0;
}

async function listFavorites(userId) {
  const [rows] = await pool.query(
    `SELECT id, video_id, title, artist, thumbnail, metadata_cached_at, created_at
     FROM user_favorites WHERE user_id = ? ORDER BY created_at DESC`,
    [userId]
  );
  await refreshStoredMetadata(rows, (row) => saveFavoriteMeta(userId, row));
  return rows.map(presentSong);
}

async function saveFavoriteMeta(userId, row) {
  await pool.query(
    `UPDATE user_favorites
     SET title = ?, artist = ?, thumbnail = ?, metadata_cached_at = ?
     WHERE id = ? AND user_id = ?`,
    [row.title, row.artist, row.thumbnail, row.metadata_cached_at, row.id, userId]
  );
}

async function listPlaylists(userId) {
  const [rows] = await pool.query(
    `SELECT id, name, description, created_at, updated_at,
            (SELECT COUNT(*) FROM user_playlist_songs songs
             WHERE songs.playlist_id = playlists.id) AS song_count
     FROM user_playlists playlists
     WHERE user_id = ?
     ORDER BY updated_at DESC`,
    [userId]
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    songCount: Number(row.song_count) || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

async function createPlaylist(userId, name, description) {
  const [result] = await pool.query(
    "INSERT INTO user_playlists (user_id, name, description) VALUES (?, ?, ?)",
    [userId, name, description]
  );
  return getPlaylist(userId, result.insertId);
}

async function updatePlaylist(userId, playlistId, name, description) {
  const [result] = await pool.query(
    `UPDATE user_playlists SET name = ?, description = ?
     WHERE id = ? AND user_id = ?`,
    [name, description, playlistId, userId]
  );
  if (result.affectedRows === 0) return null;
  return getPlaylist(userId, playlistId);
}

async function deletePlaylist(userId, playlistId) {
  const [result] = await pool.query(
    "DELETE FROM user_playlists WHERE id = ? AND user_id = ?",
    [playlistId, userId]
  );
  return result.affectedRows > 0;
}

async function getPlaylist(userId, playlistId) {
  const [rows] = await pool.query(
    `SELECT id, name, description, created_at, updated_at
     FROM user_playlists WHERE id = ? AND user_id = ?`,
    [playlistId, userId]
  );
  const playlist = rows[0];
  if (!playlist) return null;

  const [songs] = await pool.query(
    `SELECT id, video_id, title, artist, thumbnail, metadata_cached_at, position, created_at
     FROM user_playlist_songs WHERE playlist_id = ? ORDER BY position ASC, id ASC`,
    [playlistId]
  );
  await refreshStoredMetadata(songs, (row) => savePlaylistSongMeta(playlistId, row));

  return {
    id: playlist.id,
    name: playlist.name,
    description: playlist.description,
    createdAt: playlist.created_at,
    updatedAt: playlist.updated_at,
    songs: songs.map(presentSong),
  };
}

async function savePlaylistSongMeta(playlistId, row) {
  await pool.query(
    `UPDATE user_playlist_songs
     SET title = ?, artist = ?, thumbnail = ?, metadata_cached_at = ?
     WHERE id = ? AND playlist_id = ?`,
    [
      row.title,
      row.artist,
      row.thumbnail,
      row.metadata_cached_at,
      row.id,
      playlistId,
    ]
  );
}

async function addPlaylistSong(userId, playlistId, song) {
  const playlist = await getOwnedPlaylistId(userId, playlistId);
  if (!playlist) return null;

  const [positionRows] = await pool.query(
    "SELECT COALESCE(MAX(position), 0) AS max_position FROM user_playlist_songs WHERE playlist_id = ?",
    [playlistId]
  );
  const position = Number(positionRows[0].max_position) + 1;
  const [title, artist, thumbnail] = songMeta(song);

  try {
    await pool.query(
      `INSERT INTO user_playlist_songs
        (playlist_id, video_id, title, artist, thumbnail, metadata_cached_at, position)
       VALUES (?, ?, ?, ?, ?, NOW(), ?)`,
      [playlistId, song.videoId, title, artist, thumbnail, position]
    );
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      const duplicate = new Error("That song is already in this playlist");
      duplicate.status = 409;
      throw duplicate;
    }
    throw error;
  }

  return getPlaylist(userId, playlistId);
}

async function removePlaylistSong(userId, playlistId, videoId) {
  const playlist = await getOwnedPlaylistId(userId, playlistId);
  if (!playlist) return false;
  const [result] = await pool.query(
    "DELETE FROM user_playlist_songs WHERE playlist_id = ? AND video_id = ?",
    [playlistId, videoId]
  );
  return result.affectedRows > 0;
}

async function getOwnedPlaylistId(userId, playlistId) {
  const [rows] = await pool.query(
    "SELECT id FROM user_playlists WHERE id = ? AND user_id = ?",
    [playlistId, userId]
  );
  return rows[0] || null;
}

async function recordSongRequest({
  userId,
  queueItemId,
  videoId,
  title,
  artist,
  thumbnail,
  roomCode,
}) {
  if (!isDatabaseEnabled() || !schemaReady) return;
  await pool.query(
    `INSERT INTO user_song_requests
      (user_id, queue_item_id, video_id, title, artist, thumbnail, metadata_cached_at, room_code)
     VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)`,
    [
      userId,
      queueItemId || null,
      videoId,
      clip(title, 255),
      clip(artist, 255),
      clip(thumbnail, 500),
      roomCode || null,
    ]
  );
}

async function markRequestStarted(queueItemId) {
  if (!isDatabaseEnabled() || !schemaReady || !queueItemId) return;
  await pool.query(
    `UPDATE user_song_requests
     SET started_at = NOW()
     WHERE queue_item_id = ? AND started_at IS NULL`,
    [queueItemId]
  );
}

async function listRequests(userId, { playedOnly = false } = {}) {
  const startedFilter = playedOnly ? "AND started_at IS NOT NULL" : "";
  const order = playedOnly ? "started_at DESC" : "requested_at DESC";
  const [rows] = await pool.query(
    `SELECT id, video_id, title, artist, thumbnail, metadata_cached_at,
            room_code, requested_at, started_at
     FROM user_song_requests
     WHERE user_id = ? ${startedFilter}
     ORDER BY ${order}
     LIMIT 100`,
    [userId]
  );
  await refreshStoredMetadata(rows, (row) => saveRequestMeta(userId, row));
  return rows.map(presentSong);
}

async function saveRequestMeta(userId, row) {
  await pool.query(
    `UPDATE user_song_requests
     SET title = ?, artist = ?, thumbnail = ?, metadata_cached_at = ?
     WHERE id = ? AND user_id = ?`,
    [row.title, row.artist, row.thumbnail, row.metadata_cached_at, row.id, userId]
  );
}

async function clearRequests(userId) {
  await pool.query("DELETE FROM user_song_requests WHERE user_id = ?", [userId]);
}

async function recordPartyVisit({ userId, roomCode, role, partyName }) {
  if (!isDatabaseEnabled() || !schemaReady) return;
  await pool.query(
    `INSERT INTO user_party_visits (user_id, room_code, role, party_name)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE party_name = COALESCE(VALUES(party_name), party_name)`,
    [userId, roomCode, role, clip(partyName, 255)]
  );
}

async function getActivity(userId) {
  const [requestRows] = await pool.query(
    `SELECT COUNT(*) AS requested,
            COALESCE(SUM(started_at IS NOT NULL), 0) AS started
     FROM user_song_requests WHERE user_id = ?`,
    [userId]
  );
  const [partyRows] = await pool.query(
    `SELECT COALESCE(SUM(role = 'host'), 0) AS hosted,
            COALESCE(SUM(role = 'guest'), 0) AS joined
     FROM user_party_visits WHERE user_id = ?`,
    [userId]
  );

  const recentRequests = await listRequests(userId);
  const [parties] = await pool.query(
    `SELECT room_code, role, party_name, visited_at
     FROM user_party_visits WHERE user_id = ?
     ORDER BY visited_at DESC LIMIT 20`,
    [userId]
  );

  return {
    songsRequested: Number(requestRows[0].requested) || 0,
    turnsStarted: Number(requestRows[0].started) || 0,
    partiesHosted: Number(partyRows[0].hosted) || 0,
    partiesJoined: Number(partyRows[0].joined) || 0,
    recentRequests: recentRequests.slice(0, 8),
    recentParties: parties.map((row) => ({
      roomCode: row.room_code,
      role: row.role,
      partyName: row.party_name,
      visitedAt: row.visited_at,
    })),
  };
}

async function expireYouTubeMetadata(days) {
  if (!isDatabaseEnabled() || !schemaReady) return 0;
  const tables = ["user_favorites", "user_playlist_songs", "user_song_requests"];
  let total = 0;

  for (const table of tables) {
    const [result] = await pool.query(
      `UPDATE ${table}
       SET title = NULL, artist = NULL, thumbnail = NULL, metadata_cached_at = NULL
       WHERE metadata_cached_at IS NOT NULL
         AND metadata_cached_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [days]
    );
    total += result.affectedRows || 0;
  }

  return total;
}

module.exports = {
  ensureSchema,
  publicUser,
  findUserByEmail,
  findUserById,
  createUser,
  updateUser,
  deleteUser,
  findUserByProvider,
  linkProvider,
  createSession,
  findUserBySession,
  deleteSession,
  saveToken,
  consumeToken,
  savePendingSignup,
  findPendingByEmail,
  consumePendingSignup,
  deletePendingSignup,
  addFavorite,
  removeFavorite,
  listFavorites,
  listPlaylists,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  getPlaylist,
  addPlaylistSong,
  removePlaylistSong,
  recordSongRequest,
  markRequestStarted,
  listRequests,
  clearRequests,
  recordPartyVisit,
  getActivity,
  expireYouTubeMetadata,
};
