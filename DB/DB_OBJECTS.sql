/*==============================================================*/
/* DB_OBJECTS.sql                                               */
/* Consolidates all database programmable objects.              */
/* Order: UDFs → Triggers → Stored Procedures                  */
/*==============================================================*/


/*==============================================================*/
/*                                                              */
/* 1. USER DEFINED FUNCTIONS (UDFs)                             */
/*                                                              */
/*==============================================================*/

/*--------------------------------------------------------------*/
/* FULL NAME NORMALIZATION                                      */
/*--------------------------------------------------------------*/

DROP FUNCTION IF EXISTS fn_capitalize_full_name(VARCHAR);

-- Reporting functions are dropped first so a changed RETURNS TABLE signature
-- can be replaced (CREATE OR REPLACE cannot change a function's return type).
-- Names are unique (no overloads), so dropping by name is unambiguous.
DROP FUNCTION IF EXISTS fn_consultant_badges_per_area;
DROP FUNCTION IF EXISTS get_ranking;
DROP FUNCTION IF EXISTS get_consultant_lp_progress;
DROP FUNCTION IF EXISTS get_consultant_acquisition_timeline;
DROP FUNCTION IF EXISTS get_consultant_peer_comparison;
DROP FUNCTION IF EXISTS get_badge_distribution_monthly;
DROP FUNCTION IF EXISTS get_badges_by_range;

CREATE OR REPLACE FUNCTION fn_capitalize_full_name(p_full_name VARCHAR)
RETURNS VARCHAR
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_clean_name VARCHAR;
BEGIN
    IF p_full_name IS NULL THEN
        RETURN NULL;
    END IF;

    v_clean_name := regexp_replace(trim(p_full_name), '\s+', ' ', 'g');

    IF v_clean_name = '' THEN
        RETURN v_clean_name;
    END IF;

    RETURN (
        SELECT string_agg(initcap(lower(name_part)), ' ' ORDER BY ordinality)
        FROM unnest(string_to_array(v_clean_name, ' ')) WITH ORDINALITY AS t(name_part, ordinality)
    );
END;
$$;


/*==============================================================*/
/* Badge Recommendation Engine                                  */
/*                                                              */
/* Scores all active badges the user has NOT earned/applied     */
/* for, using a weighted multi-signal approach:                 */
/*                                                              */
/* Signal                          Weight (max)                 */
/* ─────────────────────────────── ────────────                 */
/* Direct interaction (last 7d)    5.0 × count, cap 15.0       */
/* Direct interaction (8–30d)      2.0 × count, cap  6.0       */
/* FAVORITE interaction bonus       3.0 (any window)            */
/* Same area as earned badges       3.0                         */
/* Same service line as earned      1.5                         */
/* User's selected areas match      3.5                         */
/* Skills overlap (per skill)       2.0 × count, cap  8.0      */
/* Area of recent interactions      2.0                         */
/*==============================================================*/

DROP FUNCTION IF EXISTS get_badge_recommendations(INTEGER, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION get_badge_recommendations(
    p_user_id INTEGER,
    p_limit   INTEGER DEFAULT 12,
    p_offset  INTEGER DEFAULT 0
)
RETURNS TABLE (
    badge_id             INTEGER,
    badge_title          VARCHAR,
    badge_slug           VARCHAR,
    badge_img_url        VARCHAR,
    badge_points         INTEGER,
    badge_type           VARCHAR,
    area_id              INTEGER,
    area_name            VARCHAR,
    service_line_id      INTEGER,
    service_line_name    VARCHAR,
    learning_path_id     INTEGER,
    recommendation_score NUMERIC,
    total_count          BIGINT
)
LANGUAGE SQL
STABLE
AS $$
    WITH
    /*-- Badges the user has already earned ----------------------*/
    earned AS (
        SELECT bapp.badge_id
        FROM awarded_badges ab
        JOIN badge_applications bapp ON bapp.application_id = ab.application_id
        WHERE ab.user_id = p_user_id
    ),
    /*-- Badges with a non-rejected active application -----------*/
    in_progress AS (
        SELECT badge_id
        FROM badge_applications
        WHERE user_id = p_user_id
          AND application_state NOT IN ('Rejected')
    ),
    /*-- Distinct areas of the user's earned badges --------------*/
    earned_areas AS (
        SELECT DISTINCT b.area_id
        FROM earned e
        JOIN badges b ON b.badge_id = e.badge_id
    ),
    /*-- Distinct service lines of the user's earned badges ------*/
    earned_sls AS (
        SELECT DISTINCT b.service_line_id
        FROM earned e
        JOIN badges b ON b.badge_id = e.badge_id
    ),
    /*-- Areas the consultant has explicitly selected ------------*/
    user_areas AS (
        SELECT area_id
        FROM consultant_areas
        WHERE user_id = p_user_id
    ),
    /*-- Per-badge count of skills the user has selected ---------*/
    user_skill_badges AS (
        SELECT bs.badge_id, COUNT(*) AS skill_count
        FROM consultants_selected_skills css
        JOIN badge_skills bs ON bs.skills_id = css.skills_id
        WHERE css.user_id = p_user_id
        GROUP BY bs.badge_id
    ),
    /*-- Interactions in the last 7 days -------------------------*/
    recent_7d AS (
        SELECT
            badge_id,
            COUNT(*)                                  AS cnt,
            BOOL_OR(interaction_type = 'FAVORITE')    AS has_favorite
        FROM user_badges_interactions
        WHERE user_id        = p_user_id
          AND interaction_date >= NOW() - INTERVAL '7 days'
        GROUP BY badge_id
    ),
    /*-- Interactions between 8 and 30 days ago ------------------*/
    monthly_30d AS (
        SELECT badge_id, COUNT(*) AS cnt
        FROM user_badges_interactions
        WHERE user_id        = p_user_id
          AND interaction_date >= NOW() - INTERVAL '30 days'
          AND interaction_date <  NOW() - INTERVAL '7 days'
        GROUP BY badge_id
    ),
    /*-- Areas of badges the user interacted with in last 30d ----*/
    interacted_areas_30d AS (
        SELECT DISTINCT b.area_id
        FROM user_badges_interactions ubi
        JOIN badges b ON b.badge_id = ubi.badge_id
        WHERE ubi.user_id        = p_user_id
          AND ubi.interaction_date >= NOW() - INTERVAL '30 days'
    ),
    /*-- Final scoring -------------------------------------------*/
    scored AS (
        SELECT
            b.badge_id,
            b.badge_title,
            b.badge_slug,
            b.badge_img_url,
            b.badge_points,
            b.badge_type,
            b.area_id,
            a.area_name,
            b.service_line_id,
            sl.service_line_name,
            b.learning_path_id,
            (
                /* Signal 1 – recent direct interactions (7d) */
                LEAST(COALESCE(r7.cnt, 0) * 5.0,  15.0)
                /* Signal 2 – monthly direct interactions (8–30d) */
              + LEAST(COALESCE(m30.cnt, 0) * 2.0,  6.0)
                /* Signal 3 – favorite bonus */
              + CASE WHEN COALESCE(r7.has_favorite, FALSE) THEN 3.0 ELSE 0.0 END
                /* Signal 4 – same area as an earned badge */
              + CASE WHEN ea.area_id          IS NOT NULL THEN 3.0 ELSE 0.0 END
                /* Signal 5 – same service line as an earned badge */
              + CASE WHEN es.service_line_id  IS NOT NULL THEN 1.5 ELSE 0.0 END
                /* Signal 6 – area is in user's explicitly selected areas */
              + CASE WHEN ua.area_id          IS NOT NULL THEN 3.5 ELSE 0.0 END
                /* Signal 7 – skills overlap */
              + LEAST(COALESCE(usb.skill_count, 0) * 2.0, 8.0)
                /* Signal 8 – area interacted with in the last 30d */
              + CASE WHEN ia.area_id          IS NOT NULL THEN 2.0 ELSE 0.0 END
            )::NUMERIC(10,2) AS recommendation_score
        FROM badges b
        JOIN areas        a  ON a.area_id         = b.area_id
        JOIN service_lines sl ON sl.service_line_id = b.service_line_id
        LEFT JOIN recent_7d          r7  ON r7.badge_id         = b.badge_id
        LEFT JOIN monthly_30d        m30 ON m30.badge_id         = b.badge_id
        LEFT JOIN earned_areas        ea  ON ea.area_id           = b.area_id
        LEFT JOIN earned_sls          es  ON es.service_line_id   = b.service_line_id
        LEFT JOIN user_areas          ua  ON ua.area_id           = b.area_id
        LEFT JOIN user_skill_badges  usb  ON usb.badge_id         = b.badge_id
        LEFT JOIN interacted_areas_30d ia ON ia.area_id           = b.area_id
        WHERE b.is_active = TRUE
          AND b.badge_id NOT IN (SELECT badge_id FROM earned)
          AND b.badge_id NOT IN (SELECT badge_id FROM in_progress)
    ),
    total AS (SELECT COUNT(*) AS total_count FROM scored)

    SELECT
        s.badge_id,
        s.badge_title,
        s.badge_slug,
        s.badge_img_url,
        s.badge_points,
        s.badge_type,
        s.area_id,
        s.area_name,
        s.service_line_id,
        s.service_line_name,
        s.learning_path_id,
        s.recommendation_score,
        t.total_count
    FROM scored s, total t
    ORDER BY s.recommendation_score DESC, s.badge_points DESC
    LIMIT  p_limit
    OFFSET p_offset;
$$;


/*==============================================================*/
/* Consultant Badges Per Area                                   */
/*                                                              */
/* Given a user ID, returns one row per area where the          */
/* consultant has earned at least one badge, including the      */
/* area name, service line name, badges earned, and total       */
/* points accumulated in that area.                             */
/*==============================================================*/

CREATE OR REPLACE FUNCTION fn_consultant_badges_per_area(p_user_id INTEGER)
RETURNS TABLE (
    area_id           INTEGER,
    area_name         VARCHAR,
    service_line_name VARCHAR,
    badges_earned     BIGINT,
    total_points      BIGINT
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.area_id,
        a.area_name,
        sl.service_line_name,
        COUNT(ab.awarded_badges_id)::BIGINT AS badges_earned,
        COALESCE(SUM(ab.points_snapshot), 0)::BIGINT AS total_points
    FROM awarded_badges ab
    JOIN badge_applications ba ON ba.application_id = ab.application_id
    JOIN badges b              ON b.badge_id        = ba.badge_id
    JOIN areas a               ON a.area_id         = b.area_id
    JOIN service_lines sl      ON sl.service_line_id = b.service_line_id
    WHERE ab.user_id = p_user_id
    GROUP BY a.area_id, a.area_name, sl.service_line_name
    HAVING COUNT(ab.awarded_badges_id) > 0
    ORDER BY badges_earned DESC, a.area_name;
END;
$$;


/*==============================================================*/
/*                                                              */
/* 2. TRIGGERS                                                  */
/*                                                              */
/*==============================================================*/

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
-- rows the API already wrote by checking for ANY log on the same
-- application within the last 5 seconds.
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
        WHERE application_id = NEW.application_id
          AND validated_at   >= NOW() - INTERVAL '5 seconds'
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
            'System',
            v_action,
            NULL,
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


-- ==============================================================
-- GDPR POLICY IMMUTABILITY
-- ==============================================================
-- Prevents direct UPDATE of policy_text on active policies.
-- The correct workflow is: deactivate the old row, then INSERT
-- a new row with an incremented version.
-- ==============================================================

CREATE OR REPLACE FUNCTION fn_prevent_gdpr_policy_overwrite()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.is_active = TRUE AND NEW.is_active = TRUE THEN
        IF OLD.policy_text IS DISTINCT FROM NEW.policy_text THEN
            RAISE EXCEPTION
                'Cannot overwrite active policy text (policy_id=%). '
                'Deactivate this row first, then INSERT a new version.',
                OLD.policy_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_prevent_gdpr_policy_overwrite
BEFORE UPDATE ON gdpr_policies
FOR EACH ROW
EXECUTE FUNCTION fn_prevent_gdpr_policy_overwrite();


/*==============================================================*/
/*                                                              */
/* 3. STORED PROCEDURES / STORED FUNCTIONS                      */
/*                                                              */
/*==============================================================*/

/*--------------------------------------------------------------*/
/* FULL NAME NORMALIZATION                                      */
/*--------------------------------------------------------------*/

CREATE OR REPLACE PROCEDURE sp_normalize_users_full_name()
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE users
    SET full_name = fn_capitalize_full_name(full_name),
        updated_at = now()
    WHERE full_name IS NOT NULL
      AND full_name <> fn_capitalize_full_name(full_name);
END;
$$;


/*--------------------------------------------------------------*/
/* RANKING                                                      */
/*--------------------------------------------------------------*/

CREATE OR REPLACE FUNCTION get_ranking(
    p_page            INTEGER,
    p_limit           INTEGER,
    p_learning_path_id INTEGER DEFAULT NULL,
    p_service_line_id  INTEGER DEFAULT NULL,
    p_area_id          INTEGER DEFAULT NULL
)
RETURNS TABLE (
    user_id           INTEGER,
    user_guid         UUID,
    full_name         VARCHAR,
    profile_img_url   VARCHAR,
    total_points      BIGINT,
    total_badges      BIGINT,
    primary_area_name VARCHAR,
    total_count       BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_offset INTEGER := (p_page - 1) * p_limit;
BEGIN
    RETURN QUERY
    WITH ranked AS (
        SELECT
            u.user_id,
            u.user_guid,
            u.full_name,
            u.profile_img_url,
            COALESCE((
                SELECT SUM(ph.points_delta)
                FROM points_history ph
                LEFT JOIN badge_requirements br ON ph.requirement_id = br.requirement_id
                LEFT JOIN badges b ON (ph.badge_id = b.badge_id OR br.badge_id = b.badge_id)
                WHERE ph.user_id = u.user_id
                  AND (p_learning_path_id IS NULL OR b.learning_path_id = p_learning_path_id)
                  AND (p_service_line_id  IS NULL OR b.service_line_id  = p_service_line_id)
                  AND (p_area_id          IS NULL OR b.area_id          = p_area_id)
            ), 0) AS total_points,
            (
                SELECT COUNT(ab.awarded_badges_id)
                FROM awarded_badges ab
                JOIN badge_applications ba ON ab.application_id = ba.application_id
                JOIN badges b ON ba.badge_id = b.badge_id
                WHERE ab.user_id = u.user_id
                  AND (p_learning_path_id IS NULL OR b.learning_path_id = p_learning_path_id)
                  AND (p_service_line_id  IS NULL OR b.service_line_id  = p_service_line_id)
                  AND (p_area_id          IS NULL OR b.area_id          = p_area_id)
            ) AS total_badges,
            (
                SELECT a.area_name
                FROM consultant_areas ca
                JOIN areas a ON a.area_id = ca.area_id
                WHERE ca.user_id = u.user_id AND ca.is_primary = TRUE
                LIMIT 1
            ) AS primary_area_name,
            COUNT(*) OVER () AS total_count
        FROM users u
        WHERE u.user_role = 'Consultant'
          AND u.is_active = TRUE
          -- Restrict WHO appears (not just the points math) so a scoped ranking
          -- (e.g. a Service Line Leader's own SL) lists only consultants who
          -- belong to that area / service line / learning path.
          AND (p_area_id IS NULL OR EXISTS (
                SELECT 1 FROM consultant_areas ca
                WHERE ca.user_id = u.user_id AND ca.area_id = p_area_id))
          AND (p_service_line_id IS NULL OR EXISTS (
                SELECT 1 FROM consultant_areas ca
                JOIN areas a ON a.area_id = ca.area_id
                WHERE ca.user_id = u.user_id AND a.service_line_id = p_service_line_id))
          AND (p_learning_path_id IS NULL OR EXISTS (
                SELECT 1 FROM consultant_areas ca
                JOIN areas a ON a.area_id = ca.area_id
                JOIN service_lines sl ON sl.service_line_id = a.service_line_id
                WHERE ca.user_id = u.user_id AND sl.learning_path_id = p_learning_path_id))
        ORDER BY total_points DESC, total_badges DESC, u.full_name ASC
    )
    SELECT
        ranked.user_id,
        ranked.user_guid,
        ranked.full_name,
        ranked.profile_img_url,
        ranked.total_points,
        ranked.total_badges,
        ranked.primary_area_name,
        ranked.total_count
    FROM ranked
    LIMIT p_limit OFFSET v_offset;
END;
$$;


/*--------------------------------------------------------------*/
/* INDIVIDUAL CONSULTANT                                        */
/*--------------------------------------------------------------*/

/* Per-learning-path progress for a consultant: total badges
   in the LP, badges earned, completion percentage and points. */
CREATE OR REPLACE FUNCTION get_consultant_lp_progress(p_user_id INTEGER)
RETURNS TABLE (
    learning_path_id INTEGER,
    path_title       VARCHAR,
    path_slug        VARCHAR,
    img_url          VARCHAR,
    total_badges     BIGINT,
    earned_badges    BIGINT,
    progress_pct     NUMERIC,
    points_earned    BIGINT
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
    RETURN QUERY
    WITH user_awards AS (
        SELECT ba.badge_id, ab.points_snapshot
        FROM awarded_badges ab
        JOIN badge_applications ba ON ba.application_id = ab.application_id
        WHERE ab.user_id = p_user_id
    )
    SELECT
        lp.learning_path_id,
        lp.path_title,
        lp.path_slug,
        lp.img_url,
        COUNT(b.badge_id)::BIGINT AS total_badges,
        COUNT(ua.badge_id)::BIGINT AS earned_badges,
        CASE WHEN COUNT(b.badge_id) = 0 THEN 0
             ELSE ROUND((COUNT(ua.badge_id)::NUMERIC * 100) / COUNT(b.badge_id), 2)
        END AS progress_pct,
        COALESCE(SUM(ua.points_snapshot), 0)::BIGINT AS points_earned
    FROM learning_paths lp
    LEFT JOIN badges b
           ON b.learning_path_id = lp.learning_path_id
          AND b.is_active = TRUE
    LEFT JOIN user_awards ua ON ua.badge_id = b.badge_id
    WHERE lp.is_active = TRUE
    GROUP BY lp.learning_path_id, lp.path_title, lp.path_slug, lp.img_url
    ORDER BY lp.path_title;
END;
$$;


/* Cumulative skills and certifications acquired over time
   (one row per month with running totals). */
CREATE OR REPLACE FUNCTION get_consultant_acquisition_timeline(p_user_id INTEGER)
RETURNS TABLE (
    period_month       DATE,
    skills_in_month    BIGINT,
    certs_in_month     BIGINT,
    cumulative_skills  BIGINT,
    cumulative_certs   BIGINT
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
    RETURN QUERY
    WITH skills_earned AS (
        SELECT date_trunc('month', ab.awarded_at)::DATE AS bucket,
               COUNT(s.skills_id) AS n
        FROM awarded_badges ab
        JOIN badge_applications ba ON ba.application_id = ab.application_id
        JOIN badge_skills s ON s.badge_id = ba.badge_id
        WHERE ab.user_id = p_user_id
        GROUP BY 1
    ),
    certs_earned AS (
        SELECT date_trunc('month', c.issue_date)::DATE AS bucket,
               COUNT(c.certificate_id) AS n
        FROM certificates c
        JOIN badge_applications ba ON ba.application_id = c.application_id
        WHERE ba.user_id = p_user_id AND c.issue_date IS NOT NULL
        GROUP BY 1
    ),
    months AS (
        SELECT bucket FROM skills_earned
        UNION
        SELECT bucket FROM certs_earned
    )
    SELECT
        m.bucket AS period_month,
        COALESCE(se.n, 0)::BIGINT AS skills_in_month,
        COALESCE(ce.n, 0)::BIGINT AS certs_in_month,
        SUM(COALESCE(se.n, 0)) OVER (ORDER BY m.bucket)::BIGINT AS cumulative_skills,
        SUM(COALESCE(ce.n, 0)) OVER (ORDER BY m.bucket)::BIGINT AS cumulative_certs
    FROM months m
    LEFT JOIN skills_earned se ON se.bucket = m.bucket
    LEFT JOIN certs_earned ce  ON ce.bucket = m.bucket
    ORDER BY m.bucket;
END;
$$;


/*--------------------------------------------------------------*/
/* PEER COMPARISON  (SLL / TM)                                  */
/*--------------------------------------------------------------*/

/* Compare a target consultant against peers that share at least
   one area and have a similar experience level (number of earned
   badges within ±25% of the target). Returns the target row first
   followed by peer aggregates plus group medians. */
CREATE OR REPLACE FUNCTION get_consultant_peer_comparison(
    p_target_user_id   INTEGER,
    p_tolerance        NUMERIC DEFAULT 0.25
)
RETURNS TABLE (
    user_id         INTEGER,
    full_name       VARCHAR,
    profile_img_url VARCHAR,
    is_target       BOOLEAN,
    total_points    BIGINT,
    total_badges    BIGINT,
    total_skills    BIGINT,
    total_certs     BIGINT,
    open_apps       BIGINT,
    peer_count      BIGINT
)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
    v_target_badges BIGINT;
    v_min_badges    BIGINT;
    v_max_badges    BIGINT;
BEGIN
    SELECT COUNT(*) INTO v_target_badges
    FROM awarded_badges ab WHERE ab.user_id = p_target_user_id;

    v_min_badges := GREATEST(0, FLOOR(v_target_badges * (1 - p_tolerance)));
    v_max_badges := CEIL(v_target_badges * (1 + p_tolerance)) + 1;

    RETURN QUERY
    WITH target_areas AS (
        SELECT ca.area_id FROM consultant_areas ca WHERE ca.user_id = p_target_user_id
    ),
    peer_pool AS (
        SELECT DISTINCT u.user_id
        FROM users u
        JOIN consultants c ON c.user_id = u.user_id
        JOIN consultant_areas ca ON ca.user_id = u.user_id
        WHERE u.user_role = 'Consultant'
          AND u.is_active = TRUE
          AND ca.area_id IN (SELECT area_id FROM target_areas)
    ),
    peer_filtered AS (
        SELECT pp.user_id
        FROM peer_pool pp
        WHERE (SELECT COUNT(*) FROM awarded_badges ab WHERE ab.user_id = pp.user_id)
              BETWEEN v_min_badges AND v_max_badges
    ),
    aggregated AS (
        SELECT
            u.user_id,
            u.full_name,
            u.profile_img_url,
            (u.user_id = p_target_user_id) AS is_target,
            COALESCE((SELECT SUM(ph.points_delta) FROM points_history ph WHERE ph.user_id = u.user_id), 0)::BIGINT AS total_points,
            (SELECT COUNT(*) FROM awarded_badges ab WHERE ab.user_id = u.user_id)::BIGINT AS total_badges,
            (SELECT COUNT(DISTINCT s.skills_id)
                FROM awarded_badges ab
                JOIN badge_applications ba ON ba.application_id = ab.application_id
                JOIN badge_skills s ON s.badge_id = ba.badge_id
                WHERE ab.user_id = u.user_id)::BIGINT AS total_skills,
            (SELECT COUNT(*)
                FROM certificates c
                JOIN badge_applications ba ON ba.application_id = c.application_id
                WHERE ba.user_id = u.user_id)::BIGINT AS total_certs,
            (SELECT COUNT(*) FROM badge_applications ba
                WHERE ba.user_id = u.user_id AND ba.application_state = 'Open')::BIGINT AS open_apps
        FROM users u
        WHERE u.user_id = p_target_user_id
           OR u.user_id IN (SELECT pf.user_id FROM peer_filtered pf WHERE pf.user_id <> p_target_user_id)
    )
    SELECT
        a.user_id,
        a.full_name,
        a.profile_img_url,
        a.is_target,
        a.total_points,
        a.total_badges,
        a.total_skills,
        a.total_certs,
        a.open_apps,
        (SELECT COUNT(*) - 1 FROM aggregated)::BIGINT AS peer_count
    FROM aggregated a
    ORDER BY a.is_target DESC, a.total_points DESC;
END;
$$;


/*--------------------------------------------------------------*/
/* GENERAL REPORTING                                            */
/*--------------------------------------------------------------*/

/* Monthly badge distribution across the requested grouping
   ('learning_path' | 'service_line' | 'area'). Optionally
   constrained to a date range on awarded_at. */
CREATE OR REPLACE FUNCTION get_badge_distribution_monthly(
    p_group_by   VARCHAR,
    p_date_from  DATE DEFAULT NULL,
    p_date_to    DATE DEFAULT NULL
)
RETURNS TABLE (
    period_month  DATE,
    group_id      INTEGER,
    group_label   VARCHAR,
    awarded_count BIGINT,
    pct_of_month  NUMERIC
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
    RETURN QUERY
    WITH base AS (
        SELECT
            date_trunc('month', ab.awarded_at)::DATE AS bucket,
            CASE p_group_by
                WHEN 'learning_path' THEN b.learning_path_id
                WHEN 'service_line'  THEN b.service_line_id
                WHEN 'area'          THEN b.area_id
            END AS gid,
            CASE p_group_by
                WHEN 'learning_path' THEN (SELECT lp.path_title FROM learning_paths lp WHERE lp.learning_path_id = b.learning_path_id)
                WHEN 'service_line'  THEN (SELECT sl.service_line_name FROM service_lines sl WHERE sl.service_line_id = b.service_line_id)
                WHEN 'area'          THEN (SELECT ar.area_name FROM areas ar WHERE ar.area_id = b.area_id)
            END AS label
        FROM awarded_badges ab
        JOIN badge_applications ba ON ba.application_id = ab.application_id
        JOIN badges b ON b.badge_id = ba.badge_id
        WHERE (p_date_from IS NULL OR ab.awarded_at >= p_date_from)
          AND (p_date_to   IS NULL OR ab.awarded_at <  (p_date_to + INTERVAL '1 day'))
    ),
    counted AS (
        SELECT bucket, gid, label, COUNT(*) AS n
        FROM base
        GROUP BY bucket, gid, label
    )
    SELECT
        c.bucket AS period_month,
        c.gid    AS group_id,
        c.label  AS group_label,
        c.n      AS awarded_count,
        ROUND(c.n::NUMERIC * 100 / NULLIF(SUM(c.n) OVER (PARTITION BY c.bucket), 0), 2) AS pct_of_month
    FROM counted c
    ORDER BY c.bucket, c.n DESC;
END;
$$;


/* Awarded badges within an arbitrary date range filterable by
   learning path, service line, area and progression stage (level). */
CREATE OR REPLACE FUNCTION get_badges_by_range(
    p_date_from        DATE,
    p_date_to          DATE,
    p_learning_path_id INTEGER DEFAULT NULL,
    p_service_line_id  INTEGER DEFAULT NULL,
    p_area_id          INTEGER DEFAULT NULL,
    p_stage_id         INTEGER DEFAULT NULL
)
RETURNS TABLE (
    badge_id          INTEGER,
    badge_title       VARCHAR,
    badge_slug        VARCHAR,
    badge_img_url     VARCHAR,
    learning_path_id  INTEGER,
    service_line_id   INTEGER,
    area_id           INTEGER,
    progression_stage_id INTEGER,
    awarded_count     BIGINT,
    first_awarded_at  TIMESTAMP,
    last_awarded_at   TIMESTAMP
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        b.badge_id,
        b.badge_title,
        b.badge_slug,
        b.badge_img_url,
        b.learning_path_id,
        b.service_line_id,
        b.area_id,
        b.progression_stage_id,
        COUNT(ab.awarded_badges_id)::BIGINT AS awarded_count,
        MIN(ab.awarded_at)::TIMESTAMP AS first_awarded_at,
        MAX(ab.awarded_at)::TIMESTAMP AS last_awarded_at
    FROM badges b
    JOIN badge_applications ba ON ba.badge_id = b.badge_id
    JOIN awarded_badges ab     ON ab.application_id = ba.application_id
    WHERE ab.awarded_at >= p_date_from
      AND ab.awarded_at <  (p_date_to + INTERVAL '1 day')
      AND (p_learning_path_id IS NULL OR b.learning_path_id     = p_learning_path_id)
      AND (p_service_line_id  IS NULL OR b.service_line_id      = p_service_line_id)
      AND (p_area_id          IS NULL OR b.area_id              = p_area_id)
      AND (p_stage_id         IS NULL OR b.progression_stage_id = p_stage_id)
    GROUP BY b.badge_id
    ORDER BY awarded_count DESC, b.badge_title;
END;
$$;


/*--------------------------------------------------------------*/
/* POINTS RECONCILIATION                                        */
/*--------------------------------------------------------------*/

/* Audits points_history against awarded badges. For every
   accepted badge application whose badge-level completion
   points row is missing from points_history, inserts it.
   Handles edge cases where a badge was accepted but the
   points record was lost (failed transaction, manual fix). */
CREATE OR REPLACE PROCEDURE sp_reconcile_badge_points()
LANGUAGE plpgsql
AS $$
DECLARE
    v_inserted_count INTEGER := 0;
    v_rec RECORD;
BEGIN
    FOR v_rec IN
        SELECT
            ab.user_id,
            ba.badge_id,
            b.badge_title,
            b.badge_points
        FROM awarded_badges ab
        JOIN badge_applications ba ON ba.application_id = ab.application_id
        JOIN badges b              ON b.badge_id        = ba.badge_id
        WHERE b.badge_points > 0
          AND NOT EXISTS (
              SELECT 1
              FROM points_history ph
              WHERE ph.user_id       = ab.user_id
                AND ph.badge_id      = ba.badge_id
                AND ph.requirement_id IS NULL
          )
    LOOP
        INSERT INTO points_history (user_id, badge_id, requirement_id, points_delta, justification)
        VALUES (
            v_rec.user_id,
            v_rec.badge_id,
            NULL,
            v_rec.badge_points,
            'Reconciled: Badge completed — ' || v_rec.badge_title
        );

        v_inserted_count := v_inserted_count + 1;
    END LOOP;

    RAISE NOTICE 'sp_reconcile_badge_points: inserted % missing points record(s).', v_inserted_count;
END;
$$;
