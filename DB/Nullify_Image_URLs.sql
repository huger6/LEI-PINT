/* ============================================================
   Nullify all image URL columns
   Run this against your target PostgreSQL database.
   ============================================================ */

BEGIN;

UPDATE areas
SET img_url = NULL
WHERE img_url IS NOT NULL;

UPDATE learning_paths
SET img_url = NULL
WHERE img_url IS NOT NULL;

UPDATE service_lines
SET img_url = NULL
WHERE img_url IS NOT NULL;

UPDATE badges
SET badge_img_url = NULL
WHERE badge_img_url IS NOT NULL;

UPDATE badge_requirements
SET requirement_img_url = NULL
WHERE requirement_img_url IS NOT NULL;

UPDATE users
SET profile_img_url = NULL
WHERE profile_img_url IS NOT NULL;

COMMIT;
