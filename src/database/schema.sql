-- Dynamic QR Code Management System
-- MySQL 8+ schema

CREATE DATABASE IF NOT EXISTS dynamic_qr
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE dynamic_qr;

CREATE TABLE IF NOT EXISTS admins (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admins_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS qr_codes (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(64) NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT NULL,
  redirect_url VARCHAR(2048) NOT NULL,
  payload_type ENUM('WEB', 'TRUST_WALLET', 'CRYPTO_PAY') NOT NULL DEFAULT 'WEB',
  tw_coin_id VARCHAR(16) NULL,
  dest_base_url VARCHAR(1024) NULL,
  dest_path VARCHAR(1024) NOT NULL DEFAULT '',
  pay_network VARCHAR(32) NULL,
  pay_address VARCHAR(256) NULL,
  pay_amount VARCHAR(64) NULL,
  status ENUM('ACTIVE', 'DISABLED') NOT NULL DEFAULT 'ACTIVE',
  scan_count INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_scanned_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_qr_codes_code (code),
  KEY idx_qr_status (status),
  KEY idx_qr_scan_count (scan_count),
  KEY idx_qr_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS scan_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  qr_code_id INT UNSIGNED NOT NULL,
  ip_address VARCHAR(45) NULL,
  country VARCHAR(100) NULL,
  city VARCHAR(120) NULL,
  device VARCHAR(80) NULL,
  browser VARCHAR(80) NULL,
  platform VARCHAR(80) NULL,
  user_agent VARCHAR(512) NULL,
  referer VARCHAR(512) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_scan_qr (qr_code_id),
  KEY idx_scan_created (created_at),
  CONSTRAINT fk_scan_logs_qr
    FOREIGN KEY (qr_code_id) REFERENCES qr_codes (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settings (
  id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  site_name VARCHAR(180) NOT NULL DEFAULT 'Dynamic QR',
  website_url VARCHAR(512) NOT NULL DEFAULT 'http://localhost:3000',
  logo_path VARCHAR(512) NULL,
  timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO settings (id, site_name, website_url, timezone)
VALUES (1, 'Dynamic QR', 'http://localhost:3000', 'UTC')
ON DUPLICATE KEY UPDATE id = id;
