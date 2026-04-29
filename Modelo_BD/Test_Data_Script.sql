
/* ============================================================
    1. DADOS BASE (LINGUAS E LOCALIZACOES)
    ============================================================ */

INSERT INTO preferred_lang (preferred_lang)
VALUES
('pt-PT'),
('en-GB'),
('es-ES')
ON CONFLICT (preferred_lang) DO NOTHING;

INSERT INTO locations (location_name)
SELECT v.location_name
FROM (
      VALUES
      ('Lisboa'),
      ('Tomar'),
      ('Viseu'),
      ('Vila Real'),
      ('Fundão'),
      ('Portalegre')
) AS v(location_name)
WHERE NOT EXISTS (
      SELECT 1
      FROM locations l
      WHERE l.location_name = v.location_name
);


/* ============================================================
    2. UTILIZADORES BASE (ADMIN, CONSULTOR, TM, SLL)
    ============================================================ */

INSERT INTO users
(full_name, username, email_address, password_hash,
 user_role, preferred_lang_id, location_id,
 email_confirmed, force_password_change)
SELECT
      v.full_name,
      v.username,
      v.email_address,
      v.password_hash,
      v.user_role,
      pl.preferred_lang_id,
      (
            SELECT l.location_id
            FROM locations l
            WHERE l.location_name = v.location_name
            ORDER BY l.location_id
            LIMIT 1
      ) AS location_id,
      TRUE,
      FALSE
FROM (
      VALUES
      -- Administrador
      ('Admin Softinsa', 'admin', 'admin@softinsa.pt',
       'hash_admin', 'Administrator', 'pt-PT', 'Porto'),

      -- Consultores
      ('Joao Ferreira', 'jferreira', 'joao.ferreira@softinsa.pt',
       'hash_consultor_1', 'Consultant', 'pt-PT', 'Porto'),
      ('Marta Rocha', 'mrocha', 'marta.rocha@softinsa.pt',
       'hash_consultor_2', 'Consultant', 'en-GB', 'Lisboa'),
      ('Pedro Carvalho', 'pcarvalho', 'pedro.carvalho@softinsa.pt',
       'hash_consultor_3', 'Consultant', 'pt-PT', 'Braga'),

      -- Talent Manager
      ('Ana Silva', 'asilva', 'ana.silva@softinsa.pt',
       'hash_tm', 'Talent Manager', 'en-GB', 'Lisboa'),

      -- Service Line Leaders (1 por service line)
      ('Carlos Mendes', 'cmendes', 'carlos.mendes@softinsa.pt',
       'hash_sll_1', 'Service Line Leader', 'pt-PT', 'Porto'),
      ('Rita Matos', 'rmatos', 'rita.matos@softinsa.pt',
       'hash_sll_2', 'Service Line Leader', 'pt-PT', 'Lisboa'),
      ('Nuno Teixeira', 'nteixeira', 'nuno.teixeira@softinsa.pt',
       'hash_sll_3', 'Service Line Leader', 'pt-PT', 'Braga'),
      ('Diana Barbosa', 'dbarbosa', 'diana.barbosa@softinsa.pt',
       'hash_sll_4', 'Service Line Leader', 'en-GB', 'Porto'),
      ('Andre Castro', 'acastro', 'andre.castro@softinsa.pt',
       'hash_sll_5', 'Service Line Leader', 'pt-PT', 'Lisboa'),
      ('Filipa Martins', 'fmartins', 'filipa.martins@softinsa.pt',
       'hash_sll_6', 'Service Line Leader', 'pt-PT', 'Braga'),
      ('Paulo Nogueira', 'pnogueira', 'paulo.nogueira@softinsa.pt',
       'hash_sll_7', 'Service Line Leader', 'en-GB', 'Porto'),
      ('Carla Sousa', 'csousa', 'carla.sousa@softinsa.pt',
       'hash_sll_8', 'Service Line Leader', 'pt-PT', 'Lisboa'),
      ('Joana Rodrigues', 'jrodrigues', 'joana.rodrigues@softinsa.pt',
       'hash_sll_9', 'Service Line Leader', 'pt-PT', 'Braga'),
      ('Eduardo Vieira', 'evieira', 'eduardo.vieira@softinsa.pt',
       'hash_sll_10', 'Service Line Leader', 'en-GB', 'Porto')
) AS v(full_name, username, email_address, password_hash, user_role, preferred_lang, location_name)
JOIN preferred_lang pl
   ON pl.preferred_lang = v.preferred_lang
