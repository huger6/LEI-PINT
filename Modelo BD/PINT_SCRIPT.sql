/*==============================================================*/
/* dbms name:      PostgreSQL 18                               */
/* Created ON:     24/03/2026 23:18:08                          */
/*==============================================================*/

DROP INDEX IF EXISTS ADMINISTRATORS_PK CASCADE;
DROP TABLE IF EXISTS administrators CASCADE;
DROP INDEX IF EXISTS ANNOUNC_SL_PK CASCADE;
DROP TABLE IF EXISTS announc_sl CASCADE;
DROP INDEX IF EXISTS USERS_VALIDATIONS_FK CASCADE;
DROP INDEX IF EXISTS APPLICATIONS_VALIDATIONS_FK CASCADE;
DROP INDEX IF EXISTS APPLICATION_VALIDATION_LOGS_PK CASCADE;
DROP TABLE IF EXISTS application_validation_logs CASCADE;
DROP INDEX IF EXISTS AREA_UPDATEDBY_FK CASCADE;
DROP INDEX IF EXISTS AREA_CREATEDBY_FK CASCADE;
DROP INDEX IF EXISTS SL_AREAS_FK CASCADE;
DROP INDEX IF EXISTS AREAS_PK CASCADE;
DROP TABLE IF EXISTS areas CASCADE;
DROP INDEX IF EXISTS VALIDATIONS_AWARDED_FK CASCADE;
DROP INDEX IF EXISTS AWARDED_APPLICATIONS2_FK CASCADE;
DROP INDEX IF EXISTS CONS_AWARDED_FK CASCADE;
DROP INDEX IF EXISTS AWARDED_BADGES_PK CASCADE;
DROP TABLE IF EXISTS awarded_badges CASCADE;
DROP INDEX IF EXISTS BADGES_UPDATEDBY_FK CASCADE;
DROP INDEX IF EXISTS BADGES_CREATEDBY_FK CASCADE;
DROP INDEX IF EXISTS GOALS2_FK CASCADE;
DROP INDEX IF EXISTS BADGES_INTERACTIONS2_FK CASCADE;
DROP INDEX IF EXISTS AREA_BADGES_FK CASCADE;
DROP INDEX IF EXISTS STAGES_BADGES2_FK CASCADE;
DROP INDEX IF EXISTS BADGES_PK CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP INDEX IF EXISTS AWARDED_APPLICATIONS_FK CASCADE;
DROP INDEX IF EXISTS APPLICATIONS_CERTIFICATES_FK CASCADE;
DROP INDEX IF EXISTS TIMELINES_APPLICATIONS2_FK CASCADE;
DROP INDEX IF EXISTS CONS_APLLICATIONS_FK CASCADE;
DROP INDEX IF EXISTS BADGES_APPLICATIONS_FK CASCADE;
DROP INDEX IF EXISTS BADGE_APPLICATIONS_PK CASCADE;
DROP TABLE IF EXISTS badge_applications CASCADE;
DROP INDEX IF EXISTS BADGES_REQUIREMENTS_FK CASCADE;
DROP INDEX IF EXISTS STAGES_REQUIREMENTS_FK CASCADE;
DROP INDEX IF EXISTS BADGE_REQUIREMENTS_PK CASCADE;
DROP TABLE IF EXISTS badge_requirements CASCADE;
DROP INDEX IF EXISTS APPLICATIONS_CERTIFICATES2_FK CASCADE;
DROP INDEX IF EXISTS CERTIFICATES_PK CASCADE;
DROP TABLE IF EXISTS certificates CASCADE;
DROP INDEX IF EXISTS CONSULTANTS_PK CASCADE;
DROP TABLE IF EXISTS consultants CASCADE;
DROP INDEX IF EXISTS CONSULTANTS_SELECTED_SKILLS_PK CASCADE;
DROP TABLE IF EXISTS consultants_selected_skills CASCADE;
DROP INDEX IF EXISTS CONSULTANT_AREAS_PK CASCADE;
DROP TABLE IF EXISTS consultant_areas CASCADE;
DROP INDEX IF EXISTS GDPR_CREATEDBY_FK CASCADE;
DROP INDEX IF EXISTS GDPR_UPDATEDBY_FK CASCADE;
DROP INDEX IF EXISTS GDPR_POLICIES_PK CASCADE;
DROP TABLE IF EXISTS gdpr_policies CASCADE;
DROP INDEX IF EXISTS GOALS_FK CASCADE;
DROP INDEX IF EXISTS TIMELINES_APPLICATIONS_FK CASCADE;
DROP INDEX IF EXISTS CONS_TIMELINES_FK CASCADE;
DROP INDEX IF EXISTS GOALS_PK CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP INDEX IF EXISTS LP_UPDATEDBY_FK CASCADE;
DROP INDEX IF EXISTS ADMIN_LP_FK CASCADE;
DROP INDEX IF EXISTS LEARNING_PATHS_PK CASCADE;
DROP TABLE IF EXISTS learning_paths CASCADE;
DROP INDEX IF EXISTS LOCATIONS_PK CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP INDEX IF EXISTS NOTIF_DEF_FK CASCADE;
DROP INDEX IF EXISTS USER_NOTIFICATIONS_FK CASCADE;
DROP INDEX IF EXISTS NOTIFICATIONS_PK CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP INDEX IF EXISTS NOT_DEF_PREF_FK CASCADE;
DROP INDEX IF EXISTS ADMIN_DEF_FK CASCADE;
DROP INDEX IF EXISTS NOTIFICATION_DEFINITIONS_PK CASCADE;
DROP TABLE IF EXISTS notification_definitions CASCADE;
DROP INDEX IF EXISTS NOT_PREFERENCES_UPDATEDBY_FK CASCADE;
DROP INDEX IF EXISTS NOT_PREFERENCES_CREATEDBY_FK CASCADE;
DROP INDEX IF EXISTS NOT_DEF_PREF2_FK CASCADE;
DROP INDEX IF EXISTS ANNOUNC_NOTIF2_FK CASCADE;
DROP INDEX IF EXISTS NOTIF_SLAS_FK CASCADE;
DROP INDEX IF EXISTS NOTIFICATE_TO_PK CASCADE;
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP INDEX IF EXISTS REQUIREMENTS_POINTS_FK CASCADE;
DROP INDEX IF EXISTS BADGES_POINTS_FK CASCADE;
DROP INDEX IF EXISTS CONS_POINTS_FK CASCADE;
DROP INDEX IF EXISTS POINTS_HISTORY_PK CASCADE;
DROP TABLE IF EXISTS points_history CASCADE;
DROP INDEX IF EXISTS PREFERRED_LANG_PK CASCADE;
DROP TABLE IF EXISTS preferred_lang CASCADE;
DROP INDEX IF EXISTS STAGES_UPDATEDBY_FK CASCADE;
DROP INDEX IF EXISTS STAGES_CREATEDBY_FK CASCADE;
DROP INDEX IF EXISTS STAGE_STAGECODES_FK CASCADE;
DROP INDEX IF EXISTS STAGES_BADGES_FK CASCADE;
DROP INDEX IF EXISTS AREAS_STAGES_FK CASCADE;
DROP INDEX IF EXISTS PROGRESSION_STAGES_PK CASCADE;
DROP TABLE IF EXISTS progression_stages CASCADE;
DROP INDEX IF EXISTS APPLICATIONS_EVIDENCES_FK CASCADE;
DROP INDEX IF EXISTS REQUIREMENTS_EVIDENCES_FK CASCADE;
DROP INDEX IF EXISTS REQUIREMENTS_EVIDENCES_PK CASCADE;
DROP TABLE IF EXISTS requirements_evidences CASCADE;
DROP INDEX IF EXISTS BADGE_REWARDS_FK CASCADE;
DROP INDEX IF EXISTS REWARDS_PK CASCADE;
DROP TABLE IF EXISTS rewards CASCADE;
DROP INDEX IF EXISTS SL_UPDATEDBY_FK CASCADE;
DROP INDEX IF EXISTS ADMIN_SL_FK CASCADE;
DROP INDEX IF EXISTS SL_LP_FK CASCADE;
DROP INDEX IF EXISTS SERVICES_LINES_PK CASCADE;
DROP TABLE IF EXISTS services_lines CASCADE;
DROP INDEX IF EXISTS SL_SLL_FK CASCADE;
DROP INDEX IF EXISTS SERVICE_LINE_LEADERS_PK CASCADE;
DROP TABLE IF EXISTS service_line_leaders CASCADE;
DROP INDEX IF EXISTS SKILLS_UPDATEDBY_FK CASCADE;
DROP INDEX IF EXISTS SKILLS_CREATEDBY_FK CASCADE;
DROP INDEX IF EXISTS BADGES_SKILLS_FK CASCADE;
DROP INDEX IF EXISTS SKILLS_PK CASCADE;
DROP TABLE IF EXISTS skills CASCADE;
DROP INDEX IF EXISTS SLAS_UPDATEDBY_FK CASCADE;
DROP INDEX IF EXISTS NOT_DEF_SLAS_FK CASCADE;
DROP INDEX IF EXISTS NOTIF_SLAS2_FK CASCADE;
DROP INDEX IF EXISTS USER_SLAS_FK CASCADE;
DROP INDEX IF EXISTS ADMIN_SLA_FK CASCADE;
DROP INDEX IF EXISTS SLA_DEFINITIONS_PK CASCADE;
DROP TABLE IF EXISTS slas CASCADE;
DROP INDEX IF EXISTS SL_SLAS_PK CASCADE;
DROP TABLE IF EXISTS sl_slas CASCADE;
DROP INDEX IF EXISTS STAGE_CODE_UPDATEDBY_FK CASCADE;
DROP INDEX IF EXISTS STAGE_CODE_CREATEDBY_FK CASCADE;
DROP INDEX IF EXISTS STAGE_CODES_PK CASCADE;
DROP TABLE IF EXISTS stage_codes CASCADE;
DROP INDEX IF EXISTS ANNOUNCEMENTS_UPDATEDBY_FK CASCADE;
DROP INDEX IF EXISTS ANNOUNC_NOTIF_FK CASCADE;
DROP INDEX IF EXISTS ANNOUNCEMENTS_ADMIN_FK CASCADE;
DROP INDEX IF EXISTS USER_ANNOUNCEMENTS_FK CASCADE;
DROP INDEX IF EXISTS SYSTEM_ANNOUNCEMENTS_PK CASCADE;
DROP TABLE IF EXISTS system_announcements CASCADE;
DROP INDEX IF EXISTS TALENT_MANAGERS_PK CASCADE;
DROP TABLE IF EXISTS talent_managers CASCADE;
DROP INDEX IF EXISTS LOCATION_USER_FK CASCADE;
DROP INDEX IF EXISTS USER_INTERACTIONS2_FK CASCADE;
DROP INDEX IF EXISTS LANG_USER_FK CASCADE;
DROP INDEX IF EXISTS USERS_PK CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP INDEX IF EXISTS BADGES_INTERACTIONS_FK CASCADE;
DROP INDEX IF EXISTS USER_INTERACTIONS_FK CASCADE;
DROP INDEX IF EXISTS USER_BADGES_INTERACTIONS_PK CASCADE;
DROP TABLE IF EXISTS user_badges_interactions CASCADE;

