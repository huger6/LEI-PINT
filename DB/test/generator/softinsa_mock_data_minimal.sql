-- Minimal Softinsa mock data for PostgreSQL 18.
-- Run against a clean schema created from DB/PINT_SCRIPT.sql.
-- 1 LP, 1 SL, 1 Area, 5 stages, 5 badges, 1 Admin, 2 TM, 1 SLL, 3 Consultants.

BEGIN;

-- 1. Static Lookup Data

INSERT INTO languages (language_id, language_iso, language_name) VALUES (1, 'pt-PT', 'Português');
INSERT INTO languages (language_id, language_iso, language_name) VALUES (2, 'en-GB', 'English');
INSERT INTO languages (language_id, language_iso, language_name) VALUES (3, 'es-ES', 'Español');
INSERT INTO locations (location_id, location_name) VALUES (1, 'Lisboa');
INSERT INTO locations (location_id, location_name) VALUES (2, 'Tomar');
INSERT INTO locations (location_id, location_name) VALUES (3, 'Viseu');
INSERT INTO locations (location_id, location_name) VALUES (4, 'Vila Real');
INSERT INTO locations (location_id, location_name) VALUES (5, 'Fundão');
INSERT INTO locations (location_id, location_name) VALUES (6, 'Portalegre');
INSERT INTO locations (location_id, location_name) VALUES (7, 'Remote');
INSERT INTO stage_codes (stage_code_id, stage_code) VALUES (1, 'A');
INSERT INTO stage_codes (stage_code_id, stage_code) VALUES (2, 'B');
INSERT INTO stage_codes (stage_code_id, stage_code) VALUES (3, 'C');
INSERT INTO stage_codes (stage_code_id, stage_code) VALUES (4, 'D');
INSERT INTO stage_codes (stage_code_id, stage_code) VALUES (5, 'E');

-- 2. Core Users (1 Admin, 2 TM, 1 SLL, 3 Consultants = 7 users)

INSERT INTO users (user_id, full_name, username, email_address, password_hash, user_role, user_guid, phone_number, birthdate, profile_img_url, language_id, location_id, approved_by, is_active, email_confirmed, force_password_change, last_login_at, last_online, current_streak_days, created_at, updated_at) VALUES
(1, 'Admin Softinsa', 'admin.softinsa', 'admin.softinsa@softinsa.pt', '$2b$10$HeVPLvvIURQ2EyMdp3frJ.snlFd5F4EqF646Fss4f5LNBzoykYG9G', 'Administrator', '417371ac-d842-56d5-82d5-97121d5362c1'::uuid, '+351918898853', '1980-08-09'::date, NULL, 1, 1, NULL, TRUE, TRUE, FALSE, '2026-04-15T19:00:00+00:00'::timestamptz, '2026-04-15T20:06:00+00:00'::timestamptz, 39, '2024-07-27T21:15:00+00:00'::timestamptz, '2024-08-04T21:15:00+00:00'::timestamptz);

INSERT INTO users (user_id, full_name, username, email_address, password_hash, user_role, user_guid, phone_number, birthdate, profile_img_url, language_id, location_id, approved_by, is_active, email_confirmed, force_password_change, last_login_at, last_online, current_streak_days, created_at, updated_at) VALUES
(2, 'Bruno Santos', 'bruno.santos', 'bruno.santos@softinsatestplatform.pt', '$2b$10$HeVPLvvIURQ2EyMdp3frJ.snlFd5F4EqF646Fss4f5LNBzoykYG9G', 'Talent Manager', 'dd647bf7-d4e1-5e1b-9597-fdeb70046e79'::uuid, '+351927281355', '1974-02-06'::date, NULL, 1, 7, NULL, TRUE, TRUE, FALSE, '2026-04-16T03:00:00+00:00'::timestamptz, '2026-04-16T04:08:00+00:00'::timestamptz, 37, '2026-01-18T05:00:00+00:00'::timestamptz, '2026-04-02T05:00:00+00:00'::timestamptz);

INSERT INTO users (user_id, full_name, username, email_address, password_hash, user_role, user_guid, phone_number, birthdate, profile_img_url, language_id, location_id, approved_by, is_active, email_confirmed, force_password_change, last_login_at, last_online, current_streak_days, created_at, updated_at) VALUES
(3, 'Leonor Neves', 'leonor.neves', 'leonor.neves@softinsatestplatform.pt', '$2b$10$HeVPLvvIURQ2EyMdp3frJ.snlFd5F4EqF646Fss4f5LNBzoykYG9G', 'Talent Manager', '0276ed69-b2cc-50bc-9103-5c750fde41a5'::uuid, '+351988631383', '1990-12-13'::date, NULL, 1, 7, NULL, TRUE, TRUE, FALSE, '2026-04-07T03:00:00+00:00'::timestamptz, '2026-04-07T03:08:00+00:00'::timestamptz, 26, '2025-06-19T18:00:00+00:00'::timestamptz, '2025-08-15T18:00:00+00:00'::timestamptz);

INSERT INTO users (user_id, full_name, username, email_address, password_hash, user_role, user_guid, phone_number, birthdate, profile_img_url, language_id, location_id, approved_by, is_active, email_confirmed, force_password_change, last_login_at, last_online, current_streak_days, created_at, updated_at) VALUES
(4, 'Rita Antunes', 'rita.antunes', 'rita.antunes@softinsatestplatform.pt', '$2b$10$HeVPLvvIURQ2EyMdp3frJ.snlFd5F4EqF646Fss4f5LNBzoykYG9G', 'Service Line Leader', '935ba007-3d82-565d-90ac-9bca8e97e82a'::uuid, '+351961751423', '1990-02-21'::date, NULL, 2, 7, NULL, TRUE, TRUE, FALSE, '2026-05-08T21:00:00+00:00'::timestamptz, '2026-05-08T21:56:00+00:00'::timestamptz, 10, '2025-05-29T14:00:00+00:00'::timestamptz, '2025-06-11T14:00:00+00:00'::timestamptz);

INSERT INTO users (user_id, full_name, username, email_address, password_hash, user_role, user_guid, phone_number, birthdate, profile_img_url, language_id, location_id, approved_by, is_active, email_confirmed, force_password_change, last_login_at, last_online, current_streak_days, created_at, updated_at) VALUES
(5, 'Rita Soares', 'rita.soares', 'rita.soares@softinsatestplatform.pt', '$2b$10$HeVPLvvIURQ2EyMdp3frJ.snlFd5F4EqF646Fss4f5LNBzoykYG9G', 'Consultant', 'd65416db-3362-5c0b-9564-b09eefba080f'::uuid, '+351957646788', '1994-06-10'::date, NULL, 1, 6, NULL, TRUE, TRUE, FALSE, '2026-04-20T03:00:00+00:00'::timestamptz, '2026-04-20T04:00:00+00:00'::timestamptz, 20, '2024-06-10T00:30:00+00:00'::timestamptz, '2024-09-01T00:30:00+00:00'::timestamptz);

