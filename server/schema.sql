CREATE DATABASE IF NOT EXISTS online_karaoke;
USE online_karaoke;

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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);