ON CONFLICT (username) DO NOTHING;


/* ============================================================
    3. PERFIS DERIVADOS DOS USERS
    ============================================================ */

-- Administrador
INSERT INTO administrators (user_id, is_super_admin)
SELECT u.user_id, TRUE
FROM users u
WHERE u.username = 'admin'
ON CONFLICT (user_id) DO NOTHING;

-- Consultores
INSERT INTO consultants (user_id, gdpr_accepted, biography)
SELECT u.user_id, TRUE, v.biography
FROM (
      VALUES
      ('jferreira', 'Consultor focado em desenvolvimento Low-Code.'),
      ('mrocha', 'Consultora com foco em Data, IA e analytics.'),
      ('pcarvalho', 'Consultor orientado a gestao de projetos e equipas.')
) AS v(username, biography)
JOIN users u
   ON u.username = v.username
ON CONFLICT (user_id) DO NOTHING;

-- Talent Manager
INSERT INTO talent_managers (user_id, biography)
SELECT u.user_id, 'Responsavel pela validacao das evidencias.'
FROM users u
WHERE u.username = 'asilva'
ON CONFLICT (user_id) DO NOTHING;


/* ============================================================
    4. LEARNING PATHS (+1)
    ============================================================ */

WITH admin_ref AS (
      SELECT a.user_id AS admin_user_id
      FROM administrators a
      JOIN users u ON u.user_id = a.user_id
      WHERE u.username = 'admin'
)
INSERT INTO learning_paths
(path_title, path_slug, path_description, created_by)
SELECT v.path_title, v.path_slug, v.path_description, ar.admin_user_id
FROM (
      VALUES
      ('Jornada Tecnica', 'jornada-tecnica',
       'Learning Path tecnico principal da Softinsa'),
      ('Jornada de Gestao e Lideranca', 'jornada-gestao-lideranca',
       'Learning Path orientado a lideranca, governance e delivery')
) AS v(path_title, path_slug, path_description)
CROSS JOIN admin_ref ar
ON CONFLICT (path_slug) DO NOTHING;


/* ============================================================
    5. SERVICE LINES (5 POR LEARNING PATH)
    ============================================================ */

WITH admin_ref AS (
      SELECT a.user_id AS admin_user_id
      FROM administrators a
      JOIN users u ON u.user_id = a.user_id
      WHERE u.username = 'admin'
)
INSERT INTO service_lines
(learning_path_id, service_line_name, sl_slug,
 service_line_description, created_by)
SELECT
      lp.learning_path_id,
      v.service_line_name,
      v.sl_slug,
      v.service_line_description,
      ar.admin_user_id
FROM (
      VALUES
      -- Jornada Tecnica
      ('jornada-tecnica', 'Hybrid Cloud', 'hybrid-cloud',
       'Service Line de plataformas cloud hibridas e modernizacao.'),
      ('jornada-tecnica', 'Low-Code Automation', 'low-code-automation',
       'Service Line orientada a automacao e desenvolvimento low-code.'),
      ('jornada-tecnica', 'Data and AI Engineering', 'data-ai-engineering',
       'Service Line para engenharia de dados, IA e analitica.'),
      ('jornada-tecnica', 'DevSecOps Platform', 'devsecops-platform',
       'Service Line de CI/CD, observabilidade e seguranca aplicacional.'),
      ('jornada-tecnica', 'Integration API', 'integration-api',
       'Service Line de integracao de sistemas e API management.'),

      -- Jornada de Gestao e Lideranca
      ('jornada-gestao-lideranca', 'Project Management', 'project-management',
       'Service Line de gestao de projetos, delivery e planeamento.'),
      ('jornada-gestao-lideranca', 'People Leadership', 'people-leadership',
       'Service Line de lideranca, coaching e desenvolvimento de equipa.'),
      ('jornada-gestao-lideranca', 'Quality Assurance', 'quality-assurance',
       'Service Line de qualidade, processos e melhoria continua.'),
      ('jornada-gestao-lideranca', 'Business Analysis', 'business-analysis',
       'Service Line de levantamento funcional e modelacao de requisitos.'),
      ('jornada-gestao-lideranca', 'Governance Risk Compliance', 'governance-risk-compliance',
       'Service Line focada em governance, risco e conformidade.')
) AS v(path_slug, service_line_name, sl_slug, service_line_description)
JOIN learning_paths lp
   ON lp.path_slug = v.path_slug