/*==============================================================*/
/* TABLE: areas                                                 */
/*==============================================================*/
CREATE TABLE IF NOT EXISTS areas (
   area_id              INTEGER GENERATED BY DEFAULT AS IDENTITY               NOT NULL,
   service_line_id      INTEGER                 NOT NULL,
   user_id              INTEGER                 NULL,
   adm_user_id          INTEGER                 NULL,
   area_name            VARCHAR(100)         NOT NULL,
   area_code            VARCHAR(20)          NULL,
   area_description     TEXT                 NULL,
   created_at           TIMESTAMPTZ          NOT NULL DEFAULT now(),
   updated_at           TIMESTAMPTZ          NOT NULL DEFAULT now(),
   img_url              VARCHAR(512)         NULL,
   area_slug            VARCHAR(512)         NOT NULL,
   is_active            BOOLEAN              NOT NULL DEFAULT TRUE,
   CONSTRAINT pk_areas PRIMARY KEY (area_id),
   CONSTRAINT ak_identifier_slug_areas UNIQUE (area_slug)
);

/*==============================================================*/
/* INDEX: AREAS_PK                                              */
/*==============================================================*/
CREATE UNIQUE INDEX IF NOT EXISTS AREAS_PK ON areas (area_id);

/*==============================================================*/
/* INDEX: SL_AREAS_FK                                           */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS SL_AREAS_FK ON areas (service_line_id);

/*==============================================================*/
/* INDEX: AREA_CREATEDBY_FK                                     */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS AREA_CREATEDBY_FK ON areas (user_id);

/*==============================================================*/
/* INDEX: AREA_UPDATEDBY_FK                                     */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS AREA_UPDATEDBY_FK ON areas (adm_user_id);

/*==============================================================*/
/* TABLE: learning_paths                                        */
/*==============================================================*/
CREATE TABLE IF NOT EXISTS learning_paths (
   learning_path_id     INTEGER GENERATED BY DEFAULT AS IDENTITY               NOT NULL,
   user_id              INTEGER                 NULL,
   adm_user_id          INTEGER                 NULL,
   path_title           VARCHAR(150)         NOT NULL,
   path_slug            VARCHAR(100)         NOT NULL,
   path_description     TEXT                 NULL,
   created_at           TIMESTAMPTZ          NOT NULL DEFAULT now(),
   updated_at           TIMESTAMPTZ          NOT NULL DEFAULT now(),
   img_url              VARCHAR(512)         NULL,
   is_active            BOOLEAN              NOT NULL DEFAULT TRUE,
   CONSTRAINT pk_learning_paths PRIMARY KEY (learning_path_id),
   CONSTRAINT ak_identifier_slug_learning UNIQUE (path_slug)
);

/*==============================================================*/
/* INDEX: LEARNING_PATHS_PK                                     */
/*==============================================================*/
CREATE UNIQUE INDEX IF NOT EXISTS LEARNING_PATHS_PK ON learning_paths (learning_path_id);

/*==============================================================*/
/* INDEX: ADMIN_LP_FK                                           */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS ADMIN_LP_FK ON learning_paths (user_id);

/*==============================================================*/
/* INDEX: LP_UPDATEDBY_FK                                       */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS LP_UPDATEDBY_FK ON learning_paths (adm_user_id);

/*==============================================================*/
/* TABLE: services_lines                                        */
/*==============================================================*/
CREATE TABLE IF NOT EXISTS services_lines (
   service_line_id      INTEGER GENERATED BY DEFAULT AS IDENTITY               NOT NULL,
   learning_path_id     INTEGER                 NOT NULL,
   user_id              INTEGER                 NULL,
   adm_user_id          INTEGER                 NULL,
   service_line_name    VARCHAR(100)         NOT NULL,
   service_line_description TEXT                 NULL,
   created_at           TIMESTAMPTZ          NOT NULL DEFAULT now(),
   updated_at           TIMESTAMPTZ          NOT NULL DEFAULT now(),
   img_url              VARCHAR(512)         NULL,
   sl_slug              VARCHAR(512)         NOT NULL,
   is_active            BOOLEAN              NOT NULL DEFAULT TRUE,
   CONSTRAINT pk_services_lines PRIMARY KEY (service_line_id),
   CONSTRAINT ak_identifier_slug_services_lines UNIQUE (sl_slug)
);

/*==============================================================*/
/* INDEX: SERVICES_LINES_PK                                     */
/*==============================================================*/
CREATE UNIQUE INDEX IF NOT EXISTS SERVICES_LINES_PK ON services_lines (service_line_id);

/*==============================================================*/
/* INDEX: SL_LP_FK                                              */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS SL_LP_FK ON services_lines (learning_path_id);

/*==============================================================*/
/* INDEX: ADMIN_SL_FK                                           */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS ADMIN_SL_FK ON services_lines (user_id);

/*==============================================================*/
/* INDEX: SL_UPDATEDBY_FK                                       */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS SL_UPDATEDBY_FK ON services_lines (adm_user_id);

/*==============================================================*/
/* TABLE: stage_codes                                           */
/*==============================================================*/
CREATE TABLE IF NOT EXISTS stage_codes (
   stage_code_id        INTEGER GENERATED BY DEFAULT AS IDENTITY               NOT NULL,
   user_id              INTEGER                 NULL,
   adm_user_id          INTEGER                 NULL,
   stage_code           VARCHAR(20)          NOT NULL,
   CONSTRAINT pk_stage_codes PRIMARY KEY (stage_code_id),
   CONSTRAINT ak_identifier_code_stage_co UNIQUE (stage_code)
);

/*==============================================================*/
/* INDEX: STAGE_CODES_PK                                        */
/*==============================================================*/
CREATE UNIQUE INDEX IF NOT EXISTS STAGE_CODES_PK ON stage_codes (stage_code_id);

/*==============================================================*/
/* INDEX: STAGE_CODE_CREATEDBY_FK                               */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS STAGE_CODE_CREATEDBY_FK ON stage_codes (user_id);

/*==============================================================*/
/* INDEX: STAGE_CODE_UPDATEDBY_FK                               */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS STAGE_CODE_UPDATEDBY_FK ON stage_codes (adm_user_id);

/*==============================================================*/
/* TABLE: progression_stages                                    */
/*==============================================================*/
CREATE TABLE IF NOT EXISTS progression_stages (
   progression_stage_id INTEGER GENERATED BY DEFAULT AS IDENTITY               NOT NULL,
   area_id              INTEGER                 NOT NULL,
   badge_id             INTEGER                 NULL,
   stage_code_id        INTEGER                 NOT NULL,
   user_id              INTEGER                 NULL,
   adm_user_id          INTEGER                 NULL,
   stage_title          VARCHAR(100)         NOT NULL,
   stage_sequence       INTEGER                 NULL,
   created_at           TIMESTAMPTZ          NOT NULL DEFAULT now(),
   updated_at           TIMESTAMPTZ          NOT NULL DEFAULT now(),
   stage_description    TEXT                 NULL,
   CONSTRAINT pk_progression_stages PRIMARY KEY (progression_stage_id)
);