INSERT INTO users (user_id, full_name, username, email_address, password_hash, user_role, user_guid, phone_number, birthdate, profile_img_url, language_id, location_id, approved_by, is_active, email_confirmed, force_password_change, last_login_at, last_online, current_streak_days, created_at, updated_at) VALUES
(6, 'Diogo Castro', 'diogo.castro', 'diogo.castro@softinsatestplatform.pt', '$2b$10$HeVPLvvIURQ2EyMdp3frJ.snlFd5F4EqF646Fss4f5LNBzoykYG9G', 'Consultant', '0c0d8c72-c58a-5897-a35f-75a4fc509eb2'::uuid, '+351941896818', '1982-10-10'::date, NULL, 1, 4, NULL, TRUE, TRUE, FALSE, '2026-05-01T17:00:00+00:00'::timestamptz, '2026-05-01T18:01:00+00:00'::timestamptz, 38, '2025-05-03T12:30:00+00:00'::timestamptz, '2025-07-10T12:30:00+00:00'::timestamptz);

INSERT INTO users (user_id, full_name, username, email_address, password_hash, user_role, user_guid, phone_number, birthdate, profile_img_url, language_id, location_id, approved_by, is_active, email_confirmed, force_password_change, last_login_at, last_online, current_streak_days, created_at, updated_at) VALUES
(7, 'Joao Oliveira', 'joao.oliveira', 'joao.oliveira@softinsatestplatform.pt', '$2b$10$HeVPLvvIURQ2EyMdp3frJ.snlFd5F4EqF646Fss4f5LNBzoykYG9G', 'Consultant', 'fc4b5c1d-3846-5949-9aa4-863f8eaebe48'::uuid, '+351942669756', '1984-06-11'::date, NULL, 2, 5, NULL, TRUE, TRUE, FALSE, '2026-04-12T19:00:00+00:00'::timestamptz, '2026-04-12T20:04:00+00:00'::timestamptz, 33, '2025-10-25T12:15:00+00:00'::timestamptz, '2026-01-23T12:15:00+00:00'::timestamptz);

-- 3. Role-specific Profiles

INSERT INTO administrators (user_id, is_super_admin, location_id, interaction_id) VALUES (1, TRUE, 1, NULL);

INSERT INTO talent_managers (user_id, biography) VALUES (2, 'Talent manager responsible for evidence review, career development and skills governance.');
INSERT INTO talent_managers (user_id, biography) VALUES (3, 'Talent manager responsible for evidence review, career development and skills governance.');

INSERT INTO consultants (user_id, gdpr_accepted, biography) VALUES (5, TRUE, 'Softinsa consultant focused on hybrid cloud delivery and continuous skill progression.');
INSERT INTO consultants (user_id, gdpr_accepted, biography) VALUES (6, TRUE, 'Softinsa consultant focused on cloud delivery and continuous skill progression.');
INSERT INTO consultants (user_id, gdpr_accepted, biography) VALUES (7, TRUE, 'Softinsa consultant focused on automation and continuous skill progression.');

-- 4. Global Contexts

INSERT INTO gdpr_policies (policy_id, policy_type, version, policy_text, is_mandatory, is_active, updated_by, created_by, created_at, updated_at) VALUES (1, 'Privacy', '1.0', 'Política de Privacidade (RGPD) — Versão 1.0. A Softinsa protege os dados pessoais dos seus colaboradores conforme o RGPD.', TRUE, TRUE, 1, 1, '2026-01-21T12:00:00+00:00'::timestamptz, '2026-04-21T12:00:00+00:00'::timestamptz);
INSERT INTO gdpr_policies (policy_id, policy_type, version, policy_text, is_mandatory, is_active, updated_by, created_by, created_at, updated_at) VALUES (2, 'Terms', '1.0', 'Termos e Condições de Utilização — Versão 1.0. Ao utilizar a plataforma, o utilizador aceita os presentes termos.', TRUE, TRUE, 1, 1, '2026-01-31T12:00:00+00:00'::timestamptz, '2026-04-24T12:00:00+00:00'::timestamptz);
INSERT INTO gdpr_policies (policy_id, policy_type, version, policy_text, is_mandatory, is_active, updated_by, created_by, created_at, updated_at) VALUES (3, 'Cookies', '1.0', 'Política de Cookies — Versão 1.0. A plataforma utiliza apenas cookies estritamente necessários.', FALSE, TRUE, 1, 1, '2026-02-10T12:00:00+00:00'::timestamptz, '2026-04-27T12:00:00+00:00'::timestamptz);

