/*==============================================================*/
/* User Defined Functions (UDFs)                                */
/*==============================================================*/

/*--------------------------------------------------------------*/
/* FULL NAME NORMALIZATION                                      */
/*--------------------------------------------------------------*/

DROP FUNCTION IF EXISTS fn_capitalize_full_name(VARCHAR);

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
        SELECT s.badge_id, COUNT(*) AS skill_count
        FROM consultants_selected_skills css
        JOIN skills s ON s.skills_id = css.skills_id
        WHERE css.user_id = p_user_id
          AND s.badge_id IS NOT NULL
        GROUP BY s.badge_id
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