/*==============================================================*/
/* INDEX: PROGRESSION_STAGES_PK                                 */
/*==============================================================*/
CREATE UNIQUE INDEX IF NOT EXISTS PROGRESSION_STAGES_PK ON progression_stages (progression_stage_id);

/*==============================================================*/
/* INDEX: AREAS_STAGES_FK                                       */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS AREAS_STAGES_FK ON progression_stages (area_id);

/*==============================================================*/
/* INDEX: STAGES_BADGES_FK                                      */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS STAGES_BADGES_FK ON progression_stages (badge_id);

/*==============================================================*/
/* INDEX: STAGE_STAGECODES_FK                                   */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS STAGE_STAGECODES_FK ON progression_stages (stage_code_id);

/*==============================================================*/
/* INDEX: STAGES_CREATEDBY_FK                                   */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS STAGES_CREATEDBY_FK ON progression_stages (user_id);

/*==============================================================*/
/* INDEX: STAGES_UPDATEDBY_FK                                   */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS STAGES_UPDATEDBY_FK ON progression_stages (adm_user_id);

/*==============================================================*/
/* TABLE: awarded_badges                                        */
/*==============================================================*/
CREATE TABLE IF NOT EXISTS awarded_badges (
   awarded_badges_id    INTEGER GENERATED BY DEFAULT AS IDENTITY               NOT NULL,
   validation_log_id    INTEGER                 NULL,
   application_id       INTEGER                 NOT NULL,
   user_id              INTEGER                 NULL,
   awarded_at           TIMESTAMPTZ          NOT NULL DEFAULT now(),
   is_published         BOOLEAN                 NOT NULL DEFAULT FALSE,
   public_verification_link VARCHAR(512)         NULL,
   expiration_at        TIMESTAMPTZ          NULL,
   points_snapshot      INTEGER                 NULL,
   is_featured          BOOLEAN                 NOT NULL DEFAULT FALSE,
   display_order        INTEGER                 NULL,
   CONSTRAINT pk_awarded_badges PRIMARY KEY (awarded_badges_id)
);

/*==============================================================*/
/* INDEX: AWARDED_BADGES_PK                                     */
/*==============================================================*/
CREATE UNIQUE INDEX IF NOT EXISTS AWARDED_BADGES_PK ON awarded_badges (awarded_badges_id);

/*==============================================================*/
/* INDEX: CONS_AWARDED_FK                                       */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS CONS_AWARDED_FK ON awarded_badges (user_id);

/*==============================================================*/
/* INDEX: AWARDED_APPLICATIONS2_FK                              */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS AWARDED_APPLICATIONS2_FK ON awarded_badges (application_id);

/*==============================================================*/
/* INDEX: VALIDATIONS_AWARDED_FK                                */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS VALIDATIONS_AWARDED_FK ON awarded_badges (validation_log_id);

/*==============================================================*/
/* TABLE: badges                                                */
/*==============================================================*/
CREATE TABLE IF NOT EXISTS badges (
   badge_id             INTEGER GENERATED BY DEFAULT AS IDENTITY               NOT NULL,
   goal_id              INTEGER                 NULL,
   interaction_id       INTEGER                 NULL,
   progression_stage_id INTEGER                 NOT NULL,
   area_id              INTEGER                 NOT NULL,
   user_id              INTEGER                 NULL,
   adm_user_id          INTEGER                 NULL,
   badge_title          VARCHAR(100)         NOT NULL,
   badge_description    TEXT                 NULL,
   badge_img_url        VARCHAR(512)         NULL,
   badge_slug           VARCHAR(100)         NOT NULL,
   badge_points         INTEGER                 NOT NULL,
   expiration_duration_days INTEGER                 NULL,
   created_at           TIMESTAMPTZ          NOT NULL DEFAULT now(),
   updated_at           TIMESTAMPTZ          NOT NULL DEFAULT now(),
   estimated_time_to_acquire TIME                 NULL,
   badge_type           VARCHAR(128)         NOT NULL
      CONSTRAINT ckc_badge_type_badges CHECK (badge_type IN ('Standard', 'Special')),
   CONSTRAINT pk_badges PRIMARY KEY (badge_id),
   CONSTRAINT ak_identifier_slug_badges UNIQUE (badge_slug)
);

/*==============================================================*/
/* INDEX: BADGES_PK                                             */
/*==============================================================*/
CREATE UNIQUE INDEX IF NOT EXISTS BADGES_PK ON badges (badge_id);

/*==============================================================*/
/* INDEX: STAGES_BADGES2_FK                                     */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS STAGES_BADGES2_FK ON badges (progression_stage_id);

/*==============================================================*/
/* INDEX: AREA_BADGES_FK                                        */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS AREA_BADGES_FK ON badges (area_id);

/*==============================================================*/
/* INDEX: BADGES_INTERACTIONS2_FK                               */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS BADGES_INTERACTIONS2_FK ON badges (interaction_id);

/*==============================================================*/
/* INDEX: GOALS2_FK                                             */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS GOALS2_FK ON badges (goal_id);

/*==============================================================*/
/* INDEX: BADGES_CREATEDBY_FK                                   */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS BADGES_CREATEDBY_FK ON badges (user_id);

/*==============================================================*/
/* INDEX: BADGES_UPDATEDBY_FK                                   */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS BADGES_UPDATEDBY_FK ON badges (adm_user_id);

/*==============================================================*/
/* TABLE: badge_applications                                    */
/*==============================================================*/
CREATE TABLE IF NOT EXISTS badge_applications (
   application_id       INTEGER GENERATED BY DEFAULT AS IDENTITY               NOT NULL,
   goal_id              INTEGER                 NULL,
   badge_id             INTEGER                 NOT NULL,
   certificate_id       INTEGER                 NULL,
   awarded_badges_id    INTEGER                 NULL,
   user_id              INTEGER                 NOT NULL,
   application_state    VARCHAR(50)          NOT NULL DEFAULT 'Open'
      CONSTRAINT ckc_application_state_badge_ap CHECK (application_state IN ('Open', 'Submitted', 'In validation', 'Closed')),
   submitted_at         TIMESTAMPTZ          NULL,
   closed_at            TIMESTAMPTZ          NULL,
   reviewer_notes       TEXT                 NULL,
   application_guid     UUID                 NOT NULL DEFAULT gen_random_uuid(),
   opened_at            TIMESTAMPTZ          NOT NULL DEFAULT now(),
   CONSTRAINT pk_badge_applications PRIMARY KEY (application_id),
   CONSTRAINT ak_application_guid_badge_applications UNIQUE (application_guid)
);

/*==============================================================*/
/* INDEX: BADGE_APPLICATIONS_PK                                 */
/*==============================================================*/
CREATE UNIQUE INDEX IF NOT EXISTS BADGE_APPLICATIONS_PK ON badge_applications (application_id);

/*==============================================================*/
/* INDEX: BADGES_APPLICATIONS_FK                                */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS BADGES_APPLICATIONS_FK ON badge_applications (badge_id);

/*==============================================================*/
/* INDEX: CONS_APLLICATIONS_FK                                  */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS CONS_APLLICATIONS_FK ON badge_applications (user_id);

/*==============================================================*/
/* INDEX: TIMELINES_APPLICATIONS2_FK                            */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS TIMELINES_APPLICATIONS2_FK ON badge_applications (goal_id);

/*==============================================================*/
/* INDEX: APPLICATIONS_CERTIFICATES_FK                          */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS APPLICATIONS_CERTIFICATES_FK ON badge_applications (certificate_id);

/*==============================================================*/
/* INDEX: AWARDED_APPLICATIONS_FK                               */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS AWARDED_APPLICATIONS_FK ON badge_applications (awarded_badges_id);

/*==============================================================*/
/* TABLE: application_validation_logs                           */
/*==============================================================*/
CREATE TABLE IF NOT EXISTS application_validation_logs (
   validation_log_id    INTEGER GENERATED BY DEFAULT AS IDENTITY               NOT NULL,
   user_id              INTEGER                 NULL,
   application_id       INTEGER                 NOT NULL,
   validator_function   VARCHAR(50)          NOT NULL,
   validator_action     VARCHAR(50)          NOT NULL,
   validations_comments TEXT                 NULL,
   validated_at         TIMESTAMPTZ          NOT NULL DEFAULT now(),
   CONSTRAINT pk_application_validation_logs PRIMARY KEY (validation_log_id)
);

/*==============================================================*/
/* INDEX: APPLICATION_VALIDATION_LOGS_PK                        */
/*==============================================================*/
CREATE UNIQUE INDEX IF NOT EXISTS APPLICATION_VALIDATION_LOGS_PK ON application_validation_logs (validation_log_id);

/*==============================================================*/
/* INDEX: APPLICATIONS_VALIDATIONS_FK                           */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS APPLICATIONS_VALIDATIONS_FK ON application_validation_logs (application_id);

