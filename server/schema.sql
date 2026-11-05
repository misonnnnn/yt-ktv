CREATE DATABASE IF NOT EXISTS online_karaoke;
USE online_karaoke;

-- Optional accounts. Karaoke still works with no rows here.
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  display_name VARCHAR(80) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NULL,
  avatar_url VARCHAR(1000) NULL,
  email_verified TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email)
);

CREATE TABLE IF NOT EXISTS user_auth_providers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  provider VARCHAR(32) NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_provider_subject (provider, provider_user_id),
  KEY idx_provider_user (user_id),
  CONSTRAINT fk_provider_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_session_token (token_hash),
  KEY idx_session_user (user_id),
  CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

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
);

-- Manual signups stay here until the person opens the email link.
-- A fake address never becomes a user.
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
);

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
);

CREATE TABLE IF NOT EXISTS user_playlists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_playlist_user (user_id, updated_at),
  CONSTRAINT fk_playlist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

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
);

-- Songs this account submitted to a party queue. started_at is set once,
-- when that queue item becomes the song on stage. Not YouTube watch analytics.
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
);

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
);

CREATE TABLE IF NOT EXISTS rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_code VARCHAR(10) NOT NULL UNIQUE,
  party_name VARCHAR(255) NOT NULL,
  host_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS queue (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_id INT NOT NULL,
  video_id VARCHAR(50) NOT NULL,
  song_title VARCHAR(255) NOT NULL,
  artist VARCHAR(255) NOT NULL,
  thumbnail VARCHAR(500),
  singer_name VARCHAR(255) NOT NULL,
  status ENUM('waiting', 'playing', 'completed', 'skipped') DEFAULT 'waiting',
  user_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_queue_user (user_id),
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  CONSTRAINT fk_queue_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Aggregate usage counters (kept even after rooms/queue are cleaned up)
CREATE TABLE IF NOT EXISTS daily_stats (
  day DATE NOT NULL PRIMARY KEY,
  rooms_created INT NOT NULL DEFAULT 0,
  songs_queued INT NOT NULL DEFAULT 0,
  homepage_views INT NOT NULL DEFAULT 0
);
