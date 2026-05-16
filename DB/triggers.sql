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
