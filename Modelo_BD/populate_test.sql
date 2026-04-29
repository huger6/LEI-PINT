-- Restart IDENTITY counter (run before prod)
ALTER TABLE users ALTER COLUMN user_id RESTART WITH 1;
ALTER TABLE learning_paths ALTER COLUMN learning_path_id RESTART WITH 1;
ALTER TABLE services_lines ALTER COLUMN service_line_id RESTART WITH 1;
ALTER TABLE areas ALTER COLUMN area_id RESTART WITH 1;

DO $$
DECLARE
    admin_id INTEGER;
    lp_id INTEGER;
    sl_hybrid_id INTEGER;
    sl_ops_id INTEGER;
    sl_talent_id INTEGER;
BEGIN
    INSERT INTO users (
        full_name, username, email_address, password_hash, 
        user_role, is_active, email_confirmed, force_password_change
    )
    VALUES (
        'Administrador Geral', 'superadmin', 'admin@softinsa.pt', 
        '$2b$10$gqPhkFz9K3pzW5iG.oxpQ.xjhed3vCZfZ97hZ4ZG9KEaEH43G7geW', 'Administrator', -- Hash is for Password: Admin1234!
        TRUE, TRUE, FALSE
    )
    RETURNING user_id INTO admin_id;

    INSERT INTO administrators (user_id, is_super_admin)
    VALUES (admin_id, TRUE);

    INSERT INTO learning_paths (path_title, path_slug, created_by)
    VALUES ('Jornada Técnica', 'jornada-tecnica', admin_id)
    RETURNING learning_path_id INTO lp_id;

    -- Hybrid Cloud
    INSERT INTO services_lines (learning_path_id, service_line_name, sl_slug, created_by)
    VALUES (lp_id, 'Hybrid Cloud', 'hybrid-cloud', admin_id)
    RETURNING service_line_id INTO sl_hybrid_id;

    -- Application Operations
    INSERT INTO services_lines (learning_path_id, service_line_name, sl_slug, created_by)
    VALUES (lp_id, 'Application Operations', 'application-operations', admin_id)
    RETURNING service_line_id INTO sl_ops_id;

    -- Sourcing & Talent Management
    INSERT INTO services_lines (learning_path_id, service_line_name, sl_slug, created_by)
    VALUES (lp_id, 'Sourcing & Talent Management', 'sourcing-talent-management', admin_id)
    RETURNING service_line_id INTO sl_talent_id;

    -- Area LowCode (Outsystems) in Service Line Hybrid Cloud
    INSERT INTO areas (service_line_id, area_name, area_slug, created_by)
    VALUES (sl_hybrid_id, 'LowCode (Outsystems)', 'lowcode-outsystems', admin_id);

    -- Area DevSecOps & IT Automation in Service Line Application Operations
    INSERT INTO areas (service_line_id, area_name, area_slug, created_by)
    VALUES (sl_ops_id, 'DevSecOps & IT Automation - DevOps', 'devops', admin_id);

    -- Area Talent Management in Service Line Sourcing & Talent Management
    INSERT INTO areas (service_line_id, area_name, area_slug, created_by)
    VALUES (sl_talent_id, 'Talent Managem', 'talent-management', admin_id);

    RAISE NOTICE 'Estrutura base criada com sucesso por admin ID: %', admin_id;
END $$;
