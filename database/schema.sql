-- ============================================================
-- Zayid Food System — Database Schema
-- Step 1: Run this SQL in phpMyAdmin to create tables.
-- Step 2: Visit /zayid_food/seed.php to insert users + menu.
-- ============================================================

CREATE DATABASE IF NOT EXISTS zayid_food
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE zayid_food;

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100)        NOT NULL,
    username   VARCHAR(50)         NOT NULL UNIQUE,
    password   VARCHAR(255)        NOT NULL,
    role       ENUM('admin','user') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Menu Items ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS menu_items (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(150)   NOT NULL,
    price      DECIMAL(10,2)  NOT NULL,
    category   VARCHAR(80)    NOT NULL DEFAULT '',
    image_url  VARCHAR(500)            DEFAULT NULL,
    created_at TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Orders ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT            NOT NULL,
    items      JSON           NOT NULL,
    total      DECIMAL(10,2)  NOT NULL,
    status     ENUM('pending','confirmed','preparing','ready','delivered','cancelled')
               NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- After running this, visit: http://localhost/zayid_food/seed.php
-- seed.php uses PHP's password_hash() to generate correct bcrypt hashes.