/*==============================================================*/
/* INDEX: USERS_VALIDATIONS_FK                                  */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS USERS_VALIDATIONS_FK ON application_validation_logs (user_id);

/*==============================================================*/
/* TABLE: badge_requirements                                    */
/*==============================================================*/
CREATE TABLE IF NOT EXISTS badge_requirements (
   requirement_id       INTEGER GENERATED BY DEFAULT AS IDENTITY               NOT NULL,
   progression_stage_id INTEGER                 NOT NULL,
   badge_id             INTEGER                 NOT NULL,
   requirement_title    VARCHAR(150)         NOT NULL,
   requirement_description TEXT                 NOT NULL,
   requirement_img_url  VARCHAR(512)         NULL,
   requirement_sequence INTEGER                 NULL,
   created_at           TIMESTAMPTZ          NOT NULL DEFAULT now(),
   updated_at           TIMESTAMPTZ          NOT NULL DEFAULT now(),
   CONSTRAINT pk_badge_requirements PRIMARY KEY (requirement_id)
);

/*==============================================================*/
/* INDEX: BADGE_REQUIREMENTS_PK                                 */
/*==============================================================*/
CREATE UNIQUE INDEX IF NOT EXISTS BADGE_REQUIREMENTS_PK ON badge_requirements (requirement_id);

/*==============================================================*/
/* INDEX: STAGES_REQUIREMENTS_FK                                */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS STAGES_REQUIREMENTS_FK ON badge_requirements (progression_stage_id);

/*==============================================================*/
/* INDEX: BADGES_REQUIREMENTS_FK                                */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS BADGES_REQUIREMENTS_FK ON badge_requirements (badge_id);

/*==============================================================*/
/* TABLE: certificates                                          */
/*==============================================================*/
CREATE TABLE IF NOT EXISTS certificates (
   certificate_id       INTEGER GENERATED BY DEFAULT AS IDENTITY               NOT NULL,
   application_id       INTEGER                 NOT NULL,
   certificate_title    VARCHAR(150)         NOT NULL,
   issuing_entity       VARCHAR(150)         NULL,
   issue_date           DATE                 NULL,
   certificate_file_url VARCHAR(500)         NULL,
   CONSTRAINT pk_certificates PRIMARY KEY (certificate_id)
);

/*==============================================================*/
/* INDEX: CERTIFICATES_PK                                       */
/*==============================================================*/
CREATE UNIQUE INDEX IF NOT EXISTS CERTIFICATES_PK ON certificates (certificate_id);

/*==============================================================*/
/* INDEX: APPLICATIONS_CERTIFICATES2_FK                         */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS APPLICATIONS_CERTIFICATES2_FK ON certificates (application_id);

/*==============================================================*/
/* TABLE: gdpr_policies                                         */
/*==============================================================*/
CREATE TABLE IF NOT EXISTS gdpr_policies (
   policy_id            INTEGER GENERATED BY DEFAULT AS IDENTITY               NOT NULL,
   user_id              INTEGER                 NULL,
   adm_user_id          INTEGER                 NULL,
   policy_type          VARCHAR(50)          NOT NULL
      CONSTRAINT ckc_policy_type_gdpr CHECK (policy_type IN ('Privacy', 'Terms', 'Cookie')),
   policy_text          TEXT                 NULL,
   version              VARCHAR(30)          NOT NULL,
   is_mandatory         BOOLEAN              NOT NULL DEFAULT TRUE,
   is_active            BOOLEAN              NOT NULL DEFAULT TRUE,
   CONSTRAINT pk_gdpr_policies PRIMARY KEY (policy_id)
);

/*==============================================================*/
/* INDEX: GDPR_POLICIES_PK                                      */
/*==============================================================*/
CREATE UNIQUE INDEX IF NOT EXISTS GDPR_POLICIES_PK ON gdpr_policies (policy_id);

/*==============================================================*/
/* INDEX: GDPR_UPDATEDBY_FK                                     */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS GDPR_UPDATEDBY_FK ON gdpr_policies (user_id);

/*==============================================================*/
/* INDEX: GDPR_CREATEDBY_FK                                     */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS GDPR_CREATEDBY_FK ON gdpr_policies (adm_user_id);

/*==============================================================*/
/* TABLE: goals                                                 */
/*==============================================================*/
CREATE TABLE IF NOT EXISTS goals (
   goal_id              INTEGER GENERATED BY DEFAULT AS IDENTITY               NOT NULL,
   application_id       INTEGER                 NULL,
   badge_id             INTEGER                 NULL,
   user_id              INTEGER                 NULL,
   event_title          VARCHAR(150)         NOT NULL,
   event_description    TEXT                 NULL,
   event_start_date     TIMESTAMPTZ          NULL,
   event_end_date       TIMESTAMPTZ          NULL,
   reminder_at          TIMESTAMPTZ          NULL,
   CONSTRAINT pk_goals PRIMARY KEY (goal_id)
);

/*==============================================================*/
/* INDEX: GOALS_PK                                              */
/*==============================================================*/
CREATE UNIQUE INDEX IF NOT EXISTS GOALS_PK ON goals (goal_id);

/*==============================================================*/
/* INDEX: CONS_TIMELINES_FK                                     */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS CONS_TIMELINES_FK ON goals (user_id);

/*==============================================================*/
/* INDEX: TIMELINES_APPLICATIONS_FK                             */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS TIMELINES_APPLICATIONS_FK ON goals (application_id);

/*==============================================================*/
/* INDEX: GOALS_FK                                              */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS GOALS_FK ON goals (badge_id);

/*==============================================================*/
/* TABLE: locations                                             */
/*==============================================================*/
CREATE TABLE IF NOT EXISTS locations (
   location_id          INTEGER GENERATED BY DEFAULT AS IDENTITY               NOT NULL,
   location_name        VARCHAR(128)         NOT NULL,
   CONSTRAINT pk_locations PRIMARY KEY (location_id)
);

/*==============================================================*/
/* INDEX: LOCATIONS_PK                                          */
/*==============================================================*/
CREATE UNIQUE INDEX IF NOT EXISTS LOCATIONS_PK ON locations (location_id);

/*==============================================================*/
/* TABLE: notifications                                         */
/*==============================================================*/
CREATE TABLE IF NOT EXISTS notifications (
   notification_id      INTEGER GENERATED BY DEFAULT AS IDENTITY               NOT NULL,
   definition_id        INTEGER                 NOT NULL,
   user_id              INTEGER                 NOT NULL,
   notification_payload TEXT                 NULL,
   is_read              BOOLEAN                 NULL,
   sent_at              TIMESTAMPTZ          NOT NULL DEFAULT now(),
   notification_url     VARCHAR(512)         NULL,
   CONSTRAINT pk_notifications PRIMARY KEY (notification_id)
);

/*==============================================================*/
/* INDEX: NOTIFICATIONS_PK                                      */
/*==============================================================*/
CREATE UNIQUE INDEX IF NOT EXISTS NOTIFICATIONS_PK ON notifications (notification_id);

/*==============================================================*/
/* INDEX: USER_NOTIFICATIONS_FK                                 */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS USER_NOTIFICATIONS_FK ON notifications (user_id);

/*==============================================================*/
/* INDEX: NOTIF_DEF_FK                                          */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS NOTIF_DEF_FK ON notifications (definition_id);

/*==============================================================*/
/* TABLE: notification_definitions                              */
/*==============================================================*/
CREATE TABLE IF NOT EXISTS notification_definitions (
   definition_id        INTEGER GENERATED BY DEFAULT AS IDENTITY               NOT NULL,
   preference_id        INTEGER                 NULL,
   user_id              INTEGER                 NULL,
   code                 VARCHAR(128)         NOT NULL,
   name                 VARCHAR(256)         NOT NULL,
   description          TEXT                 NULL,
   CONSTRAINT pk_notification_definitions PRIMARY KEY (definition_id)
);

/*==============================================================*/
/* INDEX: NOTIFICATION_DEFINITIONS_PK                           */
/*==============================================================*/
CREATE UNIQUE INDEX IF NOT EXISTS NOTIFICATION_DEFINITIONS_PK ON notification_definitions (definition_id);

/*==============================================================*/
/* INDEX: ADMIN_DEF_FK                                          */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS ADMIN_DEF_FK ON notification_definitions (user_id);

/*==============================================================*/
/* INDEX: NOT_DEF_PREF_FK                                       */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS NOT_DEF_PREF_FK ON notification_definitions (preference_id);

/*==============================================================*/
/* TABLE: notification_preferences                              */
/*==============================================================*/
CREATE TABLE IF NOT EXISTS notification_preferences (
   preference_id        INTEGER GENERATED BY DEFAULT AS IDENTITY               NOT NULL,
   sla_id               INTEGER                 NULL,
   announcement_id      INTEGER                 NULL,
   definition_id        INTEGER                 NULL,
   user_id              INTEGER                 NULL,
   adm_user_id          INTEGER                 NULL,
   send_email           BOOLEAN                 NOT NULL,
   send_push            BOOLEAN                 NOT NULL,
   trigger_before_value INTEGER                 NULL,
   trigger_before_unit  VARCHAR(50)          NULL,
   is_enabled           BOOLEAN                 NOT NULL,
   CONSTRAINT pk_notification_preferences PRIMARY KEY (preference_id)
);

