/*==============================================================*/
/* Stored Procedures                                            */
/*==============================================================*/

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
