-- Dynamic QR — PostgreSQL (Render)

CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS qr_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(64) NOT NULL UNIQUE,
  title VARCHAR(180) NOT NULL,
  description TEXT NULL,
  redirect_url VARCHAR(2048) NOT NULL,
  payload_type VARCHAR(32) NOT NULL DEFAULT 'WEB',
  tw_coin_id VARCHAR(16) NULL,
  dest_base_url VARCHAR(1024) NULL,
  dest_path VARCHAR(1024) NOT NULL DEFAULT '',
  pay_network VARCHAR(32) NULL,
  pay_address VARCHAR(256) NULL,
  pay_amount VARCHAR(64) NULL,
  pay_token VARCHAR(32) NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
  scan_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_scanned_at TIMESTAMPTZ NULL,
  CONSTRAINT qr_codes_payload_type_chk CHECK (payload_type IN ('WEB', 'TRUST_WALLET', 'CRYPTO_PAY')),
  CONSTRAINT qr_codes_status_chk CHECK (status IN ('ACTIVE', 'DISABLED'))
);

CREATE INDEX IF NOT EXISTS idx_qr_status ON qr_codes (status);
CREATE INDEX IF NOT EXISTS idx_qr_scan_count ON qr_codes (scan_count);
CREATE INDEX IF NOT EXISTS idx_qr_created_at ON qr_codes (created_at);

CREATE TABLE IF NOT EXISTS scan_logs (
  id BIGSERIAL PRIMARY KEY,
  qr_code_id INTEGER NOT NULL REFERENCES qr_codes (id) ON DELETE CASCADE,
  ip_address VARCHAR(45) NULL,
  country VARCHAR(100) NULL,
  city VARCHAR(120) NULL,
  device VARCHAR(80) NULL,
  browser VARCHAR(80) NULL,
  platform VARCHAR(80) NULL,
  user_agent VARCHAR(512) NULL,
  referer VARCHAR(512) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scan_qr ON scan_logs (qr_code_id);
CREATE INDEX IF NOT EXISTS idx_scan_created ON scan_logs (created_at);

CREATE TABLE IF NOT EXISTS settings (
  id SMALLINT PRIMARY KEY,
  site_name VARCHAR(180) NOT NULL DEFAULT 'Dynamic QR',
  website_url VARCHAR(512) NOT NULL DEFAULT 'http://localhost:3000',
  logo_path VARCHAR(512) NULL,
  timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO settings (id, site_name, website_url, timezone)
VALUES (1, 'Dynamic QR', 'http://localhost:3000', 'UTC')
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_admins_updated_at ON admins;
CREATE TRIGGER trg_admins_updated_at
  BEFORE UPDATE ON admins
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS trg_qr_codes_updated_at ON qr_codes;
CREATE TRIGGER trg_qr_codes_updated_at
  BEFORE UPDATE ON qr_codes
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS trg_settings_updated_at ON settings;
CREATE TRIGGER trg_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