/*==============================================================*/
/* INDEX: NOTIFICATE_TO_PK                                      */
/*==============================================================*/
CREATE UNIQUE INDEX IF NOT EXISTS NOTIFICATE_TO_PK ON notification_preferences (preference_id);

/*==============================================================*/
/* INDEX: NOTIF_SLAS_FK                                         */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS NOTIF_SLAS_FK ON notification_preferences (sla_id);

/*==============================================================*/
/* INDEX: ANNOUNC_NOTIF2_FK                                     */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS ANNOUNC_NOTIF2_FK ON notification_preferences (announcement_id);

/*==============================================================*/
/* INDEX: NOT_DEF_PREF2_FK                                      */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS NOT_DEF_PREF2_FK ON notification_preferences (definition_id);

/*==============================================================*/
/* INDEX: NOT_PREFERENCES_CREATEDBY_FK                          */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS NOT_PREFERENCES_CREATEDBY_FK ON notification_preferences (user_id);

/*==============================================================*/
/* INDEX: NOT_PREFERENCES_UPDATEDBY_FK                          */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS NOT_PREFERENCES_UPDATEDBY_FK ON notification_preferences (adm_user_id);

/*==============================================================*/
/* TABLE: points_history                                        */
/*==============================================================*/
CREATE TABLE IF NOT EXISTS points_history (
   points_history_id    INTEGER GENERATED BY DEFAULT AS IDENTITY               NOT NULL,
   requirement_id       INTEGER                 NULL,
   badge_id             INTEGER                 NULL,
   user_id              INTEGER                 NOT NULL,
   points_delta         INTEGER                 NOT NULL,
   justification        TEXT                 NULL,
   CONSTRAINT pk_points_history PRIMARY KEY (points_history_id)
);

/*==============================================================*/
/* INDEX: POINTS_HISTORY_PK                                     */
/*==============================================================*/
CREATE UNIQUE INDEX IF NOT EXISTS POINTS_HISTORY_PK ON points_history (points_history_id);

/*==============================================================*/
/* INDEX: CONS_POINTS_FK                                        */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS CONS_POINTS_FK ON points_history (user_id);

/*==============================================================*/
/* INDEX: BADGES_POINTS_FK                                      */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS BADGES_POINTS_FK ON points_history (badge_id);

/*==============================================================*/
/* INDEX: REQUIREMENTS_POINTS_FK                                */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS REQUIREMENTS_POINTS_FK ON points_history (requirement_id);

/*==============================================================*/
/* TABLE: preferred_lang                                        */
/*==============================================================*/
CREATE TABLE IF NOT EXISTS preferred_lang (
   preferred_lang_id    INTEGER GENERATED BY DEFAULT AS IDENTITY               NOT NULL,
   preferred_lang       VARCHAR(10)          NOT NULL,
   CONSTRAINT pk_preferred_lang PRIMARY KEY (preferred_lang_id),
   CONSTRAINT ak_identifier_lang_preferre UNIQUE (preferred_lang)
);

/*==============================================================*/
/* INDEX: PREFERRED_LANG_PK                                     */
/*==============================================================*/
CREATE UNIQUE INDEX IF NOT EXISTS PREFERRED_LANG_PK ON preferred_lang (preferred_lang_id);

/*==============================================================*/
/* TABLE: requirements_evidences                                */
/*==============================================================*/
CREATE TABLE IF NOT EXISTS requirements_evidences (
   evidence_id          INTEGER GENERATED BY DEFAULT AS IDENTITY               NOT NULL,
   requirement_id       INTEGER                 NULL,
   application_id       INTEGER                 NOT NULL,
   evidence_file_url    VARCHAR(500)         NOT NULL,
   evidence_file_type   VARCHAR(100)         NULL,
   evidence_title       VARCHAR(150)         NULL,
   evidence_description TEXT                 NULL,
   uploaded_at          TIMESTAMPTZ          NOT NULL DEFAULT now(),
   tm_reviewed          BOOLEAN                 NULL,
   sll_reviewed         BOOLEAN                 NULL,
   CONSTRAINT pk_requirements_evidences PRIMARY KEY (evidence_id)
);

/*==============================================================*/
/* INDEX: REQUIREMENTS_EVIDENCES_PK                             */
/*==============================================================*/
CREATE UNIQUE INDEX IF NOT EXISTS REQUIREMENTS_EVIDENCES_PK ON requirements_evidences (evidence_id);

/*==============================================================*/
/* INDEX: REQUIREMENTS_EVIDENCES_FK                             */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS REQUIREMENTS_EVIDENCES_FK ON requirements_evidences (requirement_id);

/*==============================================================*/
/* INDEX: APPLICATIONS_EVIDENCES_FK                             */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS APPLICATIONS_EVIDENCES_FK ON requirements_evidences (application_id);

/*==============================================================*/
/* TABLE: rewards                                               */
/*==============================================================*/
CREATE TABLE IF NOT EXISTS rewards (
   reward_id            INTEGER GENERATED BY DEFAULT AS IDENTITY               NOT NULL,
   badge_id             INTEGER                 NULL,
   special_title        VARCHAR(255)         NULL,
   special_portrait_svg TEXT                 NULL,
   CONSTRAINT pk_rewards PRIMARY KEY (reward_id)
);

/*==============================================================*/
/* INDEX: REWARDS_PK                                            */
/*==============================================================*/
CREATE UNIQUE INDEX IF NOT EXISTS REWARDS_PK ON rewards (reward_id);

/*==============================================================*/
/* INDEX: BADGE_REWARDS_FK                                      */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS BADGE_REWARDS_FK ON rewards (badge_id);

/*==============================================================*/
/* TABLE: skills                                                */
/*==============================================================*/
CREATE TABLE IF NOT EXISTS skills (
   skills_id            INTEGER GENERATED BY DEFAULT AS IDENTITY               NOT NULL,
   badge_id             INTEGER                 NULL,
   user_id              INTEGER                 NULL,
   adm_user_id          INTEGER                 NULL,
   skill_name           VARCHAR(150)         NOT NULL,
   skill_description    TEXT                 NULL,
   created_at           TIMESTAMPTZ          NOT NULL DEFAULT now(),
   updated_at           TIMESTAMPTZ          NOT NULL DEFAULT now(),
   CONSTRAINT pk_skills PRIMARY KEY (skills_id)
);

/*==============================================================*/
/* INDEX: SKILLS_PK                                             */
/*==============================================================*/
CREATE UNIQUE INDEX IF NOT EXISTS SKILLS_PK ON skills (skills_id);

/*==============================================================*/
/* INDEX: BADGES_SKILLS_FK                                      */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS BADGES_SKILLS_FK ON skills (badge_id);

/*==============================================================*/
/* INDEX: SKILLS_CREATEDBY_FK                                   */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS SKILLS_CREATEDBY_FK ON skills (user_id);

/*==============================================================*/
/* INDEX: SKILLS_UPDATEDBY_FK                                   */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS SKILLS_UPDATEDBY_FK ON skills (adm_user_id);

/*==============================================================*/
/* TABLE: slas                                                  */
/*==============================================================*/
CREATE TABLE IF NOT EXISTS slas (
   sla_id               INTEGER GENERATED BY DEFAULT AS IDENTITY               NOT NULL,
   definition_id        INTEGER                 NULL,
   user_id              INTEGER                 NULL,
   preference_id        INTEGER                 NULL,
   adm_user_id          INTEGER                 NOT NULL,
   adm_user_id2         INTEGER                 NULL,
   sla_name             VARCHAR(100)         NOT NULL,
   sla_description      TEXT                 NULL,
   response_time_hours  INTEGER                 NOT NULL,
   created_at           TIMESTAMPTZ          NOT NULL DEFAULT now(),
   updated_at           TIMESTAMPTZ          NOT NULL DEFAULT now(),
   is_active            BOOLEAN              NOT NULL DEFAULT TRUE,
   target_profile       VARCHAR(128)         NULL
      CONSTRAINT ckc_target_profile_slas CHECK (target_profile IN ('Consultant', 'Talent Manager', 'Service Line Leader', 'Administrator')),
   is_global            BOOLEAN                 NULL,
   start_date           TIMESTAMPTZ          NOT NULL,
   end_date             TIMESTAMPTZ          NOT NULL,
   CONSTRAINT pk_slas PRIMARY KEY (sla_id)
);

/*==============================================================*/
/* INDEX: SLA_DEFINITIONS_PK                                    */
/*==============================================================*/
CREATE UNIQUE INDEX IF NOT EXISTS SLA_DEFINITIONS_PK ON slas (sla_id);

/*==============================================================*/
/* INDEX: ADMIN_SLA_FK                                          */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS ADMIN_SLA_FK ON slas (adm_user_id);

/*==============================================================*/
/* INDEX: USER_SLAS_FK                                          */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS USER_SLAS_FK ON slas (user_id);