CROSS JOIN admin_ref ar
ON CONFLICT (sl_slug) DO NOTHING;


/* ============================================================
    6. SERVICE LINE LEADERS (APOS CRIAR SERVICE LINES)
    ============================================================ */

INSERT INTO service_line_leaders (user_id, service_line_id, biography)
SELECT
      u.user_id,
      sl.service_line_id,
      v.biography
FROM (
      VALUES
      ('cmendes', 'hybrid-cloud', 'Lider de iniciativas cloud hibridas.'),
      ('rmatos', 'low-code-automation', 'Lider de automacao low-code e workflow.'),
      ('nteixeira', 'data-ai-engineering', 'Lider de data engineering e IA aplicada.'),
      ('dbarbosa', 'devsecops-platform', 'Lider de DevSecOps e governance tecnica.'),
      ('acastro', 'integration-api', 'Lider de integracoes enterprise e APIs.'),
      ('fmartins', 'project-management', 'Lider de delivery e gestao de projetos.'),
      ('pnogueira', 'people-leadership', 'Lider de desenvolvimento de talento e equipas.'),
      ('csousa', 'quality-assurance', 'Lider de processos de qualidade e auditoria.'),
      ('jrodrigues', 'business-analysis', 'Lider de analise funcional e requisitos.'),
      ('evieira', 'governance-risk-compliance', 'Lider de governance, risco e compliance.')
) AS v(username, sl_slug, biography)
JOIN users u
   ON u.username = v.username
JOIN service_lines sl
   ON sl.sl_slug = v.sl_slug
ON CONFLICT (user_id) DO UPDATE
SET service_line_id = EXCLUDED.service_line_id,
      biography = EXCLUDED.biography;


/* ============================================================
    7. AREAS (2 POR SERVICE LINE)
    ============================================================ */

WITH admin_ref AS (
      SELECT a.user_id AS admin_user_id
      FROM administrators a
      JOIN users u ON u.user_id = a.user_id
      WHERE u.username = 'admin'
)
INSERT INTO areas
(service_line_id, area_name, area_slug,
 area_description, created_by)
SELECT
      sl.service_line_id,
      sl.service_line_name || ' Core',
      sl.sl_slug || '-core',
      'Area base para desenvolvimento de competencias nucleares em ' || sl.service_line_name || '.',
      ar.admin_user_id
FROM service_lines sl
CROSS JOIN admin_ref ar
UNION ALL
SELECT
      sl.service_line_id,
      sl.service_line_name || ' Advanced',
      sl.sl_slug || '-advanced',
      'Area avancada para especializacao tecnica e lideranca em ' || sl.service_line_name || '.',
      ar.admin_user_id
FROM service_lines sl
CROSS JOIN admin_ref ar
ON CONFLICT (area_slug) DO NOTHING;


/* ============================================================
    8. CODIGOS DE NIVEL (A-E)
    ============================================================ */

INSERT INTO stage_codes (stage_code)
VALUES
('A'), -- Junior
('B'), -- Intermedio
('C'), -- Senior
('D'), -- Especialista
('E')  -- Lider
ON CONFLICT (stage_code) DO NOTHING;


/* ============================================================
    9. NIVEIS DE PROGRESSAO (3 POR AREA)
    ============================================================ */

