-- ==============================================================
-- SOFT DELETE CASCADE TRIGGERS
-- Digital Badge Platform — PostgreSQL 18
-- ==============================================================
-- Adds is_active to progression_stages and implements a
-- cascading soft-delete that propagates is_active = FALSE
-- top-down through the full hierarchy:
--
--   learning_paths
--       └── service_lines
--               └── areas
--                       └── progression_stages
--                                   └── badges
--                                           └── badge_requirements
--
-- Historical tables (awarded_badges, badge_applications,
-- points_history, certificates, requirements_evidences) are
-- intentionally untouched — earned records are preserved.
-- ==============================================================


-- --------------------------------------------------------------
-- SCHEMA CHANGE: add is_active to progression_stages
-- --------------------------------------------------------------
ALTER TABLE progression_stages
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Supporting index (mirrors the pattern used on other tables)
CREATE INDEX IF NOT EXISTS idx_stages_is_active
    ON progression_stages (area_id, is_active);


-- ==============================================================
-- TRIGGER FUNCTIONS
-- ==============================================================

-- --------------------------------------------------------------
-- LEVEL 1 — learning_paths → service_lines
-- --------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_fn_cascade_lp_deactivate()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE service_lines
    SET    is_active  = FALSE,
           updated_at = now()
    WHERE  learning_path_id = NEW.learning_path_id
      AND  is_active = TRUE;   -- skip rows already inactive → no re-fire

    RETURN NEW;
END;
$$;

-- --------------------------------------------------------------
-- LEVEL 2 — service_lines → areas
-- --------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_fn_cascade_sl_deactivate()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE areas
    SET    is_active  = FALSE,
           updated_at = now()
    WHERE  service_line_id = NEW.service_line_id
      AND  is_active = TRUE;

    RETURN NEW;
END;
$$;

-- --------------------------------------------------------------
-- LEVEL 3 — areas → progression_stages
-- --------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_fn_cascade_area_deactivate()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE progression_stages
    SET    is_active  = FALSE,
           updated_at = now()
    WHERE  area_id    = NEW.area_id
      AND  is_active  = TRUE;

    RETURN NEW;
END;
$$;

-- --------------------------------------------------------------
-- LEVEL 4 — progression_stages → badges
-- --------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_fn_cascade_stage_deactivate()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE badges
    SET    is_active  = FALSE,
           updated_at = now()
    WHERE  progression_stage_id = NEW.progression_stage_id
      AND  is_active = TRUE;

    RETURN NEW;
END;
$$;

-- --------------------------------------------------------------
-- LEVEL 5 — badges → badge_requirements
-- --------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_fn_cascade_badge_deactivate()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE badge_requirements
    SET    is_active  = FALSE,
           updated_at = now()
    WHERE  badge_id   = NEW.badge_id
      AND  is_active  = TRUE;

    RETURN NEW;
END;
$$;


-- ==============================================================
-- TRIGGERS
-- WHEN clause guards: only fire on TRUE → FALSE transitions.
-- Combined with AND is_active = TRUE in each UPDATE, this
-- guarantees no row is processed twice and loops cannot occur.
-- ==============================================================

CREATE OR REPLACE TRIGGER trg_cascade_lp_deactivate
AFTER UPDATE OF is_active ON learning_paths
FOR EACH ROW
WHEN (OLD.is_active = TRUE AND NEW.is_active = FALSE)
EXECUTE FUNCTION trg_fn_cascade_lp_deactivate();

CREATE OR REPLACE TRIGGER trg_cascade_sl_deactivate
AFTER UPDATE OF is_active ON service_lines
FOR EACH ROW
WHEN (OLD.is_active = TRUE AND NEW.is_active = FALSE)
EXECUTE FUNCTION trg_fn_cascade_sl_deactivate();

CREATE OR REPLACE TRIGGER trg_cascade_area_deactivate
AFTER UPDATE OF is_active ON areas
FOR EACH ROW
WHEN (OLD.is_active = TRUE AND NEW.is_active = FALSE)
EXECUTE FUNCTION trg_fn_cascade_area_deactivate();

CREATE OR REPLACE TRIGGER trg_cascade_stage_deactivate
AFTER UPDATE OF is_active ON progression_stages
FOR EACH ROW
WHEN (OLD.is_active = TRUE AND NEW.is_active = FALSE)
EXECUTE FUNCTION trg_fn_cascade_stage_deactivate();

CREATE OR REPLACE TRIGGER trg_cascade_badge_deactivate
AFTER UPDATE OF is_active ON badges
FOR EACH ROW
WHEN (OLD.is_active = TRUE AND NEW.is_active = FALSE)
EXECUTE FUNCTION trg_fn_cascade_badge_deactivate();


-- ==============================================================
-- FULL NAME CAPITALIZATION ENFORCEMENT
-- ==============================================================

CREATE OR REPLACE FUNCTION trg_fn_capitalize_user_full_name()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.full_name := fn_capitalize_full_name(NEW.full_name);
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_capitalize_user_full_name
BEFORE INSERT OR UPDATE OF full_name ON users
FOR EACH ROW
EXECUTE FUNCTION trg_fn_capitalize_user_full_name();


-- ==============================================================
-- APPLICATION STATE CHANGE AUDIT LOG
-- ==============================================================
-- Safety-net trigger: automatically logs every application state
-- transition into application_validation_logs. Avoids duplicating
-- rows the API already wrote by checking for a matching log
-- within the last 5 seconds.
-- ==============================================================

CREATE OR REPLACE FUNCTION trg_fn_log_application_state_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_already_logged BOOLEAN;
    v_action VARCHAR(50);
BEGIN
    v_action := OLD.application_state || ' -> ' || NEW.application_state;

    SELECT EXISTS (
        SELECT 1
        FROM application_validation_logs
        WHERE application_id   = NEW.application_id
          AND validator_action = v_action
          AND validated_at     >= NOW() - INTERVAL '5 seconds'
    ) INTO v_already_logged;

    IF NOT v_already_logged THEN
        INSERT INTO application_validation_logs (
            application_id,
            user_id,
            validator_function,
            validator_action,
            validations_comments,
            validated_at
        )
        VALUES (
            NEW.application_id,
            NULL,
            'trg_log_application_state_change',
            v_action,
            'Auto-logged by database trigger',
            NOW()
        );
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_log_application_state_change
AFTER UPDATE OF application_state ON badge_applications
FOR EACH ROW
WHEN (OLD.application_state IS DISTINCT FROM NEW.application_state)
EXECUTE FUNCTION trg_fn_log_application_state_change();


-- ==============================================================
-- BADGE EXPIRATION AUTO-CALCULATION
-- ==============================================================
-- On INSERT into awarded_badges, automatically computes
-- expiration_at from the badge's expiration_duration_days when
-- the caller did not set it. The API delegates this computation
-- to the trigger by omitting expiration_at from the INSERT.
-- ==============================================================

CREATE OR REPLACE FUNCTION trg_fn_set_badge_expiration()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_duration_days INTEGER;
BEGIN
    IF NEW.expiration_at IS NULL THEN
        SELECT b.expiration_duration_days
        INTO v_duration_days
        FROM badges b
        JOIN badge_applications ba ON ba.badge_id = b.badge_id
        WHERE ba.application_id = NEW.application_id;

        IF v_duration_days IS NOT NULL AND v_duration_days > 0 THEN
            NEW.expiration_at := NEW.awarded_at + (v_duration_days || ' days')::INTERVAL;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_set_badge_expiration
BEFORE INSERT ON awarded_badges
FOR EACH ROW
EXECUTE FUNCTION trg_fn_set_badge_expiration();
