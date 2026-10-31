-- =============================================================================
-- NEUROSIM DATABASE SCHEMA (MySQL 8.0+)
-- Database: neurosim_db
-- User: neuro_user
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `neurosim_db` 
  DEFAULT CHARACTER SET utf8mb4 
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `neurosim_db`;

-- -----------------------------------------------------------------------------
-- 1. Table: users
-- Stores registered employee accounts with secure password hash & accessibility preferences
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(64) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(128) NOT NULL,
  `role` VARCHAR(100) DEFAULT 'Staff Pengembang',
  `department` VARCHAR(100) DEFAULT 'Divisi Antarmuka & Frontend',
  `avatar` VARCHAR(255) DEFAULT '/assets/characters/resident/standing/south.png',
  `reduce_motion` TINYINT(1) DEFAULT 0,
  `high_contrast` TINYINT(1) DEFAULT 0,
  `text_scale` VARCHAR(20) DEFAULT 'normal',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. Table: user_characters
-- Stores customized LPC-compatible avatar settings per user
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_characters` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `archetype` VARCHAR(50) DEFAULT 'resident',
  `gender` VARCHAR(20) DEFAULT 'male',
  `body_type` VARCHAR(30) DEFAULT 'standard',
  `skin_tone` VARCHAR(30) DEFAULT 'peach',
  `hair_style` VARCHAR(50) DEFAULT 'short-parted',
  `hair_color` VARCHAR(30) DEFAULT 'black',
  `eye_color` VARCHAR(30) DEFAULT 'dark-brown',
  `facial_hair` VARCHAR(50) DEFAULT 'none',
  `glasses` VARCHAR(50) DEFAULT 'none',
  `shirt_type` VARCHAR(50) DEFAULT 'collared-formal',
  `shirt_color` VARCHAR(30) DEFAULT 'white',
  `suit_type` VARCHAR(50) DEFAULT 'none',
  `suit_color` VARCHAR(30) DEFAULT 'navy-suit',
  `tie_type` VARCHAR(50) DEFAULT 'none',
  `tie_color` VARCHAR(30) DEFAULT 'crimson',
  `pants_type` VARCHAR(50) DEFAULT 'slacks-formal',
  `pants_color` VARCHAR(30) DEFAULT 'charcoal',
  `shoes_type` VARCHAR(50) DEFAULT 'oxford-leather',
  `shoes_color` VARCHAR(30) DEFAULT 'black-leather',
  `accessory` VARCHAR(50) DEFAULT 'id-badge',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_user_characters_user` FOREIGN KEY (`user_id`) 
    REFERENCES `users` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_user_character` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. Table: user_evaluations
-- Stores objective AI communication assessments after conversations
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_evaluations` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `scenario_id` VARCHAR(64) NOT NULL,
  `level` TINYINT UNSIGNED DEFAULT 2,
  `user_goal` TEXT,
  `kejelasan_tingkat` VARCHAR(50) DEFAULT 'Sesuai',
  `kejelasan_umpan_balik` TEXT,
  `konteks_tingkat` VARCHAR(50) DEFAULT 'Sesuai',
  `konteks_umpan_balik` TEXT,
  `tujuan_tingkat` VARCHAR(50) DEFAULT 'Sesuai',
  `tujuan_umpan_balik` TEXT,
  `batasan_tingkat` VARCHAR(50) DEFAULT 'Sesuai',
  `batasan_umpan_balik` TEXT,
  `rekomendasi_level` TINYINT UNSIGNED DEFAULT 2,
  `rekomendasi_alasan` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_user_evaluations_user` FOREIGN KEY (`user_id`) 
    REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_evaluations_user_scenario` (`user_id`, `scenario_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. Table: rooms
-- Virtual office room directory and lobby configuration
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `rooms` (
  `id` VARCHAR(64) PRIMARY KEY,
  `name` VARCHAR(128) NOT NULL,
  `description` TEXT,
  `zone` VARCHAR(64) NOT NULL,
  `spawn_x` INT DEFAULT 1810,
  `spawn_y` INT DEFAULT 790,
  `capacity` INT DEFAULT 20,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Seed Initial Rooms
-- -----------------------------------------------------------------------------
INSERT INTO `rooms` (`id`, `name`, `description`, `zone`, `spawn_x`, `spawn_y`, `capacity`) VALUES
('room-main', 'Kantor Utama & Open Workspace', 'Zona kerja utama dengan meja tim, area kolaborasi, dan koridor sentral.', 'Zona 5 · Workstation Utama', 1810, 790, 25),
('room-meeting', 'Ruang Rapat Strategis', 'Ruang meeting formal berkarpet kayu untuk negosiasi proyek bersama Pak Hendra.', 'Zona 2 · Meeting Room', 600, 480, 12),
('room-pantry', 'Pantry & Coffee Breakroom', 'Area santai dengan espresso bar, meja kafe, dan rekan kerja Dimas.', 'Zona 1 · Pantry & Dapur', 480, 950, 15),
('room-executive', 'Ruang Eksekutif & Manajemen', 'Ruangan kerja pimpinan Bu Rina untuk pembagian tugas dan feedback berkala.', 'Zona 4 · Ruangan Bos', 1400, 360, 8)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

