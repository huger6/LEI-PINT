
/* ============================================================
   1. DADOS BASE (LÍNGUAS E LOCALIZAÇÕES)
   ============================================================ */

INSERT INTO preferred_lang (preferred_lang) VALUES
('pt-PT'),
('en-GB'),
('es-ES');

INSERT INTO locations (location_name) VALUES
('Porto'),
('Lisboa'),
('Braga');


/* ============================================================
   2. UTILIZADORES BASE (ADMIN, CONSULTOR, TM, SLL)
   ============================================================ */

INSERT INTO users
(full_name, username, email_address, password_hash,
 user_role, preferred_lang_id, location_id,
 email_confirmed, force_password_change)
VALUES
-- Administrador
('Admin Softinsa', 'admin', 'admin@softinsa.pt',
 'hash_admin', 'Administrator', 1, 1, TRUE, FALSE),

-- Consultor
('João Ferreira', 'jferreira', 'joao.ferreira@softinsa.pt',
 'hash_consultor', 'Consultant', 1, 1, TRUE, FALSE),

-- Talent Manager
('Ana Silva', 'asilva', 'ana.silva@softinsa.pt',
 'hash_tm', 'Talent Manager', 2, 2, TRUE, FALSE),

-- Service Line Leader
('Carlos Mendes', 'cmendes', 'carlos.mendes@softinsa.pt',
 'hash_sll', 'Service Line Leader', 1, 1, TRUE, FALSE);


/* ============================================================
   3. PERFIS DERIVADOS DOS USERS
   ============================================================ */

-- Administrador
INSERT INTO administrators (user_id, is_super_admin)
VALUES (1, TRUE);

-- Consultor
INSERT INTO consultants (user_id, gdpr_accepted, biography)
VALUES
(2, TRUE, 'Consultor focado em desenvolvimento Low-Code.');

-- Talent Manager
INSERT INTO talent_managers (user_id, biography)
VALUES
(3, 'Responsável pela validação das evidências.');

-- Service Line Leader (ligação será ajustada após criar SL)
INSERT INTO service_line_leaders (user_id, service_line_id)
VALUES
(4, 1);


/* ============================================================
   4. LEARNING PATH
   ============================================================ */

INSERT INTO learning_paths
(path_title, path_slug, path_description, created_by)
VALUES
('Jornada Técnica', 'jornada-tecnica',
 'Learning Path técnico principal da Softinsa', 1);


/* ============================================================
   5. SERVICE LINE
   ============================================================ */

INSERT INTO services_lines
(learning_path_id, service_line_name, sl_slug,
 service_line_description, created_by)
VALUES
(1, 'Hybrid Cloud', 'hybrid-cloud',
 'Service Line de soluções Cloud e Low-Code', 1);

/* Atualizar Service Line Leader agora que a SL existe */
UPDATE service_line_leaders
SET service_line_id = 1
WHERE user_id = 4;


/* ============================================================
   6. ÁREA
   ============================================================ */

INSERT INTO areas
(service_line_id, area_name, area_slug,
 area_description, created_by)
VALUES
(1, 'Low-Code (OutSystems)', 'low-code-outsystems',
 'Área focada em desenvolvimento OutSystems', 1);


/* ============================================================
   7. CÓDIGOS DE NÍVEL (A–E)
   ============================================================ */

INSERT INTO stage_codes (stage_code) VALUES
('A'), -- Júnior
('B'), -- Intermédio
('C'), -- Sénior
('D'), -- Especialista
('E'); -- Líder


/* ============================================================
   8. NÍVEIS DE PROGRESSÃO
   ============================================================ */

INSERT INTO progression_stages
(area_id, stage_code_id, stage_title,
 stage_sequence, stage_description, created_by)
VALUES
(1, 1, 'Júnior', 1, 'Nível inicial de Outsystems', 1),
(1, 2, 'Intermédio', 2, 'Nível intermédio de Outsystems', 1),
(1, 3, 'Sénior', 3, 'Nível sénior de Outsystems', 1);


/* ============================================================
   9. BADGES (UM POR NÍVEL)
   ============================================================ */

INSERT INTO badges
(progression_stage_id, area_id,
 badge_title, badge_slug, badge_type,
 badge_points, badge_description,
 expiration_duration_days, created_by)
VALUES
-- Badge Júnior
(1, 1,
 'OutSystems Júnior', 'outsystems-junior',
 'Standard', 100,
 'Badge de nível Júnior em OutSystems',
 NULL, 1),

-- Badge Intermédio
(2, 1,
 'OutSystems Intermédio', 'outsystems-intermedio',
 'Standard', 200,
 'Badge de nível Intermédio em OutSystems',
 NULL, 1);


/* ============================================================
   10. REQUISITOS DO BADGE JÚNIOR (A1–A3)
   ============================================================ */

INSERT INTO badge_requirements
(badge_id, progression_stage_id,
 requirement_title, requirement_sequence,
 requirement_description, created_by)
VALUES
(1, 1,
 'A1 – Fundamentos OutSystems', 1,
 'Curso introdutório (Udemy ou Outsystems)', 1),

(1, 1,
 'A2 – Aplicação CRUD', 2,
 'Desenvolvimento de uma aplicação simples', 1),

(1, 1,
 'A3 – Certificação Associate', 3,
 'Certificação oficial OutSystems Associate', 1);


/* ============================================================
   11. ASSOCIAÇÃO CONSULTOR ↔ ÁREA
   ============================================================ */

INSERT INTO consultant_areas (user_id, area_id, is_primary)
VALUES
(2, 1, TRUE);


/* ============================================================
   12. CANDIDATURA A BADGE (SUBMITTED)
   ============================================================ */

INSERT INTO badge_applications
(badge_id, user_id, application_state, submitted_at)
VALUES
(1, 2, 'Submitted', now());


/* ============================================================
   13. EVIDÊNCIAS SUBMETIDAS
   ============================================================ */

INSERT INTO requirements_evidences
(application_id, requirement_id,
 evidence_file_url, evidence_title,
 evidence_description)
VALUES
(1, 1,
 'https://files.softinsa.pt/a1.pdf',
 'Certificado Fundamentos',
 'Certificado de curso introdutório'),

(1, 2,
 'https://files.softinsa.pt/a2.pdf',
 'App CRUD',
 'Projeto CRUD simples em OutSystems'),

(1, 3,
 'https://files.softinsa.pt/a3.pdf',
 'Certificação Associate',
 'Certificação oficial OutSystems');


/* ============================================================
   14. LOGS DE VALIDAÇÃO (TM + SLL)
   ============================================================ */

INSERT INTO application_validation_logs
(application_id, user_id,
 validator_function, validator_action,
 validations_comments)
VALUES
-- Talent Manager valida evidências
(1, 3,
 'Talent Manager', 'Approve',
 'Evidências corretas e completas'),

-- Service Line Leader aprova badge
(1, 4,
 'Service Line Leader', 'Approve',
 'Badge aprovado para atribuição');


/* ============================================================
   15. BADGE ATRIBUÍDO AO CONSULTOR
   ============================================================ */

INSERT INTO awarded_badges
(application_id, user_id,
 points_snapshot, public_verification_link,
 is_published, awarded_at)
VALUES
(1, 2,
 100,
 'https://badges.softinsa.pt/verify/abc123',
 TRUE,
 now());


/* ============================================================
   16. HISTÓRICO DE PONTOS
   ============================================================ */

INSERT INTO points_history
(user_id, badge_id,
 points_delta, justification)
VALUES
(2, 1,
 100,
 'Atribuição do badge OutSystems Júnior');
