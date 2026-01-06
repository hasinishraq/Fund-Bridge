-- =========================
-- notification-service database (final, MySQL 8+ clean)
-- =========================
CREATE DATABASE IF NOT EXISTS notification_db
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE notification_db;

-- 1) User notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id BIGINT UNSIGNED NOT NULL,

  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sms_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
  inapp_enabled BOOLEAN NOT NULL DEFAULT TRUE,

  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (user_id)
);

-- 2) Templates (versioned per channel)
CREATE TABLE IF NOT EXISTS notification_templates (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

  template_key VARCHAR(60) NOT NULL,   -- OTP_EMAIL, EMI_DUE, LOAN_APPROVED
  channel VARCHAR(10) NOT NULL,        -- EMAIL, SMS, INAPP

  subject VARCHAR(200) NULL,           -- EMAIL/INAPP only
  body TEXT NOT NULL,

  version INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_nt_key_channel_version (template_key, channel, version),
  KEY idx_nt_key_channel_active (template_key, channel, is_active)
);

-- 3) Outbox (reliable delivery pipeline)
CREATE TABLE IF NOT EXISTS notification_outbox (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

  user_id BIGINT UNSIGNED NOT NULL,
  channel VARCHAR(10) NOT NULL,        -- EMAIL, SMS, INAPP
  template_key VARCHAR(60) NOT NULL,

  payload_json JSON NOT NULL,          -- variables to render template
  idempotency_key VARCHAR(80) NULL,    -- prevents duplicates (optional)

  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  -- PENDING, SENDING, SENT, FAILED, CANCELLED

  attempts INT NOT NULL DEFAULT 0,
  last_error VARCHAR(255) NULL,

  scheduled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  locked_at TIMESTAMP NULL,
  sent_at TIMESTAMP NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_no_idempotency (idempotency_key),
  KEY idx_no_status_sched (status, scheduled_at),
  KEY idx_no_user (user_id),
  KEY idx_no_lock (status, locked_at)
);

-- 4) In-app inbox (supports mark-as-read)
CREATE TABLE IF NOT EXISTS inapp_notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

  user_id BIGINT UNSIGNED NOT NULL,
  template_key VARCHAR(60) NULL,

  title VARCHAR(200) NULL,
  body TEXT NOT NULL,
  data_json JSON NULL,                 -- deep link, loan_id, etc.

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  read_at TIMESTAMP NULL,              -- NULL = unread
  deleted_at TIMESTAMP NULL,           -- optional soft delete

  PRIMARY KEY (id),
  KEY idx_inapp_user_created (user_id, created_at),
  KEY idx_inapp_user_read (user_id, read_at),
  KEY idx_inapp_user_deleted (user_id, deleted_at)
);

-- Optional (MySQL 8.0.16+): add CHECK constraints for safety
-- If your MySQL ignores CHECK (older versions), you can skip this.
ALTER TABLE notification_templates
  ADD CONSTRAINT chk_nt_channel
  CHECK (channel IN ('EMAIL','SMS','INAPP'));

ALTER TABLE notification_outbox
  ADD CONSTRAINT chk_no_channel
  CHECK (channel IN ('EMAIL','SMS','INAPP')),
  ADD CONSTRAINT chk_no_status
  CHECK (status IN ('PENDING','SENDING','SENT','FAILED','CANCELLED'));