/*==============================================================*/
/* INDEX: NOTIF_SLAS2_FK                                        */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS NOTIF_SLAS2_FK ON slas (preference_id);

/*==============================================================*/
/* INDEX: NOT_DEF_SLAS_FK                                       */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS NOT_DEF_SLAS_FK ON slas (definition_id);

/*==============================================================*/
/* INDEX: SLAS_UPDATEDBY_FK                                     */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS SLAS_UPDATEDBY_FK ON slas (adm_user_id2);

/*==============================================================*/
/* TABLE: sl_slas                                               */
/*==============================================================*/
CREATE TABLE IF NOT EXISTS sl_slas (
   service_line_id      INTEGER                 NOT NULL,
   sla_id               INTEGER                 NOT NULL,
   CONSTRAINT pk_sl_slas PRIMARY KEY (service_line_id, sla_id)
);

/*==============================================================*/
/* INDEX: SL_SLAS_PK                                            */
/*==============================================================*/
CREATE UNIQUE INDEX IF NOT EXISTS SL_SLAS_PK ON sl_slas (service_line_id, sla_id);

/*==============================================================*/
/* TABLE: system_announcements                                  */
/*==============================================================*/
CREATE TABLE IF NOT EXISTS system_announcements (
   announcement_id      INTEGER GENERATED BY DEFAULT AS IDENTITY               NOT NULL,
   user_id              INTEGER                 NULL,
   preference_id        INTEGER                 NOT NULL,
   adm_user_id          INTEGER                 NULL,
   adm_user_id2         INTEGER                 NULL,
   announcement_title   VARCHAR(150)         NOT NULL,
   announcement_message TEXT                 NOT NULL,
   is_active            BOOLEAN              NOT NULL DEFAULT TRUE,
   starts_at            TIMESTAMPTZ          NULL,
   ends_at              TIMESTAMPTZ          NULL,
   announcement_type    VARCHAR(128)         NULL,
   is_global            BOOLEAN                 NULL,
   target_profile       VARCHAR(128)         NULL
      CONSTRAINT ckc_target_profile_system_announcements CHECK (target_profile IN ('Consultant', 'Talent Manager', 'Service Line Leader', 'Administrator'))
   CONSTRAINT pk_system_announcements PRIMARY KEY (announcement_id),
);

/*==============================================================*/
/* INDEX: SYSTEM_ANNOUNCEMENTS_PK                               */
/*==============================================================*/
CREATE UNIQUE INDEX IF NOT EXISTS SYSTEM_ANNOUNCEMENTS_PK ON system_announcements (announcement_id);

/*==============================================================*/
/* INDEX: USER_ANNOUNCEMENTS_FK                                 */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS USER_ANNOUNCEMENTS_FK ON system_announcements (user_id);

/*==============================================================*/
/* INDEX: ANNOUNCEMENTS_ADMIN_FK                                */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS ANNOUNCEMENTS_ADMIN_FK ON system_announcements (adm_user_id);

/*==============================================================*/
/* INDEX: ANNOUNC_NOTIF_FK                                      */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS ANNOUNC_NOTIF_FK ON system_announcements (preference_id);

/*==============================================================*/
/* INDEX: ANNOUNCEMENTS_UPDATEDBY_FK                            */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS ANNOUNCEMENTS_UPDATEDBY_FK ON system_announcements (adm_user_id2);

/*==============================================================*/
/* TABLE: announc_sl                                            */
/*==============================================================*/
CREATE TABLE IF NOT EXISTS announc_sl (
   announcement_id      INTEGER                 NOT NULL,
   service_line_id      INTEGER                 NOT NULL,
   CONSTRAINT pk_announc_sl PRIMARY KEY (announcement_id, service_line_id)
);

/*==============================================================*/
/* INDEX: ANNOUNC_SL_PK                                         */
/*==============================================================*/
CREATE UNIQUE INDEX IF NOT EXISTS ANNOUNC_SL_PK ON announc_sl (announcement_id, service_line_id);

/*==============================================================*/
/* TABLE: administrators                                        */
/*==============================================================*/
CREATE TABLE IF NOT EXISTS administrators (
   user_id              INTEGER                 NOT NULL,
   preferred_lang_id    INTEGER                 NULL,
   location_id          INTEGER                 NULL,
   interaction_id       INTEGER                 NULL,
   is_super_admin       BOOLEAN                 NULL,
   CONSTRAINT pk_administrators PRIMARY KEY (user_id)
);

/*==============================================================*/
/* INDEX: ADMINISTRATORS_PK                                     */
/*==============================================================*/
CREATE UNIQUE INDEX IF NOT EXISTS ADMINISTRATORS_PK ON administrators (user_id);

/*==============================================================*/
/* TABLE: consultants                                           */
/*==============================================================*/
CREATE TABLE IF NOT EXISTS consultants (
   user_id              INTEGER                 NOT NULL,
   preferred_lang_id    INTEGER                 NULL,
   location_id          INTEGER                 NULL,
   interaction_id       INTEGER                 NULL,
   biography            TEXT                 NULL,
   gdpr_accepted        BOOLEAN                 NOT NULL,
   CONSTRAINT pk_consultants PRIMARY KEY (user_id)
);

/*==============================================================*/
/* INDEX: CONSULTANTS_PK                                        */
/*==============================================================*/
CREATE UNIQUE INDEX IF NOT EXISTS CONSULTANTS_PK ON consultants (user_id);

/*==============================================================*/
/* TABLE: consultants_selected_skills                           */
/*==============================================================*/
CREATE TABLE IF NOT EXISTS consultants_selected_skills (
   user_id              INTEGER                 NOT NULL,
   skills_id            INTEGER                 NOT NULL,
   CONSTRAINT pk_consultants_selected_skills PRIMARY KEY (user_id, skills_id)
);

/*==============================================================*/
/* INDEX: CONSULTANTS_SELECTED_SKILLS_PK                        */
/*==============================================================*/
CREATE UNIQUE INDEX IF NOT EXISTS CONSULTANTS_SELECTED_SKILLS_PK ON consultants_selected_skills (user_id, skills_id);

/*==============================================================*/
/* TABLE: consultant_areas                                      */
/*==============================================================*/
CREATE TABLE IF NOT EXISTS consultant_areas (
   user_id              INTEGER                 NOT NULL,
   area_id              INTEGER                 NOT NULL,
   is_primary           BOOLEAN                 NULL,
   CONSTRAINT pk_consultant_areas PRIMARY KEY (user_id, area_id)
);

/*==============================================================*/
/* INDEX: CONSULTANT_AREAS_PK                                   */
/*==============================================================*/
CREATE UNIQUE INDEX IF NOT EXISTS CONSULTANT_AREAS_PK ON consultant_areas (user_id, area_id);

/*==============================================================*/
/* TABLE: service_line_leaders                                  */
/*==============================================================*/
CREATE TABLE IF NOT EXISTS service_line_leaders (
   user_id              INTEGER                 NOT NULL,
   service_line_id      INTEGER                 NOT NULL,
   preferred_lang_id    INTEGER                 NULL,
   location_id          INTEGER                 NULL,
   interaction_id       INTEGER                 NULL,
   biography            TEXT                 NULL,
   CONSTRAINT pk_service_line_leaders PRIMARY KEY (user_id)
);

/*==============================================================*/
/* INDEX: SERVICE_LINE_LEADERS_PK                               */
/*==============================================================*/
CREATE UNIQUE INDEX IF NOT EXISTS SERVICE_LINE_LEADERS_PK ON service_line_leaders (user_id);

/*==============================================================*/
/* INDEX: SL_SLL_FK                                             */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS SL_SLL_FK ON service_line_leaders (service_line_id);

/*==============================================================*/
/* TABLE: talent_managers                                       */
/*==============================================================*/
CREATE TABLE IF NOT EXISTS talent_managers (
   user_id              INTEGER                 NOT NULL,
   preferred_lang_id    INTEGER                 NULL,
   location_id          INTEGER                 NULL,
   interaction_id       INTEGER                 NULL,
   biography            TEXT                 NULL,
   CONSTRAINT pk_talent_managers PRIMARY KEY (user_id)
);

/*==============================================================*/
/* INDEX: TALENT_MANAGERS_PK                                    */
/*==============================================================*/
CREATE UNIQUE INDEX IF NOT EXISTS TALENT_MANAGERS_PK ON talent_managers (user_id);

