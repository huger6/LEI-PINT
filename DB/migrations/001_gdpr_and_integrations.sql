-- ============================================================================
-- Migration: GDPR Consent History & Integration Webhooks
-- Date: 2026-05-26
-- ============================================================================

-- Table: gdpr_consent_history
CREATE TABLE IF NOT EXISTS gdpr_consent_history (
    consent_id          SERIAL PRIMARY KEY,
    user_id             INTEGER NOT NULL REFERENCES consultants(user_id),
    policy_id           INTEGER NOT NULL REFERENCES gdpr_policies(policy_id),
    action              VARCHAR(20) NOT NULL CHECK (action IN ('ACCEPTED', 'REVOKED')),
    ip_address          VARCHAR(45),
    user_agent          TEXT,
    consented_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gdpr_consent_user ON gdpr_consent_history(user_id);
CREATE INDEX idx_gdpr_consent_policy ON gdpr_consent_history(policy_id);
CREATE INDEX idx_gdpr_consent_date ON gdpr_consent_history(consented_at DESC);

-- Table: integration_webhooks
CREATE TABLE IF NOT EXISTS integration_webhooks (
    webhook_id          SERIAL PRIMARY KEY,
    platform            VARCHAR(20) NOT NULL CHECK (platform IN ('teams', 'slack')),
    webhook_url         TEXT NOT NULL,
    channel_name        VARCHAR(100),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_by          INTEGER REFERENCES administrators(user_id),
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhooks_active ON integration_webhooks(is_active) WHERE is_active = TRUE;