WITH admin_ref AS (
      SELECT a.user_id AS admin_user_id
      FROM administrators a
      JOIN users u ON u.user_id = a.user_id
      WHERE u.username = 'admin'
),
stage_template(stage_code, stage_title, stage_sequence, stage_description) AS (
      VALUES
      ('A', 'Junior', 1, 'Nivel inicial de dominio tecnico e autonomia supervisionada.'),
      ('B', 'Intermedio', 2, 'Nivel de autonomia funcional com entregas consistentes.'),
      ('C', 'Senior', 3, 'Nivel avancado de lideranca tecnica e mentoria.')
)
INSERT INTO progression_stages
(area_id, stage_code_id, stage_title,
 stage_sequence, stage_description, created_by)
SELECT
      a.area_id,
      sc.stage_code_id,
            st.stage_title,
            st.stage_sequence,
            st.stage_description || ' [' || a.area_name || ']',
      ar.admin_user_id
FROM areas a
JOIN stage_template st
   ON TRUE
JOIN stage_codes sc
      ON sc.stage_code = st.stage_code
CROSS JOIN admin_ref ar
WHERE NOT EXISTS (
      SELECT 1
      FROM progression_stages ps
      WHERE ps.area_id = a.area_id
         AND ps.stage_code_id = sc.stage_code_id
);


/* ============================================================
    10. BADGES (1 POR STAGE)
    ============================================================ */

WITH admin_ref AS (
      SELECT a.user_id AS admin_user_id
      FROM administrators a
      JOIN users u ON u.user_id = a.user_id
      WHERE u.username = 'admin'
)
INSERT INTO badges
(progression_stage_id, area_id,
 badge_title, badge_slug, badge_type,
 badge_points, badge_description,
 expiration_duration_days, created_by)
SELECT
      ps.progression_stage_id,
      a.area_id,
      a.area_name || ' - ' || ps.stage_title,
      a.area_slug || '-' || LOWER(REPLACE(ps.stage_title, ' ', '-')),
      'Standard',
      (ps.stage_sequence * 100),
      'Badge de progressao para ' || a.area_name || ' no nivel ' || ps.stage_title || '.',
      NULL,
      ar.admin_user_id
FROM progression_stages ps
JOIN areas a
   ON a.area_id = ps.area_id
LEFT JOIN badges b
   ON b.progression_stage_id = ps.progression_stage_id
CROSS JOIN admin_ref ar
WHERE b.badge_id IS NULL;


/* ============================================================
    11. REQUISITOS (3 POR BADGE)
    ============================================================ */

WITH admin_ref AS (
      SELECT a.user_id AS admin_user_id
      FROM administrators a
      JOIN users u ON u.user_id = a.user_id
      WHERE u.username = 'admin'
),
requirement_template(requirement_sequence, requirement_title, requirement_description) AS (
      VALUES
      (1, 'R1 - Formacao Base', 'Concluir formacao estruturada e validada para o topico do badge.'),
      (2, 'R2 - Projeto Pratico', 'Entregar evidencia de projeto pratico com escopo e impacto definidos.'),
      (3, 'R3 - Validacao Tecnica', 'Submeter validacao tecnica ou certificacao equivalente.')
)
INSERT INTO badge_requirements
(badge_id, progression_stage_id,
 requirement_title, requirement_sequence,
 requirement_description, created_by)
SELECT
      b.badge_id,
      b.progression_stage_id,
      rt.requirement_title || ' [' || b.badge_title || ']',
      rt.requirement_sequence,
      rt.requirement_description,
      ar.admin_user_id
FROM badges b
JOIN requirement_template rt
   ON TRUE
CROSS JOIN admin_ref ar
WHERE NOT EXISTS (
      SELECT 1
      FROM badge_requirements br
      WHERE br.badge_id = b.badge_id
         AND br.requirement_sequence = rt.requirement_sequence
);


/* ============================================================
    12. ASSOCIACAO CONSULTOR <-> AREA
    ============================================================ */

INSERT INTO consultant_areas (user_id, area_id, is_primary)
SELECT
      c.user_id,
      a.area_id,
      v.is_primary