/*==============================================================*/
/* TABLE: users                                                 */
/*==============================================================*/
CREATE TABLE IF NOT EXISTS users (
   user_id              INTEGER GENERATED BY DEFAULT AS IDENTITY               NOT NULL,
   user_role            VARCHAR(50)          NOT NULL DEFAULT 'Consultant',
   preferred_lang_id    INTEGER                 NULL,
   location_id          INTEGER                 NULL,
   interaction_id       INTEGER                 NULL,
   email_address        VARCHAR(255)         NOT NULL,
   password_hash        VARCHAR(255)         NOT NULL,
   full_name            VARCHAR(150)         NOT NULL,
   username             VARCHAR(50)          NOT NULL,
   phone_number         VARCHAR(20)          NULL,
   is_active            BOOLEAN              NOT NULL DEFAULT TRUE,
   email_confirmed      BOOLEAN              NOT NULL DEFAULT FALSE,
   force_password_change BOOLEAN             NOT NULL DEFAULT TRUE,
   last_login_at        TIMESTAMPTZ          NULL,
   last_online          TIMESTAMPTZ          NULL,
   birthdate            DATE                 NULL,
   profile_img_url      VARCHAR(512)         NULL,
   CONSTRAINT pk_users PRIMARY KEY (user_id),
   CONSTRAINT ak_identifier_email_users UNIQUE (email_address),
   CONSTRAINT ak_identifier_usernam_users UNIQUE (username),
   CONSTRAINT ckc_user_role_users CHECK (user_role IN ('Consultant', 'Talent Manager', 'Service Line Leader', 'Administrator'))
);

/*==============================================================*/
/* INDEX: USERS_PK                                              */
/*==============================================================*/
CREATE UNIQUE INDEX IF NOT EXISTS USERS_PK ON users (user_id);

/*==============================================================*/
/* INDEX: LANG_USER_FK                                          */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS LANG_USER_FK ON users (preferred_lang_id);

/*==============================================================*/
/* INDEX: USER_INTERACTIONS2_FK                                 */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS USER_INTERACTIONS2_FK ON users (interaction_id);

/*==============================================================*/
/* INDEX: LOCATION_USER_FK                                      */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS LOCATION_USER_FK ON users (location_id);

/*==============================================================*/
/* TABLE: user_account_tokens                                   */
/*==============================================================*/
CREATE TABLE IF NOT EXISTS user_account_tokens (
   token_id                INTEGER GENERATED BY DEFAULT AS IDENTITY     NOT NULL,
   user_id                 INTEGER                                      NOT NULL,
   token_value             VARCHAR(255)                                 NOT NULL,

   --IS token to confirm account OR to reset password?
   token_type              VARCHAR(255)                                 NOT NULL,

   expires_at              TIMESTAMPTZ                                  NOT NULL,
   created_at              TIMESTAMPTZ                                  NOT NULL DEFAULT now(),
   is_used                 BOOLEAN                                      NOT NULL DEFAULT FALSE,

   CONSTRAINT pk_user_account_tokens PRIMARY KEY (token_id),
   CONSTRAINT ckc_token_type_user_tokens CHECK (token_type IN ('CONFIRMATION', 'PASSWORD_RESET'))
);

/*==============================================================*/
/* TABLE: user_refresh_tokens                                   */
/*==============================================================*/
CREATE TABLE IF NOT EXISTS user_refresh_tokens (
   token_id                INTEGER GENERATED BY DEFAULT AS IDENTITY     NOT NULL,
   user_id                 INTEGER                                      NOT NULL,
   token_value             VARCHAR(512)                                 NOT NULL,
   expires_at              TIMESTAMPTZ                                  NOT NULL,
   created_at              TIMESTAMPTZ                                  NOT NULL DEFAULT now(),

   CONSTRAINT pk_user_refresh_tokens PRIMARY KEY (token_id)
);

/*==============================================================*/
/* TABLE: user_badges_interactions                              */
/*==============================================================*/
CREATE TABLE IF NOT EXISTS user_badges_interactions (
   interaction_id       INTEGER GENERATED BY DEFAULT AS IDENTITY               NOT NULL,
   badge_id             INTEGER                 NOT NULL,
   user_id              INTEGER                 NOT NULL,
   DATE                 TIMESTAMPTZ          NOT NULL DEFAULT now(),
   type                 VARCHAR(150)         NOT NULL,
   CONSTRAINT pk_user_badges_interactions PRIMARY KEY (interaction_id)
);

/*==============================================================*/
/* INDEX: USER_BADGES_INTERACTIONS_PK                           */
/*==============================================================*/
CREATE UNIQUE INDEX IF NOT EXISTS USER_BADGES_INTERACTIONS_PK ON user_badges_interactions (interaction_id);

/*==============================================================*/
/* INDEX: USER_INTERACTIONS_FK                                  */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS USER_INTERACTIONS_FK ON user_badges_interactions (user_id);

/*==============================================================*/
/* INDEX: BADGES_INTERACTIONS_FK                                */
/*==============================================================*/
CREATE INDEX IF NOT EXISTS BADGES_INTERACTIONS_FK ON user_badges_interactions (badge_id);

