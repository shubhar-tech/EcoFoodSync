-- Run AFTER PES2UG24CS660_EcoFoodSync.sql
-- Adds the users table used by the Next.js app for login + role-based access.
USE ecofoodsync_db;

CREATE TABLE IF NOT EXISTS app_user (
  user_id       CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  username      VARCHAR(50)  NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,          -- bcrypt hash, never plain text
  role          ENUM('ADMIN','DONOR','CHARITY','VOLUNTEER') NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_app_user_username UNIQUE (username),
  CONSTRAINT uk_app_user_email    UNIQUE (email),
  CONSTRAINT chk_username_len     CHECK (CHAR_LENGTH(username) >= 3)
) ENGINE=InnoDB;