INSERT INTO gdpr_consent_history (consent_id, user_id, policy_id, action, ip_address, user_agent, consented_at) VALUES (1, 5, 1, 'ACCEPTED', '10.0.189.95', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SoftinsaMock/1.0', '2024-06-10T00:49:00+00:00'::timestamptz);
INSERT INTO gdpr_consent_history (consent_id, user_id, policy_id, action, ip_address, user_agent, consented_at) VALUES (2, 5, 2, 'ACCEPTED', '10.0.166.188', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SoftinsaMock/1.0', '2024-06-10T00:58:00+00:00'::timestamptz);
INSERT INTO gdpr_consent_history (consent_id, user_id, policy_id, action, ip_address, user_agent, consented_at) VALUES (3, 6, 1, 'ACCEPTED', '10.0.47.135', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SoftinsaMock/1.0', '2025-05-03T12:35:00+00:00'::timestamptz);
INSERT INTO gdpr_consent_history (consent_id, user_id, policy_id, action, ip_address, user_agent, consented_at) VALUES (4, 6, 2, 'ACCEPTED', '10.0.48.95', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SoftinsaMock/1.0', '2025-05-03T12:34:00+00:00'::timestamptz);
INSERT INTO gdpr_consent_history (consent_id, user_id, policy_id, action, ip_address, user_agent, consented_at) VALUES (5, 7, 1, 'ACCEPTED', '10.0.37.56', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SoftinsaMock/1.0', '2025-10-25T12:29:00+00:00'::timestamptz);
INSERT INTO gdpr_consent_history (consent_id, user_id, policy_id, action, ip_address, user_agent, consented_at) VALUES (6, 7, 2, 'ACCEPTED', '10.0.49.93', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SoftinsaMock/1.0', '2025-10-25T12:36:00+00:00'::timestamptz);

INSERT INTO notification_definitions (definition_id, code, name, description, target_route, user_id) VALUES (1, 'HOME_DIGEST', 'Home digest', 'Daily activity summary', '/home', 1);
INSERT INTO notification_definitions (definition_id, code, name, description, target_route, user_id) VALUES (2, 'BADGE_AVAILABLE', 'Badge available', 'New badge available in an enrolled area', '/badges', 1);
INSERT INTO notification_definitions (definition_id, code, name, description, target_route, user_id) VALUES (3, 'APPLICATION_SUBMITTED', 'Application submitted', 'Application submitted for validation', '/applications', 1);
INSERT INTO notification_definitions (definition_id, code, name, description, target_route, user_id) VALUES (4, 'ACHIEVEMENT_UNLOCKED', 'Achievement unlocked', 'Achievement milestone reached', '/achievements', 1);
INSERT INTO notification_definitions (definition_id, code, name, description, target_route, user_id) VALUES (5, 'POINTS_AWARDED', 'Points awarded', 'Points added to consultant history', '/ranking', 1);
INSERT INTO notification_definitions (definition_id, code, name, description, target_route, user_id) VALUES (6, 'OBJECTIVE_DUE', 'Objective due', 'Goal reminder for a consultant', '/objectives', 1);
INSERT INTO notification_definitions (definition_id, code, name, description, target_route, user_id) VALUES (7, 'EVOLUTION_UPDATE', 'Evolution update', 'Progression trend notification', '/evolution', 1);
INSERT INTO notification_definitions (definition_id, code, name, description, target_route, user_id) VALUES (8, 'ANNOUNCEMENT_PUBLISHED', 'Announcement published', 'New platform announcement', '/announcements', 1);
INSERT INTO notification_definitions (definition_id, code, name, description, target_route, user_id) VALUES (9, 'SYSTEM_MESSAGE', 'System message', 'Operational platform message', '/notifications', 1);
INSERT INTO notification_definitions (definition_id, code, name, description, target_route, user_id) VALUES (10, 'APPLICATION_APPROVED', 'Application approved', 'Badge application approved', '/applications', 1);
INSERT INTO notification_definitions (definition_id, code, name, description, target_route, user_id) VALUES (11, 'APPLICATION_REJECTED', 'Application rejected', 'Badge application rejected', '/applications', 1);
INSERT INTO notification_definitions (definition_id, code, name, description, target_route, user_id) VALUES (12, 'BADGE_EXPIRING_SOON', 'Badge expiring soon', 'An awarded badge is close to expiring', '/badges', 1);
INSERT INTO notification_definitions (definition_id, code, name, description, target_route, user_id) VALUES (13, 'BADGE_EXPIRED', 'Badge expired', 'An awarded badge has expired', '/badges', 1);
INSERT INTO notification_definitions (definition_id, code, name, description, target_route, user_id) VALUES (14, 'SLA_BREACH', 'SLA breach', 'An SLA response time has been exceeded', '/notifications', 1);

INSERT INTO notification_preferences (preference_id, definition_id, send_email, send_push, is_enabled, trigger_before_value, trigger_before_unit, created_by, updated_by, created_at, updated_at) VALUES (1, 1, TRUE, TRUE, TRUE, NULL, NULL, 1, 1, '2026-04-01T12:00:00+00:00'::timestamptz, '2026-05-20T12:00:00+00:00'::timestamptz);
INSERT INTO notification_preferences (preference_id, definition_id, send_email, send_push, is_enabled, trigger_before_value, trigger_before_unit, created_by, updated_by, created_at, updated_at) VALUES (2, 2, TRUE, TRUE, TRUE, NULL, NULL, 1, 1, '2026-04-01T12:00:00+00:00'::timestamptz, '2026-05-13T12:00:00+00:00'::timestamptz);
INSERT INTO notification_preferences (preference_id, definition_id, send_email, send_push, is_enabled, trigger_before_value, trigger_before_unit, created_by, updated_by, created_at, updated_at) VALUES (3, 3, TRUE, TRUE, TRUE, NULL, NULL, 1, 1, '2026-04-01T12:00:00+00:00'::timestamptz, '2026-05-14T12:00:00+00:00'::timestamptz);
INSERT INTO notification_preferences (preference_id, definition_id, send_email, send_push, is_enabled, trigger_before_value, trigger_before_unit, created_by, updated_by, created_at, updated_at) VALUES (4, 4, TRUE, TRUE, TRUE, NULL, NULL, 1, 1, '2026-04-01T12:00:00+00:00'::timestamptz, '2026-05-14T12:00:00+00:00'::timestamptz);
INSERT INTO notification_preferences (preference_id, definition_id, send_email, send_push, is_enabled, trigger_before_value, trigger_before_unit, created_by, updated_by, created_at, updated_at) VALUES (5, 5, TRUE, TRUE, TRUE, NULL, NULL, 1, 1, '2026-04-01T12:00:00+00:00'::timestamptz, '2026-05-14T12:00:00+00:00'::timestamptz);
INSERT INTO notification_preferences (preference_id, definition_id, send_email, send_push, is_enabled, trigger_before_value, trigger_before_unit, created_by, updated_by, created_at, updated_at) VALUES (6, 6, TRUE, TRUE, TRUE, NULL, NULL, 1, 1, '2026-04-01T12:00:00+00:00'::timestamptz, '2026-05-17T12:00:00+00:00'::timestamptz);
INSERT INTO notification_preferences (preference_id, definition_id, send_email, send_push, is_enabled, trigger_before_value, trigger_before_unit, created_by, updated_by, created_at, updated_at) VALUES (7, 7, TRUE, TRUE, TRUE, NULL, NULL, 1, 1, '2026-04-01T12:00:00+00:00'::timestamptz, '2026-05-13T12:00:00+00:00'::timestamptz);
INSERT INTO notification_preferences (preference_id, definition_id, send_email, send_push, is_enabled, trigger_before_value, trigger_before_unit, created_by, updated_by, created_at, updated_at) VALUES (8, 8, TRUE, TRUE, TRUE, NULL, NULL, 1, 1, '2026-04-01T12:00:00+00:00'::timestamptz, '2026-05-19T12:00:00+00:00'::timestamptz);
INSERT INTO notification_preferences (preference_id, definition_id, send_email, send_push, is_enabled, trigger_before_value, trigger_before_unit, created_by, updated_by, created_at, updated_at) VALUES (9, 9, TRUE, TRUE, TRUE, NULL, NULL, 1, 1, '2026-04-01T12:00:00+00:00'::timestamptz, '2026-05-17T12:00:00+00:00'::timestamptz);
INSERT INTO notification_preferences (preference_id, definition_id, send_email, send_push, is_enabled, trigger_before_value, trigger_before_unit, created_by, updated_by, created_at, updated_at) VALUES (10, 10, TRUE, TRUE, TRUE, NULL, NULL, 1, 1, '2026-04-01T12:00:00+00:00'::timestamptz, '2026-05-15T12:00:00+00:00'::timestamptz);
INSERT INTO notification_preferences (preference_id, definition_id, send_email, send_push, is_enabled, trigger_before_value, trigger_before_unit, created_by, updated_by, created_at, updated_at) VALUES (11, 11, TRUE, TRUE, TRUE, NULL, NULL, 1, 1, '2026-04-01T12:00:00+00:00'::timestamptz, '2026-05-15T12:00:00+00:00'::timestamptz);
INSERT INTO notification_preferences (preference_id, definition_id, send_email, send_push, is_enabled, trigger_before_value, trigger_before_unit, created_by, updated_by, created_at, updated_at) VALUES (12, 12, TRUE, TRUE, TRUE, NULL, NULL, 1, 1, '2026-04-01T12:00:00+00:00'::timestamptz, '2026-05-14T12:00:00+00:00'::timestamptz);
INSERT INTO notification_preferences (preference_id, definition_id, send_email, send_push, is_enabled, trigger_before_value, trigger_before_unit, created_by, updated_by, created_at, updated_at) VALUES (13, 13, TRUE, TRUE, TRUE, NULL, NULL, 1, 1, '2026-04-01T12:00:00+00:00'::timestamptz, '2026-05-18T12:00:00+00:00'::timestamptz);
INSERT INTO notification_preferences (preference_id, definition_id, send_email, send_push, is_enabled, trigger_before_value, trigger_before_unit, created_by, updated_by, created_at, updated_at) VALUES (14, 14, TRUE, TRUE, TRUE, NULL, NULL, 1, 1, '2026-04-01T12:00:00+00:00'::timestamptz, '2026-05-17T12:00:00+00:00'::timestamptz);

-- 5. Core Platform Architecture (1 LP → 1 SL → 1 Area → 5 Stages → 5 Badges)

INSERT INTO learning_paths (learning_path_id, path_title, path_slug, path_description, img_url, is_active, created_by, updated_by, created_at, updated_at) VALUES (1, 'Hybrid Cloud Academy', 'hybrid-cloud-academy', 'Structured Softinsa path for hybrid cloud academy capabilities.', NULL, TRUE, 1, 1, '2025-11-22T12:00:00+00:00'::timestamptz, '2026-04-21T12:00:00+00:00'::timestamptz);

INSERT INTO service_lines (service_line_id, learning_path_id, service_line_name, sl_slug, service_line_description, img_url, is_active, created_by, updated_by, created_at, updated_at) VALUES (1, 1, 'Hybrid Cloud Delivery', 'hybrid-cloud-delivery', 'Service line for hybrid cloud delivery, mentoring and operational excellence.', NULL, TRUE, 1, 1, '2025-12-22T12:00:00+00:00'::timestamptz, '2026-05-01T12:00:00+00:00'::timestamptz);

INSERT INTO service_line_leaders (user_id, service_line_id, biography) VALUES (4, 1, 'Service Line Leader accountable for Hybrid Cloud Delivery capability growth.');

INSERT INTO areas (area_id, service_line_id, area_name, area_slug, area_description, img_url, is_active, created_by, updated_by, created_at, updated_at) VALUES (1, 1, 'Hybrid Cloud Core Delivery', 'hybrid-cloud-core-delivery', 'Area focused on core delivery practices within Hybrid Cloud.', NULL, TRUE, 1, 1, '2026-01-11T12:00:00+00:00'::timestamptz, '2026-05-11T12:00:00+00:00'::timestamptz);

INSERT INTO progression_stages (progression_stage_id, area_id, stage_code_id, stage_title, stage_sequence, stage_description, is_active, created_by, updated_by, created_at, updated_at) VALUES (1, 1, 1, 'Hybrid Cloud Foundation', 1, 'Builds supervised delivery capability and core terminology.', TRUE, 1, 1, '2026-02-01T12:00:00+00:00'::timestamptz, '2026-05-14T12:00:00+00:00'::timestamptz);
INSERT INTO progression_stages (progression_stage_id, area_id, stage_code_id, stage_title, stage_sequence, stage_description, is_active, created_by, updated_by, created_at, updated_at) VALUES (2, 1, 2, 'Hybrid Cloud Practitioner', 2, 'Delivers predictable work with growing technical autonomy.', TRUE, 1, 1, '2026-02-02T12:00:00+00:00'::timestamptz, '2026-05-15T12:00:00+00:00'::timestamptz);
INSERT INTO progression_stages (progression_stage_id, area_id, stage_code_id, stage_title, stage_sequence, stage_description, is_active, created_by, updated_by, created_at, updated_at) VALUES (3, 1, 3, 'Hybrid Cloud Advanced', 3, 'Handles complex scenarios and contributes reusable practices.', TRUE, 1, 1, '2026-02-03T12:00:00+00:00'::timestamptz, '2026-05-16T12:00:00+00:00'::timestamptz);
INSERT INTO progression_stages (progression_stage_id, area_id, stage_code_id, stage_title, stage_sequence, stage_description, is_active, created_by, updated_by, created_at, updated_at) VALUES (4, 1, 4, 'Hybrid Cloud Expert', 4, 'Leads technical direction and mentors delivery teams.', TRUE, 1, 1, '2026-02-04T12:00:00+00:00'::timestamptz, '2026-05-17T12:00:00+00:00'::timestamptz);
INSERT INTO progression_stages (progression_stage_id, area_id, stage_code_id, stage_title, stage_sequence, stage_description, is_active, created_by, updated_by, created_at, updated_at) VALUES (5, 1, 5, 'Hybrid Cloud Principal', 5, 'Shapes strategy, governance and cross-team excellence.', TRUE, 1, 1, '2026-02-05T12:00:00+00:00'::timestamptz, '2026-05-18T12:00:00+00:00'::timestamptz);

INSERT INTO badges (badge_id, progression_stage_id, area_id, service_line_id, learning_path_id, badge_title, badge_slug, badge_type, badge_points, expiration_duration_days, badge_description, badge_img_url, is_active, created_by, updated_by, created_at, updated_at) VALUES (1, 1, 1, 1, 1, 'Hybrid Cloud Foundation Badge', 'hybrid-cloud-foundation-badge', 'Standard', 125, NULL, 'Recognizes validated capability in Hybrid Cloud at Foundation level.', NULL, TRUE, 1, 1, '2026-02-10T12:00:00+00:00'::timestamptz, '2026-05-01T12:00:00+00:00'::timestamptz);
INSERT INTO badges (badge_id, progression_stage_id, area_id, service_line_id, learning_path_id, badge_title, badge_slug, badge_type, badge_points, expiration_duration_days, badge_description, badge_img_url, is_active, created_by, updated_by, created_at, updated_at) VALUES (2, 2, 1, 1, 1, 'Hybrid Cloud Practitioner Badge', 'hybrid-cloud-practitioner-badge', 'Standard', 250, NULL, 'Recognizes validated capability in Hybrid Cloud at Practitioner level.', NULL, TRUE, 1, 1, '2026-02-10T12:00:00+00:00'::timestamptz, '2026-05-09T12:00:00+00:00'::timestamptz);
INSERT INTO badges (badge_id, progression_stage_id, area_id, service_line_id, learning_path_id, badge_title, badge_slug, badge_type, badge_points, expiration_duration_days, badge_description, badge_img_url, is_active, created_by, updated_by, created_at, updated_at) VALUES (3, 3, 1, 1, 1, 'Hybrid Cloud Advanced Badge', 'hybrid-cloud-advanced-badge', 'Standard', 375, NULL, 'Recognizes validated capability in Hybrid Cloud at Advanced level.', NULL, TRUE, 1, 1, '2026-02-10T12:00:00+00:00'::timestamptz, '2026-05-07T12:00:00+00:00'::timestamptz);
INSERT INTO badges (badge_id, progression_stage_id, area_id, service_line_id, learning_path_id, badge_title, badge_slug, badge_type, badge_points, expiration_duration_days, badge_description, badge_img_url, is_active, created_by, updated_by, created_at, updated_at) VALUES (4, 4, 1, 1, 1, 'Hybrid Cloud Expert Badge', 'hybrid-cloud-expert-badge', 'Standard', 500, NULL, 'Recognizes validated capability in Hybrid Cloud at Expert level.', NULL, TRUE, 1, 1, '2026-02-10T12:00:00+00:00'::timestamptz, '2026-05-18T12:00:00+00:00'::timestamptz);
INSERT INTO badges (badge_id, progression_stage_id, area_id, service_line_id, learning_path_id, badge_title, badge_slug, badge_type, badge_points, expiration_duration_days, badge_description, badge_img_url, is_active, created_by, updated_by, created_at, updated_at) VALUES (5, 5, 1, 1, 1, 'Hybrid Cloud Principal Badge', 'hybrid-cloud-principal-badge', 'Special', 625, 730, 'Recognizes validated capability in Hybrid Cloud at Principal level.', NULL, TRUE, 1, 1, '2026-02-10T12:00:00+00:00'::timestamptz, '2026-05-06T12:00:00+00:00'::timestamptz);

-- Badge Requirements (3 per badge = 15 total)

INSERT INTO badge_requirements (requirement_id, badge_id, progression_stage_id, requirement_title, requirement_sequence, requirement_description, badge_points, is_active, created_by, updated_by, created_at, updated_at) VALUES (1, 1, 1, 'Training Completion - Foundation', 1, 'Complete structured learning modules and knowledge checks.', 41, TRUE, 1, 1, '2026-02-15T12:00:00+00:00'::timestamptz, '2026-05-03T12:00:00+00:00'::timestamptz);
INSERT INTO badge_requirements (requirement_id, badge_id, progression_stage_id, requirement_title, requirement_sequence, requirement_description, badge_points, is_active, created_by, updated_by, created_at, updated_at) VALUES (2, 1, 1, 'Practical Delivery - Foundation', 2, 'Submit evidence from a real or simulated delivery scenario.', 41, TRUE, 1, 1, '2026-02-15T12:00:00+00:00'::timestamptz, '2026-05-09T12:00:00+00:00'::timestamptz);
INSERT INTO badge_requirements (requirement_id, badge_id, progression_stage_id, requirement_title, requirement_sequence, requirement_description, badge_points, is_active, created_by, updated_by, created_at, updated_at) VALUES (3, 1, 1, 'Peer Review - Foundation', 3, 'Receive validation from a reviewer with relevant platform expertise.', 41, TRUE, 1, 1, '2026-02-15T12:00:00+00:00'::timestamptz, '2026-05-04T12:00:00+00:00'::timestamptz);

INSERT INTO badge_requirements (requirement_id, badge_id, progression_stage_id, requirement_title, requirement_sequence, requirement_description, badge_points, is_active, created_by, updated_by, created_at, updated_at) VALUES (4, 2, 2, 'Training Completion - Practitioner', 1, 'Complete structured learning modules and knowledge checks.', 83, TRUE, 1, 1, '2026-02-15T12:00:00+00:00'::timestamptz, '2026-05-12T12:00:00+00:00'::timestamptz);
INSERT INTO badge_requirements (requirement_id, badge_id, progression_stage_id, requirement_title, requirement_sequence, requirement_description, badge_points, is_active, created_by, updated_by, created_at, updated_at) VALUES (5, 2, 2, 'Practical Delivery - Practitioner', 2, 'Submit evidence from a real or simulated delivery scenario.', 83, TRUE, 1, 1, '2026-02-15T12:00:00+00:00'::timestamptz, '2026-05-18T12:00:00+00:00'::timestamptz);
INSERT INTO badge_requirements (requirement_id, badge_id, progression_stage_id, requirement_title, requirement_sequence, requirement_description, badge_points, is_active, created_by, updated_by, created_at, updated_at) VALUES (6, 2, 2, 'Peer Review - Practitioner', 3, 'Receive validation from a reviewer with relevant platform expertise.', 83, TRUE, 1, 1, '2026-02-15T12:00:00+00:00'::timestamptz, '2026-05-17T12:00:00+00:00'::timestamptz);

INSERT INTO badge_requirements (requirement_id, badge_id, progression_stage_id, requirement_title, requirement_sequence, requirement_description, badge_points, is_active, created_by, updated_by, created_at, updated_at) VALUES (7, 3, 3, 'Training Completion - Advanced', 1, 'Complete structured learning modules and knowledge checks.', 125, TRUE, 1, 1, '2026-02-15T12:00:00+00:00'::timestamptz, '2026-05-03T12:00:00+00:00'::timestamptz);
INSERT INTO badge_requirements (requirement_id, badge_id, progression_stage_id, requirement_title, requirement_sequence, requirement_description, badge_points, is_active, created_by, updated_by, created_at, updated_at) VALUES (8, 3, 3, 'Practical Delivery - Advanced', 2, 'Submit evidence from a real or simulated delivery scenario.', 125, TRUE, 1, 1, '2026-02-15T12:00:00+00:00'::timestamptz, '2026-05-09T12:00:00+00:00'::timestamptz);
INSERT INTO badge_requirements (requirement_id, badge_id, progression_stage_id, requirement_title, requirement_sequence, requirement_description, badge_points, is_active, created_by, updated_by, created_at, updated_at) VALUES (9, 3, 3, 'Peer Review - Advanced', 3, 'Receive validation from a reviewer with relevant platform expertise.', 125, TRUE, 1, 1, '2026-02-15T12:00:00+00:00'::timestamptz, '2026-05-20T12:00:00+00:00'::timestamptz);

INSERT INTO badge_requirements (requirement_id, badge_id, progression_stage_id, requirement_title, requirement_sequence, requirement_description, badge_points, is_active, created_by, updated_by, created_at, updated_at) VALUES (10, 4, 4, 'Training Completion - Expert', 1, 'Complete structured learning modules and knowledge checks.', 166, TRUE, 1, 1, '2026-02-15T12:00:00+00:00'::timestamptz, '2026-05-04T12:00:00+00:00'::timestamptz);
INSERT INTO badge_requirements (requirement_id, badge_id, progression_stage_id, requirement_title, requirement_sequence, requirement_description, badge_points, is_active, created_by, updated_by, created_at, updated_at) VALUES (11, 4, 4, 'Practical Delivery - Expert', 2, 'Submit evidence from a real or simulated delivery scenario.', 166, TRUE, 1, 1, '2026-02-15T12:00:00+00:00'::timestamptz, '2026-05-16T12:00:00+00:00'::timestamptz);
INSERT INTO badge_requirements (requirement_id, badge_id, progression_stage_id, requirement_title, requirement_sequence, requirement_description, badge_points, is_active, created_by, updated_by, created_at, updated_at) VALUES (12, 4, 4, 'Peer Review - Expert', 3, 'Receive validation from a reviewer with relevant platform expertise.', 166, TRUE, 1, 1, '2026-02-15T12:00:00+00:00'::timestamptz, '2026-05-11T12:00:00+00:00'::timestamptz);

INSERT INTO badge_requirements (requirement_id, badge_id, progression_stage_id, requirement_title, requirement_sequence, requirement_description, badge_points, is_active, created_by, updated_by, created_at, updated_at) VALUES (13, 5, 5, 'Training Completion - Principal', 1, 'Complete structured learning modules and knowledge checks.', 208, TRUE, 1, 1, '2026-02-15T12:00:00+00:00'::timestamptz, '2026-05-06T12:00:00+00:00'::timestamptz);
INSERT INTO badge_requirements (requirement_id, badge_id, progression_stage_id, requirement_title, requirement_sequence, requirement_description, badge_points, is_active, created_by, updated_by, created_at, updated_at) VALUES (14, 5, 5, 'Practical Delivery - Principal', 2, 'Submit evidence from a real or simulated delivery scenario.', 208, TRUE, 1, 1, '2026-02-15T12:00:00+00:00'::timestamptz, '2026-05-13T12:00:00+00:00'::timestamptz);
INSERT INTO badge_requirements (requirement_id, badge_id, progression_stage_id, requirement_title, requirement_sequence, requirement_description, badge_points, is_active, created_by, updated_by, created_at, updated_at) VALUES (15, 5, 5, 'Peer Review - Principal', 3, 'Receive validation from a reviewer with relevant platform expertise.', 208, TRUE, 1, 1, '2026-02-15T12:00:00+00:00'::timestamptz, '2026-05-18T12:00:00+00:00'::timestamptz);

-- Skills (subset of 10)

INSERT INTO skills (skills_id, skill_name, skill_description, created_by, updated_by, created_at, updated_at) VALUES (1, 'Python', 'Backend automation, APIs and data processing with Python.', 1, 1, '2026-02-20T12:00:00+00:00'::timestamptz, '2026-05-10T12:00:00+00:00'::timestamptz);
INSERT INTO skills (skills_id, skill_name, skill_description, created_by, updated_by, created_at, updated_at) VALUES (2, 'Java', 'Enterprise application development with the Java ecosystem.', 1, 1, '2026-02-20T12:00:00+00:00'::timestamptz, '2026-05-17T12:00:00+00:00'::timestamptz);
INSERT INTO skills (skills_id, skill_name, skill_description, created_by, updated_by, created_at, updated_at) VALUES (3, 'JavaScript', 'Modern browser and Node.js application development.', 1, 1, '2026-02-20T12:00:00+00:00'::timestamptz, '2026-05-16T12:00:00+00:00'::timestamptz);
INSERT INTO skills (skills_id, skill_name, skill_description, created_by, updated_by, created_at, updated_at) VALUES (4, 'Docker', 'Container packaging, local orchestration and runtime hygiene.', 1, 1, '2026-02-20T12:00:00+00:00'::timestamptz, '2026-05-15T12:00:00+00:00'::timestamptz);
INSERT INTO skills (skills_id, skill_name, skill_description, created_by, updated_by, created_at, updated_at) VALUES (5, 'Kubernetes', 'Cluster orchestration, deployments and service operations.', 1, 1, '2026-02-20T12:00:00+00:00'::timestamptz, '2026-05-08T12:00:00+00:00'::timestamptz);
INSERT INTO skills (skills_id, skill_name, skill_description, created_by, updated_by, created_at, updated_at) VALUES (6, 'AWS Cloud', 'Cloud-native architecture and managed services on AWS.', 1, 1, '2026-02-20T12:00:00+00:00'::timestamptz, '2026-05-18T12:00:00+00:00'::timestamptz);
INSERT INTO skills (skills_id, skill_name, skill_description, created_by, updated_by, created_at, updated_at) VALUES (7, 'Azure Cloud', 'Microsoft Azure architecture, governance and services.', 1, 1, '2026-02-20T12:00:00+00:00'::timestamptz, '2026-05-10T12:00:00+00:00'::timestamptz);
INSERT INTO skills (skills_id, skill_name, skill_description, created_by, updated_by, created_at, updated_at) VALUES (8, 'IBM Cloud', 'Hybrid cloud workloads and IBM Cloud services.', 1, 1, '2026-02-20T12:00:00+00:00'::timestamptz, '2026-05-08T12:00:00+00:00'::timestamptz);
INSERT INTO skills (skills_id, skill_name, skill_description, created_by, updated_by, created_at, updated_at) VALUES (9, 'Terraform', 'Infrastructure as code and repeatable cloud provisioning.', 1, 1, '2026-02-20T12:00:00+00:00'::timestamptz, '2026-05-19T12:00:00+00:00'::timestamptz);
INSERT INTO skills (skills_id, skill_name, skill_description, created_by, updated_by, created_at, updated_at) VALUES (10, 'Linux', 'Shell operations, service management and troubleshooting.', 1, 1, '2026-02-20T12:00:00+00:00'::timestamptz, '2026-05-15T12:00:00+00:00'::timestamptz);

-- 6. Intermediary and Mapping Tables

INSERT INTO consultant_areas (user_id, area_id, is_primary) VALUES (5, 1, TRUE);
INSERT INTO consultant_areas (user_id, area_id, is_primary) VALUES (6, 1, TRUE);
INSERT INTO consultant_areas (user_id, area_id, is_primary) VALUES (7, 1, TRUE);

INSERT INTO badge_skills (badge_id, skills_id) VALUES (1, 4);
INSERT INTO badge_skills (badge_id, skills_id) VALUES (1, 8);
INSERT INTO badge_skills (badge_id, skills_id) VALUES (2, 5);
INSERT INTO badge_skills (badge_id, skills_id) VALUES (2, 8);
INSERT INTO badge_skills (badge_id, skills_id) VALUES (3, 6);
INSERT INTO badge_skills (badge_id, skills_id) VALUES (3, 9);
INSERT INTO badge_skills (badge_id, skills_id) VALUES (4, 7);
INSERT INTO badge_skills (badge_id, skills_id) VALUES (4, 5);
INSERT INTO badge_skills (badge_id, skills_id) VALUES (5, 6);
INSERT INTO badge_skills (badge_id, skills_id) VALUES (5, 10);

INSERT INTO consultants_selected_skills (user_id, skills_id) VALUES (5, 4);
INSERT INTO consultants_selected_skills (user_id, skills_id) VALUES (5, 8);
INSERT INTO consultants_selected_skills (user_id, skills_id) VALUES (6, 5);
INSERT INTO consultants_selected_skills (user_id, skills_id) VALUES (6, 6);
INSERT INTO consultants_selected_skills (user_id, skills_id) VALUES (7, 9);
INSERT INTO consultants_selected_skills (user_id, skills_id) VALUES (7, 10);

-- 7. Transactions and Actions

-- Badge Applications (3 apps: 1 Accepted, 1 Submitted, 1 Open)

INSERT INTO badge_applications (application_id, badge_id, user_id, application_guid, application_state, consultant_notes, opened_at, submitted_at, closed_at) VALUES
(1, 1, 5, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 'Accepted', 'Completed all Foundation requirements.', '2026-03-01T10:00:00+00:00'::timestamptz, '2026-03-10T14:00:00+00:00'::timestamptz, '2026-03-20T16:00:00+00:00'::timestamptz);

INSERT INTO badge_applications (application_id, badge_id, user_id, application_guid, application_state, consultant_notes, opened_at, submitted_at, closed_at) VALUES
(2, 2, 6, 'b2c3d4e5-f6a7-8901-bcde-f12345678901'::uuid, 'Submitted', 'Practitioner evidence ready for review.', '2026-04-01T09:00:00+00:00'::timestamptz, '2026-04-15T11:00:00+00:00'::timestamptz, NULL);

INSERT INTO badge_applications (application_id, badge_id, user_id, application_guid, application_state, consultant_notes, opened_at, submitted_at, closed_at) VALUES
(3, 1, 7, 'c3d4e5f6-a7b8-9012-cdef-123456789012'::uuid, 'Open', NULL, '2026-05-01T08:00:00+00:00'::timestamptz, NULL, NULL);

-- Validation Logs

INSERT INTO application_validation_logs (validation_log_id, application_id, user_id, validator_function, validator_action, validations_comments, validated_at) VALUES
(1, 1, 2, 'Talent Manager', 'Forwarded to SLL', 'Evidence verified, forwarding to Service Line Leader.', '2026-03-14T10:00:00+00:00'::timestamptz);

INSERT INTO application_validation_logs (validation_log_id, application_id, user_id, validator_function, validator_action, validations_comments, validated_at) VALUES
(2, 1, 4, 'Service Line Leader', 'Accepted', 'All criteria met. Badge approved.', '2026-03-20T16:00:00+00:00'::timestamptz);

-- Evidence for accepted application (app 1, badge 1 has requirements 1-3)

INSERT INTO requirements_evidences (evidence_id, application_id, requirement_id, evidence_file_url, evidence_title, evidence_description, evidence_file_type, tm_reviewed, sll_reviewed, uploaded_at) VALUES
(1, 1, 1, '/uploads/evidences/app1_req1_training.pdf', 'Foundation Training Certificate', 'IBM Cloud Foundations course completion certificate.', 'application/pdf', TRUE, TRUE, '2026-03-08T12:00:00+00:00'::timestamptz);

INSERT INTO requirements_evidences (evidence_id, application_id, requirement_id, evidence_file_url, evidence_title, evidence_description, evidence_file_type, tm_reviewed, sll_reviewed, uploaded_at) VALUES
(2, 1, 2, '/uploads/evidences/app1_req2_delivery.pdf', 'Practical Delivery Report', 'Summary of cloud migration delivered under supervision.', 'application/pdf', TRUE, TRUE, '2026-03-09T09:00:00+00:00'::timestamptz);

INSERT INTO requirements_evidences (evidence_id, application_id, requirement_id, evidence_file_url, evidence_title, evidence_description, evidence_file_type, tm_reviewed, sll_reviewed, uploaded_at) VALUES
(3, 1, 3, '/uploads/evidences/app1_req3_review.pdf', 'Peer Review Sign-off', 'Technical peer review approval document.', 'application/pdf', TRUE, TRUE, '2026-03-09T14:00:00+00:00'::timestamptz);

-- Evidence for submitted application (app 2, badge 2 has requirements 4-6)

INSERT INTO requirements_evidences (evidence_id, application_id, requirement_id, evidence_file_url, evidence_title, evidence_description, evidence_file_type, tm_reviewed, sll_reviewed, uploaded_at) VALUES
(4, 2, 4, '/uploads/evidences/app2_req4_training.pdf', 'Practitioner Training Certificate', 'Kubernetes orchestration course completion.', 'application/pdf', FALSE, FALSE, '2026-04-12T10:00:00+00:00'::timestamptz);

INSERT INTO requirements_evidences (evidence_id, application_id, requirement_id, evidence_file_url, evidence_title, evidence_description, evidence_file_type, tm_reviewed, sll_reviewed, uploaded_at) VALUES
(5, 2, 5, '/uploads/evidences/app2_req5_delivery.pdf', 'Practitioner Delivery Report', 'Autonomous cloud deployment project summary.', 'application/pdf', FALSE, FALSE, '2026-04-13T11:00:00+00:00'::timestamptz);

INSERT INTO requirements_evidences (evidence_id, application_id, requirement_id, evidence_file_url, evidence_title, evidence_description, evidence_file_type, tm_reviewed, sll_reviewed, uploaded_at) VALUES
(6, 2, 6, '/uploads/evidences/app2_req6_review.pdf', 'Practitioner Peer Review', 'Peer review validation for practitioner level.', 'application/pdf', FALSE, FALSE, '2026-04-14T09:00:00+00:00'::timestamptz);

-- Awarded Badge (app 1 was Accepted)

INSERT INTO awarded_badges (awarded_badges_id, application_id, user_id, awarded_at, expiration_at, points_snapshot, public_verification_link, is_published, is_featured, display_order, last_expiry_alert_days) VALUES
(1, 1, 5, '2026-03-20T16:00:00+00:00'::timestamptz, NULL, 125, 'https://badges.softinsa.pt/verify/a1b2c3d4-e5f6-7890-abcd-ef1234567890', TRUE, TRUE, 1, NULL);

-- Certificate for the accepted application

INSERT INTO certificates (certificate_id, application_id, certificate_title, issuing_entity, issue_date, certificate_file_url, language_code) VALUES
(1, 1, 'IBM Cloud Foundations', 'IBM', '2026-02-28'::date, '/uploads/certificates/app1_ibm_foundations.pdf', 'en-GB');

-- Points History

INSERT INTO points_history (points_history_id, user_id, requirement_id, badge_id, points_delta, justification, created_at) VALUES
(1, 5, 1, 1, 41, 'Requirement 1 validated for Foundation badge.', '2026-03-20T16:01:00+00:00'::timestamptz);
INSERT INTO points_history (points_history_id, user_id, requirement_id, badge_id, points_delta, justification, created_at) VALUES
(2, 5, 2, 1, 41, 'Requirement 2 validated for Foundation badge.', '2026-03-20T16:02:00+00:00'::timestamptz);
INSERT INTO points_history (points_history_id, user_id, requirement_id, badge_id, points_delta, justification, created_at) VALUES
(3, 5, 3, 1, 41, 'Requirement 3 validated for Foundation badge.', '2026-03-20T16:03:00+00:00'::timestamptz);

-- Goals

INSERT INTO goals (goal_id, user_id, badge_id, application_id, event_title, event_description, event_start_date, event_end_date, reminder_at, reminder_sent, auto_reminder_sent, created_at, updated_at) VALUES
(1, 6, 2, 2, 'Complete Practitioner Badge', 'Finish all Practitioner level requirements and get approved.', '2026-04-01T09:00:00+00:00'::timestamptz, '2026-06-30T23:59:00+00:00'::timestamptz, '2026-06-15T09:00:00+00:00'::timestamptz, FALSE, FALSE, '2026-04-01T09:05:00+00:00'::timestamptz, '2026-04-01T09:05:00+00:00'::timestamptz);

INSERT INTO goals (goal_id, user_id, badge_id, application_id, event_title, event_description, event_start_date, event_end_date, reminder_at, reminder_sent, auto_reminder_sent, created_at, updated_at) VALUES
(2, 7, 1, 3, 'Submit Foundation Evidence', 'Upload all required files for Foundation badge application.', '2026-05-01T08:00:00+00:00'::timestamptz, '2026-07-31T23:59:00+00:00'::timestamptz, '2026-07-01T08:00:00+00:00'::timestamptz, FALSE, FALSE, '2026-05-01T08:05:00+00:00'::timestamptz, '2026-05-01T08:05:00+00:00'::timestamptz);

-- Badge Interactions

INSERT INTO user_badges_interactions (interaction_id, user_id, badge_id, interaction_type, interaction_date) VALUES
(1, 5, 1, 'VIEW', '2026-03-21T10:00:00+00:00'::timestamptz);
INSERT INTO user_badges_interactions (interaction_id, user_id, badge_id, interaction_type, interaction_date) VALUES
(2, 5, 1, 'SHARE_LINKEDIN', '2026-03-22T14:00:00+00:00'::timestamptz);
INSERT INTO user_badges_interactions (interaction_id, user_id, badge_id, interaction_type, interaction_date) VALUES
(3, 6, 2, 'VIEW', '2026-04-02T09:00:00+00:00'::timestamptz);
INSERT INTO user_badges_interactions (interaction_id, user_id, badge_id, interaction_type, interaction_date) VALUES
(4, 7, 1, 'FAVORITE', '2026-05-02T11:00:00+00:00'::timestamptz);

-- Notifications

INSERT INTO notifications (notification_id, user_id, definition_id, notification_payload, notification_url, notification_type, is_read, sent_at) VALUES
(1, 5, 10, 'Your application for Hybrid Cloud Foundation Badge has been approved!', '/badges/hybrid-cloud-foundation-badge', 'BADGES', TRUE, '2026-03-20T16:05:00+00:00'::timestamptz);
INSERT INTO notifications (notification_id, user_id, definition_id, notification_payload, notification_url, notification_type, is_read, sent_at) VALUES
(2, 5, 5, 'You earned 123 points for the Hybrid Cloud Foundation Badge!', '/ranking', 'POINTS', TRUE, '2026-03-20T16:06:00+00:00'::timestamptz);
INSERT INTO notifications (notification_id, user_id, definition_id, notification_payload, notification_url, notification_type, is_read, sent_at) VALUES
(3, 2, 3, 'Diogo Castro submitted an application for Hybrid Cloud Practitioner Badge.', '/applications', 'APPLICATIONS', FALSE, '2026-04-15T11:01:00+00:00'::timestamptz);

-- System Announcements

INSERT INTO system_announcements (announcement_id, announcement_title, announcement_message, starts_at, ends_at, announcement_type, is_global, is_active, created_by, updated_by, created_at, updated_at) VALUES
(1, 'Welcome to the Badge Platform', 'The Softinsa Badge Platform is now live! Start exploring your Learning Paths and earning badges.', '2026-01-01T00:00:00+00:00'::timestamptz, '2026-12-31T23:59:00+00:00'::timestamptz, 'Information', TRUE, TRUE, 1, 1, '2026-01-01T00:00:00+00:00'::timestamptz, '2026-01-01T00:00:00+00:00'::timestamptz);

INSERT INTO announc_roles (announcement_id, role_name) VALUES (1, 'Consultant');
INSERT INTO announc_roles (announcement_id, role_name) VALUES (1, 'Talent Manager');
INSERT INTO announc_roles (announcement_id, role_name) VALUES (1, 'Service Line Leader');
INSERT INTO announc_roles (announcement_id, role_name) VALUES (1, 'Administrator');

INSERT INTO announc_sl (announcement_id, service_line_id) VALUES (1, 1);

-- SLAs

INSERT INTO slas (sla_id, sla_name, response_time_hours, start_date, end_date, target_profile, is_global, is_active, sla_description, definition_id, user_id, created_by, updated_by, created_at, updated_at) VALUES
(1, 'TM Review SLA', 72, '2026-01-01T00:00:00+00:00'::timestamptz, '2026-12-31T23:59:00+00:00'::timestamptz, 'Talent Manager', TRUE, TRUE, 'Talent Managers must review submitted applications within 72 hours.', 14, NULL, 1, 1, '2026-01-01T00:00:00+00:00'::timestamptz, '2026-01-01T00:00:00+00:00'::timestamptz);

INSERT INTO slas (sla_id, sla_name, response_time_hours, start_date, end_date, target_profile, is_global, is_active, sla_description, definition_id, user_id, created_by, updated_by, created_at, updated_at) VALUES
(2, 'SLL Decision SLA', 48, '2026-01-01T00:00:00+00:00'::timestamptz, '2026-12-31T23:59:00+00:00'::timestamptz, 'Service Line Leader', FALSE, TRUE, 'Service Line Leaders must decide on applications within 48 hours.', 14, NULL, 1, 1, '2026-01-01T00:00:00+00:00'::timestamptz, '2026-01-01T00:00:00+00:00'::timestamptz);

INSERT INTO sl_slas (service_line_id, sla_id) VALUES (1, 2);

-- Rewards

INSERT INTO rewards (reward_id, badge_id, special_title, special_portrait_svg) VALUES (1, 5, 'Hybrid Cloud Principal Excellence', NULL);

-- 8. Sequence Resets

SELECT setval(pg_get_serial_sequence('languages', 'language_id'), (SELECT COALESCE(MAX(language_id), 1) FROM languages), true);
SELECT setval(pg_get_serial_sequence('locations', 'location_id'), (SELECT COALESCE(MAX(location_id), 1) FROM locations), true);
SELECT setval(pg_get_serial_sequence('stage_codes', 'stage_code_id'), (SELECT COALESCE(MAX(stage_code_id), 1) FROM stage_codes), true);
SELECT setval(pg_get_serial_sequence('users', 'user_id'), (SELECT COALESCE(MAX(user_id), 1) FROM users), true);
SELECT setval(pg_get_serial_sequence('gdpr_policies', 'policy_id'), (SELECT COALESCE(MAX(policy_id), 1) FROM gdpr_policies), true);
SELECT setval(pg_get_serial_sequence('gdpr_consent_history', 'consent_id'), (SELECT COALESCE(MAX(consent_id), 1) FROM gdpr_consent_history), true);
SELECT setval(pg_get_serial_sequence('notification_definitions', 'definition_id'), (SELECT COALESCE(MAX(definition_id), 1) FROM notification_definitions), true);
SELECT setval(pg_get_serial_sequence('notification_preferences', 'preference_id'), (SELECT COALESCE(MAX(preference_id), 1) FROM notification_preferences), true);
SELECT setval(pg_get_serial_sequence('slas', 'sla_id'), (SELECT COALESCE(MAX(sla_id), 1) FROM slas), true);
SELECT setval(pg_get_serial_sequence('system_announcements', 'announcement_id'), (SELECT COALESCE(MAX(announcement_id), 1) FROM system_announcements), true);
SELECT setval(pg_get_serial_sequence('learning_paths', 'learning_path_id'), (SELECT COALESCE(MAX(learning_path_id), 1) FROM learning_paths), true);
SELECT setval(pg_get_serial_sequence('service_lines', 'service_line_id'), (SELECT COALESCE(MAX(service_line_id), 1) FROM service_lines), true);
SELECT setval(pg_get_serial_sequence('areas', 'area_id'), (SELECT COALESCE(MAX(area_id), 1) FROM areas), true);
SELECT setval(pg_get_serial_sequence('progression_stages', 'progression_stage_id'), (SELECT COALESCE(MAX(progression_stage_id), 1) FROM progression_stages), true);
SELECT setval(pg_get_serial_sequence('badges', 'badge_id'), (SELECT COALESCE(MAX(badge_id), 1) FROM badges), true);
SELECT setval(pg_get_serial_sequence('badge_requirements', 'requirement_id'), (SELECT COALESCE(MAX(requirement_id), 1) FROM badge_requirements), true);
SELECT setval(pg_get_serial_sequence('skills', 'skills_id'), (SELECT COALESCE(MAX(skills_id), 1) FROM skills), true);
SELECT setval(pg_get_serial_sequence('goals', 'goal_id'), (SELECT COALESCE(MAX(goal_id), 1) FROM goals), true);
SELECT setval(pg_get_serial_sequence('badge_applications', 'application_id'), (SELECT COALESCE(MAX(application_id), 1) FROM badge_applications), true);
SELECT setval(pg_get_serial_sequence('requirements_evidences', 'evidence_id'), (SELECT COALESCE(MAX(evidence_id), 1) FROM requirements_evidences), true);
SELECT setval(pg_get_serial_sequence('application_validation_logs', 'validation_log_id'), (SELECT COALESCE(MAX(validation_log_id), 1) FROM application_validation_logs), true);
SELECT setval(pg_get_serial_sequence('awarded_badges', 'awarded_badges_id'), (SELECT COALESCE(MAX(awarded_badges_id), 1) FROM awarded_badges), true);
SELECT setval(pg_get_serial_sequence('certificates', 'certificate_id'), (SELECT COALESCE(MAX(certificate_id), 1) FROM certificates), true);
SELECT setval(pg_get_serial_sequence('points_history', 'points_history_id'), (SELECT COALESCE(MAX(points_history_id), 1) FROM points_history), true);
SELECT setval(pg_get_serial_sequence('rewards', 'reward_id'), (SELECT COALESCE(MAX(reward_id), 1) FROM rewards), true);
SELECT setval(pg_get_serial_sequence('notifications', 'notification_id'), (SELECT COALESCE(MAX(notification_id), 1) FROM notifications), true);
SELECT setval(pg_get_serial_sequence('user_badges_interactions', 'interaction_id'), (SELECT COALESCE(MAX(interaction_id), 1) FROM user_badges_interactions), true);
SELECT setval(pg_get_serial_sequence('sla_breach_alerts', 'alert_id'), (SELECT COALESCE(MAX(alert_id), 1) FROM sla_breach_alerts), true);

COMMIT;
