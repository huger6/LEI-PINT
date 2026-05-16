/*==============================================================*/
/* Stored Procedures / Stored Functions                         */
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
    user_id         INTEGER,
    user_guid       UUID,
    full_name       VARCHAR,
    profile_img_url VARCHAR,
    total_points    BIGINT,
    total_badges    BIGINT,
    total_count     BIGINT
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
            COUNT(*) OVER () AS total_count
        FROM users u
        WHERE u.user_role = 'Consultant'
          AND u.is_active = TRUE
        ORDER BY total_points DESC, total_badges DESC, u.full_name ASC
    )
    SELECT
        ranked.user_id,
        ranked.user_guid,
        ranked.full_name,
        ranked.profile_img_url,
        ranked.total_points,
        ranked.total_badges,
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
        JOIN skills s ON s.badge_id = ba.badge_id
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
    FROM awarded_badges WHERE user_id = p_target_user_id;

    v_min_badges := GREATEST(0, FLOOR(v_target_badges * (1 - p_tolerance)));
    v_max_badges := CEIL(v_target_badges * (1 + p_tolerance)) + 1;

    RETURN QUERY
    WITH target_areas AS (
        SELECT area_id FROM consultant_areas WHERE user_id = p_target_user_id
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
                JOIN skills s ON s.badge_id = ba.badge_id
                WHERE ab.user_id = u.user_id)::BIGINT AS total_skills,
            (SELECT COUNT(*)
                FROM certificates c
                JOIN badge_applications ba ON ba.application_id = c.application_id
                WHERE ba.user_id = u.user_id)::BIGINT AS total_certs,
            (SELECT COUNT(*) FROM badge_applications ba
                WHERE ba.user_id = u.user_id AND ba.application_state = 'Open')::BIGINT AS open_apps
        FROM users u
        WHERE u.user_id = p_target_user_id
           OR u.user_id IN (SELECT user_id FROM peer_filtered WHERE user_id <> p_target_user_id)
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