FROM (
      VALUES
      ('jferreira', 'low-code-automation-core', TRUE),
      ('jferreira', 'hybrid-cloud-advanced', FALSE),
      ('mrocha', 'data-ai-engineering-core', TRUE),
      ('mrocha', 'integration-api-advanced', FALSE),
      ('pcarvalho', 'project-management-core', TRUE),
      ('pcarvalho', 'people-leadership-advanced', FALSE)
) AS v(username, area_slug, is_primary)
JOIN users u
   ON u.username = v.username
JOIN consultants c
   ON c.user_id = u.user_id
JOIN areas a
   ON a.area_slug = v.area_slug
ON CONFLICT (user_id, area_id) DO NOTHING;


/* ============================================================
    13. CANDIDATURAS A BADGES
    ============================================================ */

INSERT INTO badge_applications
(badge_id, user_id, application_state, submitted_at)
SELECT
      b.badge_id,
      c.user_id,
      v.application_state,
      CASE
            WHEN v.application_state = 'Open' THEN NULL
            ELSE (now() - (COALESCE(v.days_ago, 0) * INTERVAL '1 day'))
      END AS submitted_at
FROM (
      VALUES
      ('jferreira', 'low-code-automation-core-junior', 'Submitted', 0),
      ('mrocha', 'data-ai-engineering-core-intermedio', 'Submitted', 2),
      ('pcarvalho', 'project-management-core-junior', 'Open', NULL),
      ('jferreira', 'hybrid-cloud-advanced-intermedio', 'In validation', 1)
) AS v(username, badge_slug, application_state, days_ago)
JOIN users u
   ON u.username = v.username
JOIN consultants c
   ON c.user_id = u.user_id
JOIN badges b
   ON b.badge_slug = v.badge_slug
WHERE NOT EXISTS (
      SELECT 1
      FROM badge_applications ba
      WHERE ba.user_id = c.user_id
         AND ba.badge_id = b.badge_id
         AND ba.application_state = v.application_state
);


/* ============================================================
    14. EVIDENCIAS SUBMETIDAS (1 APLICACAO COMPLETA)
    ============================================================ */

WITH target_app AS (
      SELECT
            ba.application_id,
            ba.badge_id
      FROM badge_applications ba
      JOIN users u
         ON u.user_id = ba.user_id
      JOIN badges b
         ON b.badge_id = ba.badge_id
      WHERE u.username = 'jferreira'
         AND b.badge_slug = 'low-code-automation-core-junior'
      ORDER BY ba.submitted_at DESC NULLS LAST, ba.application_id DESC
      LIMIT 1
),
evidence_seed(requirement_sequence, evidence_file_url, evidence_title, evidence_description) AS (
      VALUES
      (1, 'https://files.softinsa.pt/lca-r1.pdf', 'Fundamentos Low-Code',
       'Conclusao do percurso base de formacao.'),
      (2, 'https://files.softinsa.pt/lca-r2.pdf', 'Projeto Pratico',
       'Entrega de aplicacao com fluxo CRUD e validacoes.'),
      (3, 'https://files.softinsa.pt/lca-r3.pdf', 'Validacao Tecnica',
       'Avaliacao tecnica final com aprovacao formal.')
)
INSERT INTO requirements_evidences
(application_id, requirement_id,
 evidence_file_url, evidence_title,
 evidence_description)
SELECT
      ta.application_id,
      br.requirement_id,
            es.evidence_file_url,
            es.evidence_title,
            es.evidence_description
FROM target_app ta
JOIN badge_requirements br
   ON br.badge_id = ta.badge_id
JOIN evidence_seed es
      ON es.requirement_sequence = br.requirement_sequence
WHERE NOT EXISTS (
      SELECT 1
      FROM requirements_evidences re
      WHERE re.application_id = ta.application_id
         AND re.requirement_id = br.requirement_id
);


/* ============================================================
    15. LOGS DE VALIDACAO (TM + SLL)
    ============================================================ */