ALTER TABLE administrators
   ADD CONSTRAINT fk_administ_users_inh_users FOREIGN KEY (user_id)
      REFERENCES users (user_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE announc_sl
   ADD CONSTRAINT fk_announc__announc_s_system_a FOREIGN KEY (announcement_id)
      REFERENCES system_announcements (announcement_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE announc_sl
   ADD CONSTRAINT fk_announc__announc_s_services FOREIGN KEY (service_line_id)
      REFERENCES services_lines (service_line_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE application_validation_logs
   ADD CONSTRAINT fk_applicat_applicati_badge_ap FOREIGN KEY (application_id)
      REFERENCES badge_applications (application_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE application_validation_logs
   ADD CONSTRAINT fk_applicat_users_val_users FOREIGN KEY (user_id)
      REFERENCES users (user_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE areas
   ADD CONSTRAINT fk_areas_area_crea_administ FOREIGN KEY (user_id)
      REFERENCES administrators (user_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE areas
   ADD CONSTRAINT fk_areas_area_upda_administ FOREIGN KEY (adm_user_id)
      REFERENCES administrators (user_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE areas
   ADD CONSTRAINT fk_areas_sl_areas_services FOREIGN KEY (service_line_id)
      REFERENCES services_lines (service_line_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE awarded_badges
   ADD CONSTRAINT fk_awarded__awarded_a_badge_ap FOREIGN KEY (application_id)
      REFERENCES badge_applications (application_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE awarded_badges
   ADD CONSTRAINT fk_awarded__cons_awar_consulta FOREIGN KEY (user_id)
      REFERENCES consultants (user_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE awarded_badges
   ADD CONSTRAINT fk_awarded__validatio_applicat FOREIGN KEY (validation_log_id)
      REFERENCES application_validation_logs (validation_log_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE badges
   ADD CONSTRAINT fk_badges_area_badg_areas FOREIGN KEY (area_id)
      REFERENCES areas (area_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE badges
   ADD CONSTRAINT fk_badges_badges_cr_administ FOREIGN KEY (user_id)
      REFERENCES administrators (user_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE badges
   ADD CONSTRAINT fk_badges_badges_in_user_bad FOREIGN KEY (interaction_id)
      REFERENCES user_badges_interactions (interaction_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE badges
   ADD CONSTRAINT fk_badges_badges_up_administ FOREIGN KEY (adm_user_id)
      REFERENCES administrators (user_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE badges
   ADD CONSTRAINT fk_badges_goals2_goals FOREIGN KEY (goal_id)
      REFERENCES goals (goal_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE badges
   ADD CONSTRAINT fk_badges_stages_ba_progress FOREIGN KEY (progression_stage_id)
      REFERENCES progression_stages (progression_stage_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE badge_applications
   ADD CONSTRAINT fk_badge_ap_applicati_certific FOREIGN KEY (certificate_id)
      REFERENCES certificates (certificate_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE badge_applications
   ADD CONSTRAINT fk_badge_ap_awarded_a_awarded_ FOREIGN KEY (awarded_badges_id)
      REFERENCES awarded_badges (awarded_badges_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE badge_applications
   ADD CONSTRAINT fk_badge_ap_badges_ap_badges FOREIGN KEY (badge_id)
      REFERENCES badges (badge_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE badge_applications
   ADD CONSTRAINT fk_badge_ap_cons_apll_consulta FOREIGN KEY (user_id)
      REFERENCES consultants (user_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE badge_applications
   ADD CONSTRAINT fk_badge_ap_timelines_goals FOREIGN KEY (goal_id)
      REFERENCES goals (goal_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE badge_requirements
   ADD CONSTRAINT fk_badge_re_badges_re_badges FOREIGN KEY (badge_id)
      REFERENCES badges (badge_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE badge_requirements
   ADD CONSTRAINT fk_badge_re_stages_re_progress FOREIGN KEY (progression_stage_id)
      REFERENCES progression_stages (progression_stage_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE certificates
   ADD CONSTRAINT fk_certific_applicati_badge_ap FOREIGN KEY (application_id)
      REFERENCES badge_applications (application_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE consultants
   ADD CONSTRAINT fk_consulta_users_inh_users FOREIGN KEY (user_id)
      REFERENCES users (user_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE consultants_selected_skills
   ADD CONSTRAINT fk_consulta_consultan_consulta FOREIGN KEY (user_id)
      REFERENCES consultants (user_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE consultants_selected_skills
   ADD CONSTRAINT fk_consulta_consultan_skills FOREIGN KEY (skills_id)
      REFERENCES skills (skills_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE consultant_areas
   ADD CONSTRAINT fk_consulta_consultan_consulta FOREIGN KEY (user_id)
      REFERENCES consultants (user_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE consultant_areas
   ADD CONSTRAINT fk_consulta_consultan_areas FOREIGN KEY (area_id)
      REFERENCES areas (area_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE gdpr_policies
   ADD CONSTRAINT fk_gdpr_pol_gdpr_crea_administ FOREIGN KEY (adm_user_id)
      REFERENCES administrators (user_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE gdpr_policies
   ADD CONSTRAINT fk_gdpr_pol_gdpr_upda_administ FOREIGN KEY (user_id)
      REFERENCES administrators (user_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE goals
   ADD CONSTRAINT fk_goals_cons_time_consulta FOREIGN KEY (user_id)
      REFERENCES consultants (user_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE goals
   ADD CONSTRAINT fk_goals_goals_badges FOREIGN KEY (badge_id)
      REFERENCES badges (badge_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE goals
   ADD CONSTRAINT fk_goals_timelines_badge_ap FOREIGN KEY (application_id)
      REFERENCES badge_applications (application_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE learning_paths
   ADD CONSTRAINT fk_learning_lp_create_administ FOREIGN KEY (user_id)
      REFERENCES administrators (user_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE learning_paths
   ADD CONSTRAINT fk_learning_lp_update_administ FOREIGN KEY (adm_user_id)
      REFERENCES administrators (user_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE notifications
   ADD CONSTRAINT fk_notifica_notif_def_notifica FOREIGN KEY (definition_id)
      REFERENCES notification_definitions (definition_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE notifications
   ADD CONSTRAINT fk_notifica_user_noti_users FOREIGN KEY (user_id)
      REFERENCES users (user_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE notification_definitions
   ADD CONSTRAINT fk_notifica_admin_def_administ FOREIGN KEY (user_id)
      REFERENCES administrators (user_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE notification_definitions
   ADD CONSTRAINT fk_notifica_notificat_notifica FOREIGN KEY (preference_id)
      REFERENCES notification_preferences (preference_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE notification_preferences
   ADD CONSTRAINT fk_notifica_announc_n_system_a FOREIGN KEY (announcement_id)
      REFERENCES system_announcements (announcement_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE notification_preferences
   ADD CONSTRAINT fk_notifica_notificat_notifica FOREIGN KEY (definition_id)
      REFERENCES notification_definitions (definition_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE notification_preferences
   ADD CONSTRAINT fk_notifica_notif_sla_slas FOREIGN KEY (sla_id)
      REFERENCES slas (sla_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE notification_preferences
   ADD CONSTRAINT fk_notifica_notpref_c_administ FOREIGN KEY (user_id)
      REFERENCES administrators (user_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE notification_preferences
   ADD CONSTRAINT fk_notifica_notpref_u_administ FOREIGN KEY (adm_user_id)
      REFERENCES administrators (user_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE points_history
   ADD CONSTRAINT fk_points_h_badges_po_badges FOREIGN KEY (badge_id)
      REFERENCES badges (badge_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE points_history
   ADD CONSTRAINT fk_points_h_cons_poin_consulta FOREIGN KEY (user_id)
      REFERENCES consultants (user_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE points_history
   ADD CONSTRAINT fk_points_h_requireme_badge_re FOREIGN KEY (requirement_id)
      REFERENCES badge_requirements (requirement_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE progression_stages
   ADD CONSTRAINT fk_progress_areas_sta_areas FOREIGN KEY (area_id)
      REFERENCES areas (area_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE progression_stages
   ADD CONSTRAINT fk_progress_stages_ba_badges FOREIGN KEY (badge_id)
      REFERENCES badges (badge_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE progression_stages
   ADD CONSTRAINT fk_progress_stages_cr_administ FOREIGN KEY (user_id)
      REFERENCES administrators (user_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE progression_stages
   ADD CONSTRAINT fk_progress_stages_up_administ FOREIGN KEY (adm_user_id)
      REFERENCES administrators (user_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE progression_stages
   ADD CONSTRAINT fk_progress_stage_sta_stage_co FOREIGN KEY (stage_code_id)
      REFERENCES stage_codes (stage_code_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE requirements_evidences
   ADD CONSTRAINT fk_requirem_applicati_badge_ap FOREIGN KEY (application_id)
      REFERENCES badge_applications (application_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE requirements_evidences
   ADD CONSTRAINT fk_requirem_requireme_badge_re FOREIGN KEY (requirement_id)
      REFERENCES badge_requirements (requirement_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE rewards
   ADD CONSTRAINT fk_rewards_badge_rew_badges FOREIGN KEY (badge_id)
      REFERENCES badges (badge_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE services_lines
   ADD CONSTRAINT fk_services_sl_create_administ FOREIGN KEY (user_id)
      REFERENCES administrators (user_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE services_lines
   ADD CONSTRAINT fk_services_sl_lp_learning FOREIGN KEY (learning_path_id)
      REFERENCES learning_paths (learning_path_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE services_lines
   ADD CONSTRAINT fk_services_sl_update_administ FOREIGN KEY (adm_user_id)
      REFERENCES administrators (user_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE service_line_leaders
   ADD CONSTRAINT fk_service__sl_sll_services FOREIGN KEY (service_line_id)
      REFERENCES services_lines (service_line_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE service_line_leaders
   ADD CONSTRAINT fk_service__users_inh_users FOREIGN KEY (user_id)
      REFERENCES users (user_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE skills
   ADD CONSTRAINT fk_skills_badges_sk_badges FOREIGN KEY (badge_id)
      REFERENCES badges (badge_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE skills
   ADD CONSTRAINT fk_skills_skills_cr_administ FOREIGN KEY (user_id)
      REFERENCES administrators (user_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE skills
   ADD CONSTRAINT fk_skills_skills_up_administ FOREIGN KEY (adm_user_id)
      REFERENCES administrators (user_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE slas
   ADD CONSTRAINT fk_slas_notificat_notifica FOREIGN KEY (definition_id)
      REFERENCES notification_definitions (definition_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE slas
   ADD CONSTRAINT fk_slas_notif_sla_notifica FOREIGN KEY (preference_id)
      REFERENCES notification_preferences (preference_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE slas
   ADD CONSTRAINT fk_slas_slas_crea_administ FOREIGN KEY (adm_user_id)
      REFERENCES administrators (user_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE slas
   ADD CONSTRAINT fk_slas_slas_upda_administ FOREIGN KEY (adm_user_id2)
      REFERENCES administrators (user_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE slas
   ADD CONSTRAINT fk_slas_user_slas_users FOREIGN KEY (user_id)
      REFERENCES users (user_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE sl_slas
   ADD CONSTRAINT fk_sl_slas_sl_slas_services FOREIGN KEY (service_line_id)
      REFERENCES services_lines (service_line_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE sl_slas
   ADD CONSTRAINT fk_sl_slas_sl_slas2_slas FOREIGN KEY (sla_id)
      REFERENCES slas (sla_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE stage_codes
   ADD CONSTRAINT fk_stage_co_stagecode_administ FOREIGN KEY (user_id)
      REFERENCES administrators (user_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE stage_codes
   ADD CONSTRAINT fk_stage_co_stage_cod_administ FOREIGN KEY (adm_user_id)
      REFERENCES administrators (user_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE system_announcements
   ADD CONSTRAINT fk_system_a_announcem_administ FOREIGN KEY (adm_user_id)
      REFERENCES administrators (user_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE system_announcements
   ADD CONSTRAINT fk_system_a_announc_n_notifica FOREIGN KEY (preference_id)
      REFERENCES notification_preferences (preference_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE system_announcements
   ADD CONSTRAINT fk_system_a_announc_u_administ FOREIGN KEY (adm_user_id2)
      REFERENCES administrators (user_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE system_announcements
   ADD CONSTRAINT fk_system_a_user_anno_users FOREIGN KEY (user_id)
      REFERENCES users (user_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE talent_managers
   ADD CONSTRAINT fk_talent_m_users_inh_users FOREIGN KEY (user_id)
      REFERENCES users (user_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE users
   ADD CONSTRAINT fk_users_lang_user_preferre FOREIGN KEY (preferred_lang_id)
      REFERENCES preferred_lang (preferred_lang_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE users
   ADD CONSTRAINT fk_users_location__location FOREIGN KEY (location_id)
      REFERENCES locations (location_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE users
   ADD CONSTRAINT fk_users_user_inte_user_bad FOREIGN KEY (interaction_id)
      REFERENCES user_badges_interactions (interaction_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE user_badges_interactions
   ADD CONSTRAINT fk_user_bad_badges_in_badges FOREIGN KEY (badge_id)
      REFERENCES badges (badge_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE user_badges_interactions
   ADD CONSTRAINT fk_user_bad_user_inte_users FOREIGN KEY (user_id)
      REFERENCES users (user_id)
      ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE user_account_tokens  
   ADD CONSTRAINT fk_user_tokens_users FOREIGN KEY (user_id)
      REFERENCES users (user_id)
      ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE user_refresh_tokens
   ADD CONSTRAINT fk_refresh_users FOREIGN KEY (user_id)
      REFERENCES users (user_id)
      ON DELETE CASCADE