WITH target_app AS (
      SELECT
            ba.application_id,
            sl.service_line_id
      FROM badge_applications ba
      JOIN users u
         ON u.user_id = ba.user_id
      JOIN badges b
         ON b.badge_id = ba.badge_id
      JOIN areas a
         ON a.area_id = b.area_id
      JOIN service_lines sl
         ON sl.service_line_id = a.service_line_id
      WHERE u.username = 'jferreira'
         AND b.badge_slug = 'low-code-automation-core-junior'
      ORDER BY ba.submitted_at DESC NULLS LAST, ba.application_id DESC
      LIMIT 1
),
sll_validator AS (
      SELECT sll.user_id
      FROM target_app ta
      JOIN service_line_leaders sll
         ON sll.service_line_id = ta.service_line_id
      ORDER BY sll.user_id
      LIMIT 1
),
validators AS (
      SELECT
            u.user_id,
            'Talent Manager' AS validator_function,
            'Approve' AS validator_action,
            'Evidencias corretas e completas.' AS validations_comments
      FROM users u
      WHERE u.username = 'asilva'

      UNION ALL

      SELECT
            sv.user_id,
            'Service Line Leader' AS validator_function,
            'Approve' AS validator_action,
            'Badge aprovado para atribuicao.' AS validations_comments
      FROM sll_validator sv
)
INSERT INTO application_validation_logs
(application_id, user_id,
 validator_function, validator_action,
 validations_comments)
SELECT
      ta.application_id,
      v.user_id,
      v.validator_function,
      v.validator_action,
      v.validations_comments
FROM target_app ta
JOIN validators v
   ON TRUE
WHERE NOT EXISTS (
      SELECT 1
      FROM application_validation_logs avl
      WHERE avl.application_id = ta.application_id
         AND avl.user_id = v.user_id
         AND avl.validator_action = v.validator_action
);


/* ============================================================
    16. BADGE ATRIBUIDO AO CONSULTOR
    ============================================================ */

WITH target_award AS (
      SELECT
            ba.application_id,
            ba.user_id,
            b.badge_points
      FROM badge_applications ba
      JOIN users u
         ON u.user_id = ba.user_id
      JOIN badges b
         ON b.badge_id = ba.badge_id
      WHERE u.username = 'jferreira'
         AND b.badge_slug = 'low-code-automation-core-junior'
      ORDER BY ba.submitted_at DESC NULLS LAST, ba.application_id DESC
      LIMIT 1
)
INSERT INTO awarded_badges
(application_id, user_id,
 points_snapshot, public_verification_link,
 is_published, awarded_at)
SELECT
      ta.application_id,
      ta.user_id,
      ta.badge_points,
      'https://badges.softinsa.pt/verify/app-' || ta.application_id,
      TRUE,
      now()
FROM target_award ta
WHERE NOT EXISTS (
      SELECT 1
      FROM awarded_badges ab
      WHERE ab.application_id = ta.application_id
);


/* ============================================================
    17. HISTORICO DE PONTOS
    ============================================================ */

WITH awarded_ref AS (
      SELECT
            ab.user_id,
            ba.badge_id,
            b.badge_title,
            COALESCE(ab.points_snapshot, b.badge_points) AS points_delta
      FROM awarded_badges ab
      JOIN badge_applications ba
         ON ba.application_id = ab.application_id
      JOIN badges b
         ON b.badge_id = ba.badge_id
      JOIN users u
         ON u.user_id = ab.user_id
      WHERE u.username = 'jferreira'
         AND b.badge_slug = 'low-code-automation-core-junior'
      ORDER BY ab.awarded_at DESC, ab.awarded_badges_id DESC
      LIMIT 1
)
INSERT INTO points_history
(user_id, badge_id,
 points_delta, justification)
SELECT
      ar.user_id,
      ar.badge_id,
      ar.points_delta,
      'Atribuicao do badge ' || ar.badge_title
FROM awarded_ref ar
WHERE NOT EXISTS (
      SELECT 1
      FROM points_history ph
      WHERE ph.user_id = ar.user_id
         AND ph.badge_id = ar.badge_id
         AND ph.justification = 'Atribuicao do badge ' || ar.badge_title
);
