/*==============================================================*/
/* DBMS name:      PostgreSQL 18                               */
/* Created on:     24/03/2026 23:18:08                          */
/*==============================================================*/
drop index if exists ADMINISTRATORS_PK cascade;
drop table if exists ADMINISTRATORS cascade;
drop index if exists ANNOUNC_SL_PK cascade;
drop table if exists ANNOUNC_SL cascade;
drop index if exists USERS_VALIDATIONS_FK cascade;
drop index if exists APPLICATIONS_VALIDATIONS_FK cascade;
drop index if exists APPLICATION_VALIDATION_LOGS_PK cascade;
drop table if exists APPLICATION_VALIDATION_LOGS cascade;
drop index if exists AREA_UPDATEDBY_FK cascade;
drop index if exists AREA_CREATEDBY_FK cascade;
drop index if exists SL_AREAS_FK cascade;
drop index if exists AREAS_PK cascade;
drop table if exists AREAS cascade;
drop index if exists VALIDATIONS_AWARDED_FK cascade;
drop index if exists AWARDED_APPLICATIONS2_FK cascade;
drop index if exists CONS_AWARDED_FK cascade;
drop index if exists AWARDED_BADGES_PK cascade;
drop table if exists AWARDED_BADGES cascade;
drop index if exists BADGES_UPDATEDBY_FK cascade;
drop index if exists BADGES_CREATEDBY_FK cascade;
drop index if exists GOALS2_FK cascade;
drop index if exists BADGES_INTERACTIONS2_FK cascade;
drop index if exists AREA_BADGES_FK cascade;
drop index if exists STAGES_BADGES2_FK cascade;
drop index if exists BADGES_PK cascade;
drop table if exists BADGES cascade;
drop index if exists AWARDED_APPLICATIONS_FK cascade;
drop index if exists APPLICATIONS_CERTIFICATES_FK cascade;
drop index if exists TIMELINES_APPLICATIONS2_FK cascade;
drop index if exists CONS_APLLICATIONS_FK cascade;
drop index if exists BADGES_APPLICATIONS_FK cascade;
drop index if exists BADGE_APPLICATIONS_PK cascade;
drop table if exists BADGE_APPLICATIONS cascade;
drop index if exists BADGES_REQUIREMENTS_FK cascade;
drop index if exists STAGES_REQUIREMENTS_FK cascade;
drop index if exists BADGE_REQUIREMENTS_PK cascade;
drop table if exists BADGE_REQUIREMENTS cascade;
drop index if exists APPLICATIONS_CERTIFICATES2_FK cascade;
drop index if exists CERTIFICATES_PK cascade;
drop table if exists CERTIFICATES cascade;
drop index if exists CONSULTANTS_PK cascade;
drop table if exists CONSULTANTS cascade;
drop index if exists CONSULTANTS_SELECTED_SKILLS_PK cascade;
drop table if exists CONSULTANTS_SELECTED_SKILLS cascade;
drop index if exists CONSULTANT_AREAS_PK cascade;
drop table if exists CONSULTANT_AREAS cascade;
drop index if exists GDPR_CREATEDBY_FK cascade;
drop index if exists GDPR_UPDATEDBY_FK cascade;
drop index if exists GDPR_POLICIES_PK cascade;
drop table if exists GDPR_POLICIES cascade;
drop index if exists GOALS_FK cascade;
drop index if exists TIMELINES_APPLICATIONS_FK cascade;
drop index if exists CONS_TIMELINES_FK cascade;
drop index if exists GOALS_PK cascade;
drop table if exists GOALS cascade;
drop index if exists LP_UPDATEDBY_FK cascade;
drop index if exists ADMIN_LP_FK cascade;
drop index if exists LEARNING_PATHS_PK cascade;
drop table if exists LEARNING_PATHS cascade;
drop index if exists LOCATIONS_PK cascade;
drop table if exists LOCATIONS cascade;
drop index if exists NOTIF_DEF_FK cascade;
drop index if exists USER_NOTIFICATIONS_FK cascade;
drop index if exists NOTIFICATIONS_PK cascade;
drop table if exists NOTIFICATIONS cascade;
drop index if exists NOT_DEF_PREF_FK cascade;
drop index if exists ADMIN_DEF_FK cascade;
drop index if exists NOTIFICATION_DEFINITIONS_PK cascade;
drop table if exists NOTIFICATION_DEFINITIONS cascade;
drop index if exists NOT_PREFERENCES_UPDATEDBY_FK cascade;
drop index if exists NOT_PREFERENCES_CREATEDBY_FK cascade;
drop index if exists NOT_DEF_PREF2_FK cascade;
drop index if exists ANNOUNC_NOTIF2_FK cascade;
drop index if exists NOTIF_SLAS_FK cascade;
drop index if exists NOTIFICATE_TO_PK cascade;
drop table if exists NOTIFICATION_PREFERENCES cascade;
drop index if exists REQUIREMENTS_POINTS_FK cascade;
drop index if exists BADGES_POINTS_FK cascade;
drop index if exists CONS_POINTS_FK cascade;
drop index if exists POINTS_HISTORY_PK cascade;
drop table if exists POINTS_HISTORY cascade;
drop index if exists PREFERRED_LANG_PK cascade;
drop table if exists PREFERRED_LANG cascade;
drop index if exists STAGES_UPDATEDBY_FK cascade;
drop index if exists STAGES_CREATEDBY_FK cascade;
drop index if exists STAGE_STAGECODES_FK cascade;
drop index if exists STAGES_BADGES_FK cascade;
drop index if exists AREAS_STAGES_FK cascade;
drop index if exists PROGRESSION_STAGES_PK cascade;
drop table if exists PROGRESSION_STAGES cascade;
drop index if exists APPLICATIONS_EVIDENCES_FK cascade;
drop index if exists REQUIREMENTS_EVIDENCES_FK cascade;
drop index if exists REQUIREMENTS_EVIDENCES_PK cascade;
drop table if exists REQUIREMENTS_EVIDENCES cascade;
drop index if exists BADGE_REWARDS_FK cascade;
drop index if exists REWARDS_PK cascade;
drop table if exists REWARDS cascade;
drop index if exists SL_UPDATEDBY_FK cascade;
drop index if exists ADMIN_SL_FK cascade;
drop index if exists SL_LP_FK cascade;
drop index if exists SERVICES_LINES_PK cascade;
drop table if exists SERVICES_LINES cascade;
drop index if exists SL_SLL_FK cascade;
drop index if exists SERVICE_LINE_LEADERS_PK cascade;
drop table if exists SERVICE_LINE_LEADERS cascade;
drop index if exists SKILLS_UPDATEDBY_FK cascade;
drop index if exists SKILLS_CREATEDBY_FK cascade;
drop index if exists BADGES_SKILLS_FK cascade;
drop index if exists SKILLS_PK cascade;
drop table if exists SKILLS cascade;
drop index if exists SLAS_UPDATEDBY_FK cascade;
drop index if exists NOT_DEF_SLAS_FK cascade;
drop index if exists NOTIF_SLAS2_FK cascade;
drop index if exists USER_SLAS_FK cascade;
drop index if exists ADMIN_SLA_FK cascade;
drop index if exists SLA_DEFINITIONS_PK cascade;
drop table if exists SLAS cascade;
drop index if exists SL_SLAS_PK cascade;
drop table if exists SL_SLAS cascade;
drop index if exists STAGE_CODE_UPDATEDBY_FK cascade;
drop index if exists STAGE_CODE_CREATEDBY_FK cascade;
drop index if exists STAGE_CODES_PK cascade;
drop table if exists STAGE_CODES cascade;
drop index if exists ANNOUNCEMENTS_UPDATEDBY_FK cascade;
drop index if exists ANNOUNC_NOTIF_FK cascade;
drop index if exists ANNOUNCEMENTS_ADMIN_FK cascade;
drop index if exists USER_ANNOUNCEMENTS_FK cascade;
drop index if exists SYSTEM_ANNOUNCEMENTS_PK cascade;
drop table if exists SYSTEM_ANNOUNCEMENTS cascade;
drop index if exists TALENT_MANAGERS_PK cascade;
drop table if exists TALENT_MANAGERS cascade;
drop index if exists LOCATION_USER_FK cascade;
drop index if exists USER_INTERACTIONS2_FK cascade;
drop index if exists LANG_USER_FK cascade;
drop index if exists USERS_PK cascade;
drop table if exists USERS cascade;
drop index if exists BADGES_INTERACTIONS_FK cascade;
drop index if exists USER_INTERACTIONS_FK cascade;
drop index if exists USER_BADGES_INTERACTIONS_PK cascade;
drop table if exists USER_BADGES_INTERACTIONS cascade;

/*==============================================================*/
/* Table: ADMINISTRATORS                                        */
/*==============================================================*/
create table if not exists ADMINISTRATORS (
   USER_ID              INTEGER                 not null,
   PREFERRED_LANG_ID    INTEGER                 null,
   LOCATION_ID          INTEGER                 null,
   INTERACTION_ID       INTEGER                 null,
   IS_SUPER_ADMIN       BOOLEAN                 null,
   constraint PK_ADMINISTRATORS primary key (USER_ID)
);

/*==============================================================*/
/* Index: ADMINISTRATORS_PK                                     */
/*==============================================================*/
create unique index if not exists ADMINISTRATORS_PK on ADMINISTRATORS (
USER_ID
);

/*==============================================================*/
/* Table: ANNOUNC_SL                                            */
/*==============================================================*/
create table if not exists ANNOUNC_SL (
   ANNOUNCEMENT_ID      INTEGER                 not null,
   SERVICE_LINE_ID      INTEGER                 not null,
   constraint PK_ANNOUNC_SL primary key (ANNOUNCEMENT_ID, SERVICE_LINE_ID)
);

/*==============================================================*/
/* Index: ANNOUNC_SL_PK                                         */
/*==============================================================*/
create unique index if not exists ANNOUNC_SL_PK on ANNOUNC_SL (
ANNOUNCEMENT_ID,
SERVICE_LINE_ID
);

/*==============================================================*/
/* Table: APPLICATION_VALIDATION_LOGS                           */
/*==============================================================*/
create table if not exists APPLICATION_VALIDATION_LOGS (
   VALIDATION_LOG_ID    INTEGER GENERATED BY DEFAULT AS IDENTITY               not null,
   USER_ID              INTEGER                 null,
   APPLICATION_ID       INTEGER                 not null,
   VALIDATOR_FUNCTION   VARCHAR(50)          not null,
   VALIDATOR_ACTION     VARCHAR(50)          not null,
   VALIDATIONS_COMMENTS TEXT                 null,
   VALIDATED_AT         TIMESTAMPTZ          not null default now(),
   constraint PK_APPLICATION_VALIDATION_LOGS primary key (VALIDATION_LOG_ID)
);

/*==============================================================*/
/* Index: APPLICATION_VALIDATION_LOGS_PK                        */
/*==============================================================*/
create unique index if not exists APPLICATION_VALIDATION_LOGS_PK on APPLICATION_VALIDATION_LOGS (
VALIDATION_LOG_ID
);

/*==============================================================*/
/* Index: APPLICATIONS_VALIDATIONS_FK                           */
/*==============================================================*/
create index if not exists APPLICATIONS_VALIDATIONS_FK on APPLICATION_VALIDATION_LOGS (
APPLICATION_ID
);

/*==============================================================*/
/* Index: USERS_VALIDATIONS_FK                                  */
/*==============================================================*/
create index if not exists USERS_VALIDATIONS_FK on APPLICATION_VALIDATION_LOGS (
USER_ID
);

/*==============================================================*/
/* Table: AREAS                                                 */
/*==============================================================*/
create table if not exists AREAS (
   AREA_ID              INTEGER GENERATED BY DEFAULT AS IDENTITY               not null,
   SERVICE_LINE_ID      INTEGER                 not null,
   USER_ID              INTEGER                 null,
   ADM_USER_ID          INTEGER                 null,
   AREA_NAME            VARCHAR(100)         not null,
   AREA_CODE            VARCHAR(20)          null,
   AREA_DESCRIPTION     TEXT                 null,
   CREATED_AT           TIMESTAMPTZ          not null default now(),
   UPDATED_AT           TIMESTAMPTZ          not null default now(),
   IMG_URL              VARCHAR(512)         null,
   AREA_SLUG            VARCHAR(512)         not null,
   IS_ACTIVE            BOOLEAN              not null default true,
   constraint PK_AREAS primary key (AREA_ID),
   constraint AK_IDENTIFIER_SLUG_AREAS unique (AREA_SLUG)
);

/*==============================================================*/
/* Index: AREAS_PK                                              */
/*==============================================================*/
create unique index if not exists AREAS_PK on AREAS (
AREA_ID
);

/*==============================================================*/
/* Index: SL_AREAS_FK                                           */
/*==============================================================*/
create index if not exists SL_AREAS_FK on AREAS (
SERVICE_LINE_ID
);

/*==============================================================*/
/* Index: AREA_CREATEDBY_FK                                     */
/*==============================================================*/
create index if not exists AREA_CREATEDBY_FK on AREAS (
USER_ID
);

/*==============================================================*/
/* Index: AREA_UPDATEDBY_FK                                     */
/*==============================================================*/
create index if not exists AREA_UPDATEDBY_FK on AREAS (
ADM_USER_ID
);

/*==============================================================*/
/* Table: AWARDED_BADGES                                        */
/*==============================================================*/
create table if not exists AWARDED_BADGES (
   AWARDED_BADGES_ID    INTEGER GENERATED BY DEFAULT AS IDENTITY               not null,
   VALIDATION_LOG_ID    INTEGER                 null,
   APPLICATION_ID       INTEGER                 not null,
   USER_ID              INTEGER                 null,
   AWARDED_AT           TIMESTAMPTZ          not null default now(),
   IS_PUBLISHED         BOOLEAN                 not null default false,
   PUBLIC_VERIFICATION_LINK VARCHAR(512)         null,
   EXPIRATION_AT        TIMESTAMPTZ          null,
   POINTS_SNAPSHOT      INTEGER                 null,
   IS_FEATURED          BOOLEAN                 not null default false,
   DISPLAY_ORDER        INTEGER                 null,
   constraint PK_AWARDED_BADGES primary key (AWARDED_BADGES_ID)
);

/*==============================================================*/
/* Index: AWARDED_BADGES_PK                                     */
/*==============================================================*/
create unique index if not exists AWARDED_BADGES_PK on AWARDED_BADGES (
AWARDED_BADGES_ID
);

/*==============================================================*/
/* Index: CONS_AWARDED_FK                                       */
/*==============================================================*/
create index if not exists CONS_AWARDED_FK on AWARDED_BADGES (
USER_ID
);

/*==============================================================*/
/* Index: AWARDED_APPLICATIONS2_FK                              */
/*==============================================================*/
create index if not exists AWARDED_APPLICATIONS2_FK on AWARDED_BADGES (
APPLICATION_ID
);

/*==============================================================*/
/* Index: VALIDATIONS_AWARDED_FK                                */
/*==============================================================*/
create index if not exists VALIDATIONS_AWARDED_FK on AWARDED_BADGES (
VALIDATION_LOG_ID
);

/*==============================================================*/
/* Table: BADGES                                                */
/*==============================================================*/
create table if not exists BADGES (
   BADGE_ID             INTEGER GENERATED BY DEFAULT AS IDENTITY               not null,
   GOAL_ID              INTEGER                 null,
   INTERACTION_ID       INTEGER                 null,
   PROGRESSION_STAGE_ID INTEGER                 not null,
   AREA_ID              INTEGER                 not null,
   USER_ID              INTEGER                 null,
   ADM_USER_ID          INTEGER                 null,
   BADGE_TITLE          VARCHAR(100)         not null,
   BADGE_DESCRIPTION    TEXT                 null,
   BADGE_IMG_URL        VARCHAR(512)         null,
   BADGE_SLUG           VARCHAR(100)         not null,
   BADGE_POINTS         INTEGER                 not null,
   EXPIRATION_DURATION_DAYS INTEGER                 null,
   CREATED_AT           TIMESTAMPTZ          not null default now(),
   UPDATED_AT           TIMESTAMPTZ          not null default now(),
   ESTIMATED_TIME_TO_ACQUIRE TIME                 null,
   BADGE_TYPE           VARCHAR(128)         not null
      constraint CKC_BADGE_TYPE_BADGES check (BADGE_TYPE IN ('Standard', 'Special')),
   constraint PK_BADGES primary key (BADGE_ID),
   constraint AK_IDENTIFIER_SLUG_BADGES unique (BADGE_SLUG)
);

/*==============================================================*/
/* Index: BADGES_PK                                             */
/*==============================================================*/
create unique index if not exists BADGES_PK on BADGES (
BADGE_ID
);

/*==============================================================*/
/* Index: STAGES_BADGES2_FK                                     */
/*==============================================================*/
create index if not exists STAGES_BADGES2_FK on BADGES (
PROGRESSION_STAGE_ID
);

/*==============================================================*/
/* Index: AREA_BADGES_FK                                        */
/*==============================================================*/
create index if not exists AREA_BADGES_FK on BADGES (
AREA_ID
);

/*==============================================================*/
/* Index: BADGES_INTERACTIONS2_FK                               */
/*==============================================================*/
create index if not exists BADGES_INTERACTIONS2_FK on BADGES (
INTERACTION_ID
);

/*==============================================================*/
/* Index: GOALS2_FK                                             */
/*==============================================================*/
create index if not exists GOALS2_FK on BADGES (
GOAL_ID
);

/*==============================================================*/
/* Index: BADGES_CREATEDBY_FK                                   */
/*==============================================================*/
create index if not exists BADGES_CREATEDBY_FK on BADGES (
USER_ID
);

/*==============================================================*/
/* Index: BADGES_UPDATEDBY_FK                                   */
/*==============================================================*/
create index if not exists BADGES_UPDATEDBY_FK on BADGES (
ADM_USER_ID
);

/*==============================================================*/
/* Table: BADGE_APPLICATIONS                                    */
/*==============================================================*/
create table if not exists BADGE_APPLICATIONS (
   APPLICATION_ID       INTEGER GENERATED BY DEFAULT AS IDENTITY               not null,
   GOAL_ID              INTEGER                 null,
   BADGE_ID             INTEGER                 not null,
   CERTIFICATE_ID       INTEGER                 null,
   AWARDED_BADGES_ID    INTEGER                 null,
   USER_ID              INTEGER                 not null,
   APPLICATION_STATE    VARCHAR(50)          not null default 'Open'
      constraint CKC_APPLICATION_STATE_BADGE_AP check (APPLICATION_STATE IN ('Open', 'Submitted', 'In validation', 'Closed')),
   SUBMITTED_AT         TIMESTAMPTZ          null,
   CLOSED_AT            TIMESTAMPTZ          null,
   REVIEWER_NOTES       TEXT                 null,
   APPLICATION_GUID     UUID                 not null default gen_random_uuid(),
   OPENED_AT            TIMESTAMPTZ          not null default now(),
   constraint PK_BADGE_APPLICATIONS primary key (APPLICATION_ID),
   constraint AK_APPLICATION_GUID_BADGE_APPLICATIONS unique (APPLICATION_GUID)
);

/*==============================================================*/
/* Index: BADGE_APPLICATIONS_PK                                 */
/*==============================================================*/
create unique index if not exists BADGE_APPLICATIONS_PK on BADGE_APPLICATIONS (
APPLICATION_ID
);

/*==============================================================*/
/* Index: BADGES_APPLICATIONS_FK                                */
/*==============================================================*/
create index if not exists BADGES_APPLICATIONS_FK on BADGE_APPLICATIONS (
BADGE_ID
);

/*==============================================================*/
/* Index: CONS_APLLICATIONS_FK                                  */
/*==============================================================*/
create index if not exists CONS_APLLICATIONS_FK on BADGE_APPLICATIONS (
USER_ID
);

/*==============================================================*/
/* Index: TIMELINES_APPLICATIONS2_FK                            */
/*==============================================================*/
create index if not exists TIMELINES_APPLICATIONS2_FK on BADGE_APPLICATIONS (
GOAL_ID
);

/*==============================================================*/
/* Index: APPLICATIONS_CERTIFICATES_FK                          */
/*==============================================================*/
create index if not exists APPLICATIONS_CERTIFICATES_FK on BADGE_APPLICATIONS (
CERTIFICATE_ID
);

/*==============================================================*/
/* Index: AWARDED_APPLICATIONS_FK                               */
/*==============================================================*/
create index if not exists AWARDED_APPLICATIONS_FK on BADGE_APPLICATIONS (
AWARDED_BADGES_ID
);

/*==============================================================*/
/* Table: BADGE_REQUIREMENTS                                    */
/*==============================================================*/
create table if not exists BADGE_REQUIREMENTS (
   REQUIREMENT_ID       INTEGER GENERATED BY DEFAULT AS IDENTITY               not null,
   PROGRESSION_STAGE_ID INTEGER                 not null,
   BADGE_ID             INTEGER                 not null,
   REQUIREMENT_TITLE    VARCHAR(150)         not null,
   REQUIREMENT_DESCRIPTION TEXT                 not null,
   REQUIREMENT_IMG_URL  VARCHAR(512)         null,
   REQUIREMENT_SEQUENCE INTEGER                 null,
   CREATED_AT           TIMESTAMPTZ          not null default now(),
   UPDATED_AT           TIMESTAMPTZ          not null default now(),
   constraint PK_BADGE_REQUIREMENTS primary key (REQUIREMENT_ID)
);

/*==============================================================*/
/* Index: BADGE_REQUIREMENTS_PK                                 */
/*==============================================================*/
create unique index if not exists BADGE_REQUIREMENTS_PK on BADGE_REQUIREMENTS (
REQUIREMENT_ID
);

/*==============================================================*/
/* Index: STAGES_REQUIREMENTS_FK                                */
/*==============================================================*/
create index if not exists STAGES_REQUIREMENTS_FK on BADGE_REQUIREMENTS (
PROGRESSION_STAGE_ID
);

/*==============================================================*/
/* Index: BADGES_REQUIREMENTS_FK                                */
/*==============================================================*/
create index if not exists BADGES_REQUIREMENTS_FK on BADGE_REQUIREMENTS (
BADGE_ID
);

/*==============================================================*/
/* Table: CERTIFICATES                                          */
/*==============================================================*/
create table if not exists CERTIFICATES (
   CERTIFICATE_ID       INTEGER GENERATED BY DEFAULT AS IDENTITY               not null,
   APPLICATION_ID       INTEGER                 not null,
   CERTIFICATE_TITLE    VARCHAR(150)         not null,
   ISSUING_ENTITY       VARCHAR(150)         null,
   ISSUE_DATE           DATE                 null,
   CERTIFICATE_FILE_URL VARCHAR(500)         null,
   constraint PK_CERTIFICATES primary key (CERTIFICATE_ID)
);

/*==============================================================*/
/* Index: CERTIFICATES_PK                                       */
/*==============================================================*/
create unique index if not exists CERTIFICATES_PK on CERTIFICATES (
CERTIFICATE_ID
);

/*==============================================================*/
/* Index: APPLICATIONS_CERTIFICATES2_FK                         */
/*==============================================================*/
create index if not exists APPLICATIONS_CERTIFICATES2_FK on CERTIFICATES (
APPLICATION_ID
);

/*==============================================================*/
/* Table: CONSULTANTS                                           */
/*==============================================================*/
create table if not exists CONSULTANTS (
   USER_ID              INTEGER                 not null,
   PREFERRED_LANG_ID    INTEGER                 null,
   LOCATION_ID          INTEGER                 null,
   INTERACTION_ID       INTEGER                 null,
   BIOGRAPHY            TEXT                 null,
   GDPR_ACCEPTED        BOOLEAN                 not null,
   constraint PK_CONSULTANTS primary key (USER_ID)
);

/*==============================================================*/
/* Index: CONSULTANTS_PK                                        */
/*==============================================================*/
create unique index if not exists CONSULTANTS_PK on CONSULTANTS (
USER_ID
);

/*==============================================================*/
/* Table: CONSULTANTS_SELECTED_SKILLS                           */
/*==============================================================*/
create table if not exists CONSULTANTS_SELECTED_SKILLS (
   USER_ID              INTEGER                 not null,
   SKILLS_ID            INTEGER                 not null,
   constraint PK_CONSULTANTS_SELECTED_SKILLS primary key (USER_ID, SKILLS_ID)
);

/*==============================================================*/
/* Index: CONSULTANTS_SELECTED_SKILLS_PK                        */
/*==============================================================*/
create unique index if not exists CONSULTANTS_SELECTED_SKILLS_PK on CONSULTANTS_SELECTED_SKILLS (
USER_ID,
SKILLS_ID
);

/*==============================================================*/
/* Table: CONSULTANT_AREAS                                      */
/*==============================================================*/
create table if not exists CONSULTANT_AREAS (
   USER_ID              INTEGER                 not null,
   AREA_ID              INTEGER                 not null,
   IS_PRIMARY           BOOLEAN                 null,
   constraint PK_CONSULTANT_AREAS primary key (USER_ID, AREA_ID)
);

/*==============================================================*/
/* Index: CONSULTANT_AREAS_PK                                   */
/*==============================================================*/
create unique index if not exists CONSULTANT_AREAS_PK on CONSULTANT_AREAS (
USER_ID,
AREA_ID
);

/*==============================================================*/
/* Table: GDPR_POLICIES                                         */
/*==============================================================*/
create table if not exists GDPR_POLICIES (
   POLICY_ID            INTEGER GENERATED BY DEFAULT AS IDENTITY               not null,
   USER_ID              INTEGER                 null,
   ADM_USER_ID          INTEGER                 null,
   POLICY_TYPE          VARCHAR(50)          not null
      constraint CKC_POLICY_TYPE_GDPR check (POLICY_TYPE IN ('Privacy', 'Terms', 'Cookie')),
   POLICY_TEXT          TEXT                 null,
   VERSION              VARCHAR(30)          not null,
   IS_MANDATORY         BOOLEAN              not null default true,
   IS_ACTIVE            BOOLEAN              not null default true,
   constraint PK_GDPR_POLICIES primary key (POLICY_ID)
);

/*==============================================================*/
/* Index: GDPR_POLICIES_PK                                      */
/*==============================================================*/
create unique index if not exists GDPR_POLICIES_PK on GDPR_POLICIES (
POLICY_ID
);

/*==============================================================*/
/* Index: GDPR_UPDATEDBY_FK                                     */
/*==============================================================*/
create index if not exists GDPR_UPDATEDBY_FK on GDPR_POLICIES (
USER_ID
);

/*==============================================================*/
/* Index: GDPR_CREATEDBY_FK                                     */
/*==============================================================*/
create index if not exists GDPR_CREATEDBY_FK on GDPR_POLICIES (
ADM_USER_ID
);

/*==============================================================*/
/* Table: GOALS                                                 */
/*==============================================================*/
create table if not exists GOALS (
   GOAL_ID              INTEGER GENERATED BY DEFAULT AS IDENTITY               not null,
   APPLICATION_ID       INTEGER                 null,
   BADGE_ID             INTEGER                 null,
   USER_ID              INTEGER                 null,
   EVENT_TITLE          VARCHAR(150)         not null,
   EVENT_DESCRIPTION    TEXT                 null,
   EVENT_START_DATE     TIMESTAMPTZ          null,
   EVENT_END_DATE       TIMESTAMPTZ          null,
   REMINDER_AT          TIMESTAMPTZ          null,
   constraint PK_GOALS primary key (GOAL_ID)
);

/*==============================================================*/
/* Index: GOALS_PK                                              */
/*==============================================================*/
create unique index if not exists GOALS_PK on GOALS (
GOAL_ID
);

/*==============================================================*/
/* Index: CONS_TIMELINES_FK                                     */
/*==============================================================*/
create index if not exists CONS_TIMELINES_FK on GOALS (
USER_ID
);

/*==============================================================*/
/* Index: TIMELINES_APPLICATIONS_FK                             */
/*==============================================================*/
create index if not exists TIMELINES_APPLICATIONS_FK on GOALS (
APPLICATION_ID
);

/*==============================================================*/
/* Index: GOALS_FK                                              */
/*==============================================================*/
create index if not exists GOALS_FK on GOALS (
BADGE_ID
);

/*==============================================================*/
/* Table: LEARNING_PATHS                                        */
/*==============================================================*/
create table if not exists LEARNING_PATHS (
   LEARNING_PATH_ID     INTEGER GENERATED BY DEFAULT AS IDENTITY               not null,
   USER_ID              INTEGER                 null,
   ADM_USER_ID          INTEGER                 null,
   PATH_TITLE           VARCHAR(150)         not null,
   PATH_SLUG            VARCHAR(100)         not null,
   PATH_DESCRIPTION     TEXT                 null,
   CREATED_AT           TIMESTAMPTZ          not null default now(),
   UPDATED_AT           TIMESTAMPTZ          not null default now(),
   IMG_URL              VARCHAR(512)         null,
   IS_ACTIVE            BOOLEAN              not null default true,
   constraint PK_LEARNING_PATHS primary key (LEARNING_PATH_ID),
   constraint AK_IDENTIFIER_SLUG_LEARNING unique (PATH_SLUG)
);

/*==============================================================*/
/* Index: LEARNING_PATHS_PK                                     */
/*==============================================================*/
create unique index if not exists LEARNING_PATHS_PK on LEARNING_PATHS (
LEARNING_PATH_ID
);

/*==============================================================*/
/* Index: ADMIN_LP_FK                                           */
/*==============================================================*/
create index if not exists ADMIN_LP_FK on LEARNING_PATHS (
USER_ID
);

/*==============================================================*/
/* Index: LP_UPDATEDBY_FK                                       */
/*==============================================================*/
create index if not exists LP_UPDATEDBY_FK on LEARNING_PATHS (
ADM_USER_ID
);

/*==============================================================*/
/* Table: LOCATIONS                                             */
/*==============================================================*/
create table if not exists LOCATIONS (
   LOCATION_ID          INTEGER GENERATED BY DEFAULT AS IDENTITY               not null,
   LOCATION_NAME        VARCHAR(128)         not null,
   constraint PK_LOCATIONS primary key (LOCATION_ID)
);

/*==============================================================*/
/* Index: LOCATIONS_PK                                          */
/*==============================================================*/
create unique index if not exists LOCATIONS_PK on LOCATIONS (
LOCATION_ID
);

/*==============================================================*/
/* Table: NOTIFICATIONS                                         */
/*==============================================================*/
create table if not exists NOTIFICATIONS (
   NOTIFICATION_ID      INTEGER GENERATED BY DEFAULT AS IDENTITY               not null,
   DEFINITION_ID        INTEGER                 not null,
   USER_ID              INTEGER                 not null,
   NOTIFICATION_PAYLOAD TEXT                 null,
   IS_READ              BOOLEAN                 null,
   SENT_AT              TIMESTAMPTZ          not null default now(),
   NOTIFICATION_URL     VARCHAR(512)         null,
   constraint PK_NOTIFICATIONS primary key (NOTIFICATION_ID)
);

/*==============================================================*/
/* Index: NOTIFICATIONS_PK                                      */
/*==============================================================*/
create unique index if not exists NOTIFICATIONS_PK on NOTIFICATIONS (
NOTIFICATION_ID
);

/*==============================================================*/
/* Index: USER_NOTIFICATIONS_FK                                 */
/*==============================================================*/
create index if not exists USER_NOTIFICATIONS_FK on NOTIFICATIONS (
USER_ID
);

/*==============================================================*/
/* Index: NOTIF_DEF_FK                                          */
/*==============================================================*/
create index if not exists NOTIF_DEF_FK on NOTIFICATIONS (
DEFINITION_ID
);

/*==============================================================*/
/* Table: NOTIFICATION_DEFINITIONS                              */
/*==============================================================*/
create table if not exists NOTIFICATION_DEFINITIONS (
   DEFINITION_ID        INTEGER GENERATED BY DEFAULT AS IDENTITY               not null,
   PREFERENCE_ID        INTEGER                 null,
   USER_ID              INTEGER                 null,
   CODE                 VARCHAR(128)         not null,
   NAME                 VARCHAR(256)         not null,
   DESCRIPTION          TEXT                 null,
   constraint PK_NOTIFICATION_DEFINITIONS primary key (DEFINITION_ID)
);

/*==============================================================*/
/* Index: NOTIFICATION_DEFINITIONS_PK                           */
/*==============================================================*/
create unique index if not exists NOTIFICATION_DEFINITIONS_PK on NOTIFICATION_DEFINITIONS (
DEFINITION_ID
);

/*==============================================================*/
/* Index: ADMIN_DEF_FK                                          */
/*==============================================================*/
create index if not exists ADMIN_DEF_FK on NOTIFICATION_DEFINITIONS (
USER_ID
);

/*==============================================================*/
/* Index: NOT_DEF_PREF_FK                                       */
/*==============================================================*/
create index if not exists NOT_DEF_PREF_FK on NOTIFICATION_DEFINITIONS (
PREFERENCE_ID
);

/*==============================================================*/
/* Table: NOTIFICATION_PREFERENCES                              */
/*==============================================================*/
create table if not exists NOTIFICATION_PREFERENCES (
   PREFERENCE_ID        INTEGER GENERATED BY DEFAULT AS IDENTITY               not null,
   SLA_ID               INTEGER                 null,
   ANNOUNCEMENT_ID      INTEGER                 null,
   DEFINITION_ID        INTEGER                 null,
   USER_ID              INTEGER                 null,
   ADM_USER_ID          INTEGER                 null,
   SEND_EMAIL           BOOLEAN                 not null,
   SEND_PUSH            BOOLEAN                 not null,
   TRIGGER_BEFORE_VALUE INTEGER                 null,
   TRIGGER_BEFORE_UNIT  VARCHAR(50)          null,
   IS_ENABLED           BOOLEAN                 not null,
   constraint PK_NOTIFICATION_PREFERENCES primary key (PREFERENCE_ID)
);

/*==============================================================*/
/* Index: NOTIFICATE_TO_PK                                      */
/*==============================================================*/
create unique index if not exists NOTIFICATE_TO_PK on NOTIFICATION_PREFERENCES (
PREFERENCE_ID
);

/*==============================================================*/
/* Index: NOTIF_SLAS_FK                                         */
/*==============================================================*/
create index if not exists NOTIF_SLAS_FK on NOTIFICATION_PREFERENCES (
SLA_ID
);

/*==============================================================*/
/* Index: ANNOUNC_NOTIF2_FK                                     */
/*==============================================================*/
create index if not exists ANNOUNC_NOTIF2_FK on NOTIFICATION_PREFERENCES (
ANNOUNCEMENT_ID
);

/*==============================================================*/
/* Index: NOT_DEF_PREF2_FK                                      */
/*==============================================================*/
create index if not exists NOT_DEF_PREF2_FK on NOTIFICATION_PREFERENCES (
DEFINITION_ID
);

/*==============================================================*/
/* Index: NOT_PREFERENCES_CREATEDBY_FK                          */
/*==============================================================*/
create index if not exists NOT_PREFERENCES_CREATEDBY_FK on NOTIFICATION_PREFERENCES (
USER_ID
);

/*==============================================================*/
/* Index: NOT_PREFERENCES_UPDATEDBY_FK                          */
/*==============================================================*/
create index if not exists NOT_PREFERENCES_UPDATEDBY_FK on NOTIFICATION_PREFERENCES (
ADM_USER_ID
);

/*==============================================================*/
/* Table: POINTS_HISTORY                                        */
/*==============================================================*/
create table if not exists POINTS_HISTORY (
   POINTS_HISTORY_ID    INTEGER GENERATED BY DEFAULT AS IDENTITY               not null,
   REQUIREMENT_ID       INTEGER                 null,
   BADGE_ID             INTEGER                 null,
   USER_ID              INTEGER                 not null,
   POINTS_DELTA         INTEGER                 not null,
   JUSTIFICATION        TEXT                 null,
   constraint PK_POINTS_HISTORY primary key (POINTS_HISTORY_ID)
);

/*==============================================================*/
/* Index: POINTS_HISTORY_PK                                     */
/*==============================================================*/
create unique index if not exists POINTS_HISTORY_PK on POINTS_HISTORY (
POINTS_HISTORY_ID
);

/*==============================================================*/
/* Index: CONS_POINTS_FK                                        */
/*==============================================================*/
create index if not exists CONS_POINTS_FK on POINTS_HISTORY (
USER_ID
);

/*==============================================================*/
/* Index: BADGES_POINTS_FK                                      */
/*==============================================================*/
create index if not exists BADGES_POINTS_FK on POINTS_HISTORY (
BADGE_ID
);

/*==============================================================*/
/* Index: REQUIREMENTS_POINTS_FK                                */
/*==============================================================*/
create index if not exists REQUIREMENTS_POINTS_FK on POINTS_HISTORY (
REQUIREMENT_ID
);

/*==============================================================*/
/* Table: PREFERRED_LANG                                        */
/*==============================================================*/
create table if not exists PREFERRED_LANG (
   PREFERRED_LANG_ID    INTEGER GENERATED BY DEFAULT AS IDENTITY               not null,
   PREFERRED_LANG       VARCHAR(10)          not null,
   constraint PK_PREFERRED_LANG primary key (PREFERRED_LANG_ID),
   constraint AK_IDENTIFIER_LANG_PREFERRE unique (PREFERRED_LANG)
);

/*==============================================================*/
/* Index: PREFERRED_LANG_PK                                     */
/*==============================================================*/
create unique index if not exists PREFERRED_LANG_PK on PREFERRED_LANG (
PREFERRED_LANG_ID
);

/*==============================================================*/
/* Table: PROGRESSION_STAGES                                    */
/*==============================================================*/
create table if not exists PROGRESSION_STAGES (
   PROGRESSION_STAGE_ID INTEGER GENERATED BY DEFAULT AS IDENTITY               not null,
   AREA_ID              INTEGER                 not null,
   BADGE_ID             INTEGER                 null,
   STAGE_CODE_ID        INTEGER                 not null,
   USER_ID              INTEGER                 null,
   ADM_USER_ID          INTEGER                 null,
   STAGE_TITLE          VARCHAR(100)         not null,
   STAGE_SEQUENCE       INTEGER                 null,
   CREATED_AT           TIMESTAMPTZ          not null default now(),
   UPDATED_AT           TIMESTAMPTZ          not null default now(),
   STAGE_DESCRIPTION    TEXT                 null,
   constraint PK_PROGRESSION_STAGES primary key (PROGRESSION_STAGE_ID)
);

/*==============================================================*/
/* Index: PROGRESSION_STAGES_PK                                 */
/*==============================================================*/
create unique index if not exists PROGRESSION_STAGES_PK on PROGRESSION_STAGES (
PROGRESSION_STAGE_ID
);

/*==============================================================*/
/* Index: AREAS_STAGES_FK                                       */
/*==============================================================*/
create index if not exists AREAS_STAGES_FK on PROGRESSION_STAGES (
AREA_ID
);

/*==============================================================*/
/* Index: STAGES_BADGES_FK                                      */
/*==============================================================*/
create index if not exists STAGES_BADGES_FK on PROGRESSION_STAGES (
BADGE_ID
);

/*==============================================================*/
/* Index: STAGE_STAGECODES_FK                                   */
/*==============================================================*/
create index if not exists STAGE_STAGECODES_FK on PROGRESSION_STAGES (
STAGE_CODE_ID
);

/*==============================================================*/
/* Index: STAGES_CREATEDBY_FK                                   */
/*==============================================================*/
create index if not exists STAGES_CREATEDBY_FK on PROGRESSION_STAGES (
USER_ID
);

/*==============================================================*/
/* Index: STAGES_UPDATEDBY_FK                                   */
/*==============================================================*/
create index if not exists STAGES_UPDATEDBY_FK on PROGRESSION_STAGES (
ADM_USER_ID
);

/*==============================================================*/
/* Table: REQUIREMENTS_EVIDENCES                                */
/*==============================================================*/
create table if not exists REQUIREMENTS_EVIDENCES (
   EVIDENCE_ID          INTEGER GENERATED BY DEFAULT AS IDENTITY               not null,
   REQUIREMENT_ID       INTEGER                 null,
   APPLICATION_ID       INTEGER                 not null,
   EVIDENCE_FILE_URL    VARCHAR(500)         not null,
   EVIDENCE_FILE_TYPE   VARCHAR(100)         null,
   EVIDENCE_TITLE       VARCHAR(150)         null,
   EVIDENCE_DESCRIPTION TEXT                 null,
   UPLOADED_AT          TIMESTAMPTZ          not null default now(),
   TM_REVIEWED          BOOLEAN                 null,
   SLL_REVIEWED         BOOLEAN                 null,
   constraint PK_REQUIREMENTS_EVIDENCES primary key (EVIDENCE_ID)
);

/*==============================================================*/
/* Index: REQUIREMENTS_EVIDENCES_PK                             */
/*==============================================================*/
create unique index if not exists REQUIREMENTS_EVIDENCES_PK on REQUIREMENTS_EVIDENCES (
EVIDENCE_ID
);

/*==============================================================*/
/* Index: REQUIREMENTS_EVIDENCES_FK                             */
/*==============================================================*/
create index if not exists REQUIREMENTS_EVIDENCES_FK on REQUIREMENTS_EVIDENCES (
REQUIREMENT_ID
);

/*==============================================================*/
/* Index: APPLICATIONS_EVIDENCES_FK                             */
/*==============================================================*/
create index if not exists APPLICATIONS_EVIDENCES_FK on REQUIREMENTS_EVIDENCES (
APPLICATION_ID
);

/*==============================================================*/
/* Table: REWARDS                                               */
/*==============================================================*/
create table if not exists REWARDS (
   REWARD_ID            INTEGER GENERATED BY DEFAULT AS IDENTITY               not null,
   BADGE_ID             INTEGER                 null,
   SPECIAL_TITLE        VARCHAR(255)         null,
   SPECIAL_PORTRAIT_SVG TEXT                 null,
   constraint PK_REWARDS primary key (REWARD_ID)
);

/*==============================================================*/
/* Index: REWARDS_PK                                            */
/*==============================================================*/
create unique index if not exists REWARDS_PK on REWARDS (
REWARD_ID
);

/*==============================================================*/
/* Index: BADGE_REWARDS_FK                                      */
/*==============================================================*/
create index if not exists BADGE_REWARDS_FK on REWARDS (
BADGE_ID
);

/*==============================================================*/
/* Table: SERVICES_LINES                                        */
/*==============================================================*/
create table if not exists SERVICES_LINES (
   SERVICE_LINE_ID      INTEGER GENERATED BY DEFAULT AS IDENTITY               not null,
   LEARNING_PATH_ID     INTEGER                 not null,
   USER_ID              INTEGER                 null,
   ADM_USER_ID          INTEGER                 null,
   SERVICE_LINE_NAME    VARCHAR(100)         not null,
   SERVICE_LINE_DESCRIPTION TEXT                 null,
   CREATED_AT           TIMESTAMPTZ          not null default now(),
   UPDATED_AT           TIMESTAMPTZ          not null default now(),
   IMG_URL              VARCHAR(512)         null,
   SL_SLUG              VARCHAR(512)         not null,
   IS_ACTIVE            BOOLEAN              not null default true,
   constraint PK_SERVICES_LINES primary key (SERVICE_LINE_ID),
   constraint AK_IDENTIFIER_SLUG_SERVICES_LINES unique (SL_SLUG)
);

/*==============================================================*/
/* Index: SERVICES_LINES_PK                                     */
/*==============================================================*/
create unique index if not exists SERVICES_LINES_PK on SERVICES_LINES (
SERVICE_LINE_ID
);

/*==============================================================*/
/* Index: SL_LP_FK                                              */
/*==============================================================*/
create index if not exists SL_LP_FK on SERVICES_LINES (
LEARNING_PATH_ID
);

/*==============================================================*/
/* Index: ADMIN_SL_FK                                           */
/*==============================================================*/
create index if not exists ADMIN_SL_FK on SERVICES_LINES (
USER_ID
);

/*==============================================================*/
/* Index: SL_UPDATEDBY_FK                                       */
/*==============================================================*/
create index if not exists SL_UPDATEDBY_FK on SERVICES_LINES (
ADM_USER_ID
);

/*==============================================================*/
/* Table: SERVICE_LINE_LEADERS                                  */
/*==============================================================*/
create table if not exists SERVICE_LINE_LEADERS (
   USER_ID              INTEGER                 not null,
   SERVICE_LINE_ID      INTEGER                 not null,
   PREFERRED_LANG_ID    INTEGER                 null,
   LOCATION_ID          INTEGER                 null,
   INTERACTION_ID       INTEGER                 null,
   BIOGRAPHY            TEXT                 null,
   constraint PK_SERVICE_LINE_LEADERS primary key (USER_ID)
);

/*==============================================================*/
/* Index: SERVICE_LINE_LEADERS_PK                               */
/*==============================================================*/
create unique index if not exists SERVICE_LINE_LEADERS_PK on SERVICE_LINE_LEADERS (
USER_ID
);

/*==============================================================*/
/* Index: SL_SLL_FK                                             */
/*==============================================================*/
create index if not exists SL_SLL_FK on SERVICE_LINE_LEADERS (
SERVICE_LINE_ID
);

/*==============================================================*/
/* Table: SKILLS                                                */
/*==============================================================*/
create table if not exists SKILLS (
   SKILLS_ID            INTEGER GENERATED BY DEFAULT AS IDENTITY               not null,
   BADGE_ID             INTEGER                 null,
   USER_ID              INTEGER                 null,
   ADM_USER_ID          INTEGER                 null,
   SKILL_NAME           VARCHAR(150)         not null,
   SKILL_DESCRIPTION    TEXT                 null,
   CREATED_AT           TIMESTAMPTZ          not null default now(),
   UPDATED_AT           TIMESTAMPTZ          not null default now(),
   constraint PK_SKILLS primary key (SKILLS_ID)
);

/*==============================================================*/
/* Index: SKILLS_PK                                             */
/*==============================================================*/
create unique index if not exists SKILLS_PK on SKILLS (
SKILLS_ID
);

/*==============================================================*/
/* Index: BADGES_SKILLS_FK                                      */
/*==============================================================*/
create index if not exists BADGES_SKILLS_FK on SKILLS (
BADGE_ID
);

/*==============================================================*/
/* Index: SKILLS_CREATEDBY_FK                                   */
/*==============================================================*/
create index if not exists SKILLS_CREATEDBY_FK on SKILLS (
USER_ID
);

/*==============================================================*/
/* Index: SKILLS_UPDATEDBY_FK                                   */
/*==============================================================*/
create index if not exists SKILLS_UPDATEDBY_FK on SKILLS (
ADM_USER_ID
);

/*==============================================================*/
/* Table: SLAS                                                  */
/*==============================================================*/
create table if not exists SLAS (
   SLA_ID               INTEGER GENERATED BY DEFAULT AS IDENTITY               not null,
   DEFINITION_ID        INTEGER                 null,
   USER_ID              INTEGER                 null,
   PREFERENCE_ID        INTEGER                 null,
   ADM_USER_ID          INTEGER                 not null,
   ADM_USER_ID2         INTEGER                 null,
   SLA_NAME             VARCHAR(100)         not null,
   SLA_DESCRIPTION      TEXT                 null,
   RESPONSE_TIME_HOURS  INTEGER                 not null,
   CREATED_AT           TIMESTAMPTZ          not null default now(),
   UPDATED_AT           TIMESTAMPTZ          not null default now(),
   IS_ACTIVE            BOOLEAN              not null default true,
   TARGET_PROFILE       VARCHAR(128)         null
      constraint CKC_TARGET_PROFILE_SLAS check (TARGET_PROFILE IN ('Consultant', 'Talent Manager', 'Service Line Leader', 'Administrator')),
   IS_GLOBAL            BOOLEAN                 null,
   START_DATE           TIMESTAMPTZ          not null,
   END_DATE             TIMESTAMPTZ          not null,
   constraint PK_SLAS primary key (SLA_ID)
);

/*==============================================================*/
/* Index: SLA_DEFINITIONS_PK                                    */
/*==============================================================*/
create unique index if not exists SLA_DEFINITIONS_PK on SLAS (
SLA_ID
);

/*==============================================================*/
/* Index: ADMIN_SLA_FK                                          */
/*==============================================================*/
create index if not exists ADMIN_SLA_FK on SLAS (
ADM_USER_ID
);

/*==============================================================*/
/* Index: USER_SLAS_FK                                          */
/*==============================================================*/
create index if not exists USER_SLAS_FK on SLAS (
USER_ID
);

/*==============================================================*/
/* Index: NOTIF_SLAS2_FK                                        */
/*==============================================================*/
create index if not exists NOTIF_SLAS2_FK on SLAS (
PREFERENCE_ID
);

/*==============================================================*/
/* Index: NOT_DEF_SLAS_FK                                       */
/*==============================================================*/
create index if not exists NOT_DEF_SLAS_FK on SLAS (
DEFINITION_ID
);

/*==============================================================*/
/* Index: SLAS_UPDATEDBY_FK                                     */
/*==============================================================*/
create index if not exists SLAS_UPDATEDBY_FK on SLAS (
ADM_USER_ID2
);

/*==============================================================*/
/* Table: SL_SLAS                                               */
/*==============================================================*/
create table if not exists SL_SLAS (
   SERVICE_LINE_ID      INTEGER                 not null,
   SLA_ID               INTEGER                 not null,
   constraint PK_SL_SLAS primary key (SERVICE_LINE_ID, SLA_ID)
);

/*==============================================================*/
/* Index: SL_SLAS_PK                                            */
/*==============================================================*/
create unique index if not exists SL_SLAS_PK on SL_SLAS (
SERVICE_LINE_ID,
SLA_ID
);

/*==============================================================*/
/* Table: STAGE_CODES                                           */
/*==============================================================*/
create table if not exists STAGE_CODES (
   STAGE_CODE_ID        INTEGER GENERATED BY DEFAULT AS IDENTITY               not null,
   USER_ID              INTEGER                 null,
   ADM_USER_ID          INTEGER                 null,
   STAGE_CODE           VARCHAR(20)          not null,
   constraint PK_STAGE_CODES primary key (STAGE_CODE_ID),
   constraint AK_IDENTIFIER_CODE_STAGE_CO unique (STAGE_CODE)
);

/*==============================================================*/
/* Index: STAGE_CODES_PK                                        */
/*==============================================================*/
create unique index if not exists STAGE_CODES_PK on STAGE_CODES (
STAGE_CODE_ID
);

/*==============================================================*/
/* Index: STAGE_CODE_CREATEDBY_FK                               */
/*==============================================================*/
create index if not exists STAGE_CODE_CREATEDBY_FK on STAGE_CODES (
USER_ID
);

/*==============================================================*/
/* Index: STAGE_CODE_UPDATEDBY_FK                               */
/*==============================================================*/
create index if not exists STAGE_CODE_UPDATEDBY_FK on STAGE_CODES (
ADM_USER_ID
);

/*==============================================================*/
/* Table: SYSTEM_ANNOUNCEMENTS                                  */
/*==============================================================*/
create table if not exists SYSTEM_ANNOUNCEMENTS (
   ANNOUNCEMENT_ID      INTEGER GENERATED BY DEFAULT AS IDENTITY               not null,
   USER_ID              INTEGER                 null,
   PREFERENCE_ID        INTEGER                 not null,
   ADM_USER_ID          INTEGER                 null,
   ADM_USER_ID2         INTEGER                 null,
   ANNOUNCEMENT_TITLE   VARCHAR(150)         not null,
   ANNOUNCEMENT_MESSAGE TEXT                 not null,
   IS_ACTIVE            BOOLEAN              not null default true,
   STARTS_AT            TIMESTAMPTZ          null,
   ENDS_AT              TIMESTAMPTZ          null,
   ANNOUNCEMENT_TYPE    VARCHAR(128)         null,
   IS_GLOBAL            BOOLEAN                 null,
   TARGET_PROFILE       VARCHAR(128)         null
      constraint CKC_TARGET_PROFILE_SYSTEM_ANNOUNCEMENTS check (TARGET_PROFILE IN ('Consultant', 'Talent Manager', 'Service Line Leader', 'Administrator')),
   constraint PK_SYSTEM_ANNOUNCEMENTS primary key (ANNOUNCEMENT_ID)
);

/*==============================================================*/
/* Index: SYSTEM_ANNOUNCEMENTS_PK                               */
/*==============================================================*/
create unique index if not exists SYSTEM_ANNOUNCEMENTS_PK on SYSTEM_ANNOUNCEMENTS (
ANNOUNCEMENT_ID
);

/*==============================================================*/
/* Index: USER_ANNOUNCEMENTS_FK                                 */
/*==============================================================*/
create index if not exists USER_ANNOUNCEMENTS_FK on SYSTEM_ANNOUNCEMENTS (
USER_ID
);

/*==============================================================*/
/* Index: ANNOUNCEMENTS_ADMIN_FK                                */
/*==============================================================*/
create index if not exists ANNOUNCEMENTS_ADMIN_FK on SYSTEM_ANNOUNCEMENTS (
ADM_USER_ID
);

/*==============================================================*/
/* Index: ANNOUNC_NOTIF_FK                                      */
/*==============================================================*/
create index if not exists ANNOUNC_NOTIF_FK on SYSTEM_ANNOUNCEMENTS (
PREFERENCE_ID
);

/*==============================================================*/
/* Index: ANNOUNCEMENTS_UPDATEDBY_FK                            */
/*==============================================================*/
create index if not exists ANNOUNCEMENTS_UPDATEDBY_FK on SYSTEM_ANNOUNCEMENTS (
ADM_USER_ID2
);

/*==============================================================*/
/* Table: TALENT_MANAGERS                                       */
/*==============================================================*/
create table if not exists TALENT_MANAGERS (
   USER_ID              INTEGER                 not null,
   PREFERRED_LANG_ID    INTEGER                 null,
   LOCATION_ID          INTEGER                 null,
   INTERACTION_ID       INTEGER                 null,
   BIOGRAPHY            TEXT                 null,
   constraint PK_TALENT_MANAGERS primary key (USER_ID)
);

/*==============================================================*/
/* Index: TALENT_MANAGERS_PK                                    */
/*==============================================================*/
create unique index if not exists TALENT_MANAGERS_PK on TALENT_MANAGERS (
USER_ID
);

/*==============================================================*/
/* Table: USERS                                                 */
/*==============================================================*/
create table if not exists USERS (
   USER_ID              INTEGER GENERATED BY DEFAULT AS IDENTITY               not null,
   PREFERRED_LANG_ID    INTEGER                 null,
   LOCATION_ID          INTEGER                 null,
   INTERACTION_ID       INTEGER                 null,
   EMAIL_ADDRESS        VARCHAR(255)         not null,
   PASSWORD_HASH        VARCHAR(255)         not null,
   FULL_NAME            VARCHAR(150)         not null,
   USERNAME             VARCHAR(50)          not null,
   PHONE_NUMBER         VARCHAR(20)          null,
   IS_ACTIVE            BOOLEAN              not null default true,
   FORCE_PASSWORD_CHANGE BOOLEAN             not null default true,
   LAST_LOGIN_AT        TIMESTAMPTZ          null,
   LAST_ONLINE          TIMESTAMPTZ          null,
   BIRTHDATE            DATE                 null,
   PROFILE_IMG_URL      VARCHAR(512)         null,
   constraint PK_USERS primary key (USER_ID),
   constraint AK_IDENTIFIER_EMAIL_USERS unique (EMAIL_ADDRESS),
   constraint AK_IDENTIFIER_USERNAM_USERS unique (USERNAME)
);

/*==============================================================*/
/* Index: USERS_PK                                              */
/*==============================================================*/
create unique index if not exists USERS_PK on USERS (
USER_ID
);

/*==============================================================*/
/* Index: LANG_USER_FK                                          */
/*==============================================================*/
create index if not exists LANG_USER_FK on USERS (
PREFERRED_LANG_ID
);

/*==============================================================*/
/* Index: USER_INTERACTIONS2_FK                                 */
/*==============================================================*/
create index if not exists USER_INTERACTIONS2_FK on USERS (
INTERACTION_ID
);

/*==============================================================*/
/* Index: LOCATION_USER_FK                                      */
/*==============================================================*/
create index if not exists LOCATION_USER_FK on USERS (
LOCATION_ID
);

/*==============================================================*/
/* Table: USER_BADGES_INTERACTIONS                              */
/*==============================================================*/
create table if not exists USER_BADGES_INTERACTIONS (
   INTERACTION_ID       INTEGER GENERATED BY DEFAULT AS IDENTITY               not null,
   BADGE_ID             INTEGER                 not null,
   USER_ID              INTEGER                 not null,
   DATE                 TIMESTAMPTZ          not null default now(),
   TYPE                 VARCHAR(150)         not null,
   constraint PK_USER_BADGES_INTERACTIONS primary key (INTERACTION_ID)
);

/*==============================================================*/
/* Index: USER_BADGES_INTERACTIONS_PK                           */
/*==============================================================*/
create unique index if not exists USER_BADGES_INTERACTIONS_PK on USER_BADGES_INTERACTIONS (
INTERACTION_ID
);

/*==============================================================*/
/* Index: USER_INTERACTIONS_FK                                  */
/*==============================================================*/
create index if not exists USER_INTERACTIONS_FK on USER_BADGES_INTERACTIONS (
USER_ID
);

/*==============================================================*/
/* Index: BADGES_INTERACTIONS_FK                                */
/*==============================================================*/
create index if not exists BADGES_INTERACTIONS_FK on USER_BADGES_INTERACTIONS (
BADGE_ID
);

alter table ADMINISTRATORS
   add constraint FK_ADMINIST_USERS_INH_USERS foreign key (USER_ID)
      references USERS (USER_ID)
      on delete restrict on update restrict;

alter table ANNOUNC_SL
   add constraint FK_ANNOUNC__ANNOUNC_S_SYSTEM_A foreign key (ANNOUNCEMENT_ID)
      references SYSTEM_ANNOUNCEMENTS (ANNOUNCEMENT_ID)
      on delete restrict on update restrict;

alter table ANNOUNC_SL
   add constraint FK_ANNOUNC__ANNOUNC_S_SERVICES foreign key (SERVICE_LINE_ID)
      references SERVICES_LINES (SERVICE_LINE_ID)
      on delete restrict on update restrict;

alter table APPLICATION_VALIDATION_LOGS
   add constraint FK_APPLICAT_APPLICATI_BADGE_AP foreign key (APPLICATION_ID)
      references BADGE_APPLICATIONS (APPLICATION_ID)
      on delete restrict on update restrict;

alter table APPLICATION_VALIDATION_LOGS
   add constraint FK_APPLICAT_USERS_VAL_USERS foreign key (USER_ID)
      references USERS (USER_ID)
      on delete restrict on update restrict;

alter table AREAS
   add constraint FK_AREAS_AREA_CREA_ADMINIST foreign key (USER_ID)
      references ADMINISTRATORS (USER_ID)
      on delete restrict on update restrict;

alter table AREAS
   add constraint FK_AREAS_AREA_UPDA_ADMINIST foreign key (ADM_USER_ID)
      references ADMINISTRATORS (USER_ID)
      on delete restrict on update restrict;

alter table AREAS
   add constraint FK_AREAS_SL_AREAS_SERVICES foreign key (SERVICE_LINE_ID)
      references SERVICES_LINES (SERVICE_LINE_ID)
      on delete restrict on update restrict;

alter table AWARDED_BADGES
   add constraint FK_AWARDED__AWARDED_A_BADGE_AP foreign key (APPLICATION_ID)
      references BADGE_APPLICATIONS (APPLICATION_ID)
      on delete restrict on update restrict;

alter table AWARDED_BADGES
   add constraint FK_AWARDED__CONS_AWAR_CONSULTA foreign key (USER_ID)
      references CONSULTANTS (USER_ID)
      on delete restrict on update restrict;

alter table AWARDED_BADGES
   add constraint FK_AWARDED__VALIDATIO_APPLICAT foreign key (VALIDATION_LOG_ID)
      references APPLICATION_VALIDATION_LOGS (VALIDATION_LOG_ID)
      on delete restrict on update restrict;

alter table BADGES
   add constraint FK_BADGES_AREA_BADG_AREAS foreign key (AREA_ID)
      references AREAS (AREA_ID)
      on delete restrict on update restrict;

alter table BADGES
   add constraint FK_BADGES_BADGES_CR_ADMINIST foreign key (USER_ID)
      references ADMINISTRATORS (USER_ID)
      on delete restrict on update restrict;

alter table BADGES
   add constraint FK_BADGES_BADGES_IN_USER_BAD foreign key (INTERACTION_ID)
      references USER_BADGES_INTERACTIONS (INTERACTION_ID)
      on delete restrict on update restrict;

alter table BADGES
   add constraint FK_BADGES_BADGES_UP_ADMINIST foreign key (ADM_USER_ID)
      references ADMINISTRATORS (USER_ID)
      on delete restrict on update restrict;

alter table BADGES
   add constraint FK_BADGES_GOALS2_GOALS foreign key (GOAL_ID)
      references GOALS (GOAL_ID)
      on delete restrict on update restrict;

alter table BADGES
   add constraint FK_BADGES_STAGES_BA_PROGRESS foreign key (PROGRESSION_STAGE_ID)
      references PROGRESSION_STAGES (PROGRESSION_STAGE_ID)
      on delete restrict on update restrict;

alter table BADGE_APPLICATIONS
   add constraint FK_BADGE_AP_APPLICATI_CERTIFIC foreign key (CERTIFICATE_ID)
      references CERTIFICATES (CERTIFICATE_ID)
      on delete restrict on update restrict;

alter table BADGE_APPLICATIONS
   add constraint FK_BADGE_AP_AWARDED_A_AWARDED_ foreign key (AWARDED_BADGES_ID)
      references AWARDED_BADGES (AWARDED_BADGES_ID)
      on delete restrict on update restrict;

alter table BADGE_APPLICATIONS
   add constraint FK_BADGE_AP_BADGES_AP_BADGES foreign key (BADGE_ID)
      references BADGES (BADGE_ID)
      on delete restrict on update restrict;

alter table BADGE_APPLICATIONS
   add constraint FK_BADGE_AP_CONS_APLL_CONSULTA foreign key (USER_ID)
      references CONSULTANTS (USER_ID)
      on delete restrict on update restrict;

alter table BADGE_APPLICATIONS
   add constraint FK_BADGE_AP_TIMELINES_GOALS foreign key (GOAL_ID)
      references GOALS (GOAL_ID)
      on delete restrict on update restrict;

alter table BADGE_REQUIREMENTS
   add constraint FK_BADGE_RE_BADGES_RE_BADGES foreign key (BADGE_ID)
      references BADGES (BADGE_ID)
      on delete restrict on update restrict;

alter table BADGE_REQUIREMENTS
   add constraint FK_BADGE_RE_STAGES_RE_PROGRESS foreign key (PROGRESSION_STAGE_ID)
      references PROGRESSION_STAGES (PROGRESSION_STAGE_ID)
      on delete restrict on update restrict;

alter table CERTIFICATES
   add constraint FK_CERTIFIC_APPLICATI_BADGE_AP foreign key (APPLICATION_ID)
      references BADGE_APPLICATIONS (APPLICATION_ID)
      on delete restrict on update restrict;

alter table CONSULTANTS
   add constraint FK_CONSULTA_USERS_INH_USERS foreign key (USER_ID)
      references USERS (USER_ID)
      on delete restrict on update restrict;

alter table CONSULTANTS_SELECTED_SKILLS
   add constraint FK_CONSULTA_CONSULTAN_CONSULTA foreign key (USER_ID)
      references CONSULTANTS (USER_ID)
      on delete restrict on update restrict;

alter table CONSULTANTS_SELECTED_SKILLS
   add constraint FK_CONSULTA_CONSULTAN_SKILLS foreign key (SKILLS_ID)
      references SKILLS (SKILLS_ID)
      on delete restrict on update restrict;

alter table CONSULTANT_AREAS
   add constraint FK_CONSULTA_CONSULTAN_CONSULTA foreign key (USER_ID)
      references CONSULTANTS (USER_ID)
      on delete restrict on update restrict;

alter table CONSULTANT_AREAS
   add constraint FK_CONSULTA_CONSULTAN_AREAS foreign key (AREA_ID)
      references AREAS (AREA_ID)
      on delete restrict on update restrict;

alter table GDPR_POLICIES
   add constraint FK_GDPR_POL_GDPR_CREA_ADMINIST foreign key (ADM_USER_ID)
      references ADMINISTRATORS (USER_ID)
      on delete restrict on update restrict;

alter table GDPR_POLICIES
   add constraint FK_GDPR_POL_GDPR_UPDA_ADMINIST foreign key (USER_ID)
      references ADMINISTRATORS (USER_ID)
      on delete restrict on update restrict;

alter table GOALS
   add constraint FK_GOALS_CONS_TIME_CONSULTA foreign key (USER_ID)
      references CONSULTANTS (USER_ID)
      on delete restrict on update restrict;

alter table GOALS
   add constraint FK_GOALS_GOALS_BADGES foreign key (BADGE_ID)
      references BADGES (BADGE_ID)
      on delete restrict on update restrict;

alter table GOALS
   add constraint FK_GOALS_TIMELINES_BADGE_AP foreign key (APPLICATION_ID)
      references BADGE_APPLICATIONS (APPLICATION_ID)
      on delete restrict on update restrict;

alter table LEARNING_PATHS
   add constraint FK_LEARNING_LP_CREATE_ADMINIST foreign key (USER_ID)
      references ADMINISTRATORS (USER_ID)
      on delete restrict on update restrict;

alter table LEARNING_PATHS
   add constraint FK_LEARNING_LP_UPDATE_ADMINIST foreign key (ADM_USER_ID)
      references ADMINISTRATORS (USER_ID)
      on delete restrict on update restrict;

alter table NOTIFICATIONS
   add constraint FK_NOTIFICA_NOTIF_DEF_NOTIFICA foreign key (DEFINITION_ID)
      references NOTIFICATION_DEFINITIONS (DEFINITION_ID)
      on delete restrict on update restrict;

alter table NOTIFICATIONS
   add constraint FK_NOTIFICA_USER_NOTI_USERS foreign key (USER_ID)
      references USERS (USER_ID)
      on delete restrict on update restrict;

alter table NOTIFICATION_DEFINITIONS
   add constraint FK_NOTIFICA_ADMIN_DEF_ADMINIST foreign key (USER_ID)
      references ADMINISTRATORS (USER_ID)
      on delete restrict on update restrict;

alter table NOTIFICATION_DEFINITIONS
   add constraint FK_NOTIFICA_NOTIFICAT_NOTIFICA foreign key (PREFERENCE_ID)
      references NOTIFICATION_PREFERENCES (PREFERENCE_ID)
      on delete restrict on update restrict;

alter table NOTIFICATION_PREFERENCES
   add constraint FK_NOTIFICA_ANNOUNC_N_SYSTEM_A foreign key (ANNOUNCEMENT_ID)
      references SYSTEM_ANNOUNCEMENTS (ANNOUNCEMENT_ID)
      on delete restrict on update restrict;

alter table NOTIFICATION_PREFERENCES
   add constraint FK_NOTIFICA_NOTIFICAT_NOTIFICA foreign key (DEFINITION_ID)
      references NOTIFICATION_DEFINITIONS (DEFINITION_ID)
      on delete restrict on update restrict;

alter table NOTIFICATION_PREFERENCES
   add constraint FK_NOTIFICA_NOTIF_SLA_SLAS foreign key (SLA_ID)
      references SLAS (SLA_ID)
      on delete restrict on update restrict;

alter table NOTIFICATION_PREFERENCES
   add constraint FK_NOTIFICA_NOTPREF_C_ADMINIST foreign key (USER_ID)
      references ADMINISTRATORS (USER_ID)
      on delete restrict on update restrict;

alter table NOTIFICATION_PREFERENCES
   add constraint FK_NOTIFICA_NOTPREF_U_ADMINIST foreign key (ADM_USER_ID)
      references ADMINISTRATORS (USER_ID)
      on delete restrict on update restrict;

alter table POINTS_HISTORY
   add constraint FK_POINTS_H_BADGES_PO_BADGES foreign key (BADGE_ID)
      references BADGES (BADGE_ID)
      on delete restrict on update restrict;

alter table POINTS_HISTORY
   add constraint FK_POINTS_H_CONS_POIN_CONSULTA foreign key (USER_ID)
      references CONSULTANTS (USER_ID)
      on delete restrict on update restrict;

alter table POINTS_HISTORY
   add constraint FK_POINTS_H_REQUIREME_BADGE_RE foreign key (REQUIREMENT_ID)
      references BADGE_REQUIREMENTS (REQUIREMENT_ID)
      on delete restrict on update restrict;

alter table PROGRESSION_STAGES
   add constraint FK_PROGRESS_AREAS_STA_AREAS foreign key (AREA_ID)
      references AREAS (AREA_ID)
      on delete restrict on update restrict;

alter table PROGRESSION_STAGES
   add constraint FK_PROGRESS_STAGES_BA_BADGES foreign key (BADGE_ID)
      references BADGES (BADGE_ID)
      on delete restrict on update restrict;

alter table PROGRESSION_STAGES
   add constraint FK_PROGRESS_STAGES_CR_ADMINIST foreign key (USER_ID)
      references ADMINISTRATORS (USER_ID)
      on delete restrict on update restrict;

alter table PROGRESSION_STAGES
   add constraint FK_PROGRESS_STAGES_UP_ADMINIST foreign key (ADM_USER_ID)
      references ADMINISTRATORS (USER_ID)
      on delete restrict on update restrict;

alter table PROGRESSION_STAGES
   add constraint FK_PROGRESS_STAGE_STA_STAGE_CO foreign key (STAGE_CODE_ID)
      references STAGE_CODES (STAGE_CODE_ID)
      on delete restrict on update restrict;

alter table REQUIREMENTS_EVIDENCES
   add constraint FK_REQUIREM_APPLICATI_BADGE_AP foreign key (APPLICATION_ID)
      references BADGE_APPLICATIONS (APPLICATION_ID)
      on delete restrict on update restrict;

alter table REQUIREMENTS_EVIDENCES
   add constraint FK_REQUIREM_REQUIREME_BADGE_RE foreign key (REQUIREMENT_ID)
      references BADGE_REQUIREMENTS (REQUIREMENT_ID)
      on delete restrict on update restrict;

alter table REWARDS
   add constraint FK_REWARDS_BADGE_REW_BADGES foreign key (BADGE_ID)
      references BADGES (BADGE_ID)
      on delete restrict on update restrict;

alter table SERVICES_LINES
   add constraint FK_SERVICES_SL_CREATE_ADMINIST foreign key (USER_ID)
      references ADMINISTRATORS (USER_ID)
      on delete restrict on update restrict;

alter table SERVICES_LINES
   add constraint FK_SERVICES_SL_LP_LEARNING foreign key (LEARNING_PATH_ID)
      references LEARNING_PATHS (LEARNING_PATH_ID)
      on delete restrict on update restrict;

alter table SERVICES_LINES
   add constraint FK_SERVICES_SL_UPDATE_ADMINIST foreign key (ADM_USER_ID)
      references ADMINISTRATORS (USER_ID)
      on delete restrict on update restrict;

alter table SERVICE_LINE_LEADERS
   add constraint FK_SERVICE__SL_SLL_SERVICES foreign key (SERVICE_LINE_ID)
      references SERVICES_LINES (SERVICE_LINE_ID)
      on delete restrict on update restrict;

alter table SERVICE_LINE_LEADERS
   add constraint FK_SERVICE__USERS_INH_USERS foreign key (USER_ID)
      references USERS (USER_ID)
      on delete restrict on update restrict;

alter table SKILLS
   add constraint FK_SKILLS_BADGES_SK_BADGES foreign key (BADGE_ID)
      references BADGES (BADGE_ID)
      on delete restrict on update restrict;

alter table SKILLS
   add constraint FK_SKILLS_SKILLS_CR_ADMINIST foreign key (USER_ID)
      references ADMINISTRATORS (USER_ID)
      on delete restrict on update restrict;

alter table SKILLS
   add constraint FK_SKILLS_SKILLS_UP_ADMINIST foreign key (ADM_USER_ID)
      references ADMINISTRATORS (USER_ID)
      on delete restrict on update restrict;

alter table SLAS
   add constraint FK_SLAS_NOTIFICAT_NOTIFICA foreign key (DEFINITION_ID)
      references NOTIFICATION_DEFINITIONS (DEFINITION_ID)
      on delete restrict on update restrict;

alter table SLAS
   add constraint FK_SLAS_NOTIF_SLA_NOTIFICA foreign key (PREFERENCE_ID)
      references NOTIFICATION_PREFERENCES (PREFERENCE_ID)
      on delete restrict on update restrict;

alter table SLAS
   add constraint FK_SLAS_SLAS_CREA_ADMINIST foreign key (ADM_USER_ID)
      references ADMINISTRATORS (USER_ID)
      on delete restrict on update restrict;

alter table SLAS
   add constraint FK_SLAS_SLAS_UPDA_ADMINIST foreign key (ADM_USER_ID2)
      references ADMINISTRATORS (USER_ID)
      on delete restrict on update restrict;

alter table SLAS
   add constraint FK_SLAS_USER_SLAS_USERS foreign key (USER_ID)
      references USERS (USER_ID)
      on delete restrict on update restrict;

alter table SL_SLAS
   add constraint FK_SL_SLAS_SL_SLAS_SERVICES foreign key (SERVICE_LINE_ID)
      references SERVICES_LINES (SERVICE_LINE_ID)
      on delete restrict on update restrict;

alter table SL_SLAS
   add constraint FK_SL_SLAS_SL_SLAS2_SLAS foreign key (SLA_ID)
      references SLAS (SLA_ID)
      on delete restrict on update restrict;

alter table STAGE_CODES
   add constraint FK_STAGE_CO_STAGECODE_ADMINIST foreign key (USER_ID)
      references ADMINISTRATORS (USER_ID)
      on delete restrict on update restrict;

alter table STAGE_CODES
   add constraint FK_STAGE_CO_STAGE_COD_ADMINIST foreign key (ADM_USER_ID)
      references ADMINISTRATORS (USER_ID)
      on delete restrict on update restrict;

alter table SYSTEM_ANNOUNCEMENTS
   add constraint FK_SYSTEM_A_ANNOUNCEM_ADMINIST foreign key (ADM_USER_ID)
      references ADMINISTRATORS (USER_ID)
      on delete restrict on update restrict;

alter table SYSTEM_ANNOUNCEMENTS
   add constraint FK_SYSTEM_A_ANNOUNC_N_NOTIFICA foreign key (PREFERENCE_ID)
      references NOTIFICATION_PREFERENCES (PREFERENCE_ID)
      on delete restrict on update restrict;

alter table SYSTEM_ANNOUNCEMENTS
   add constraint FK_SYSTEM_A_ANNOUNC_U_ADMINIST foreign key (ADM_USER_ID2)
      references ADMINISTRATORS (USER_ID)
      on delete restrict on update restrict;

alter table SYSTEM_ANNOUNCEMENTS
   add constraint FK_SYSTEM_A_USER_ANNO_USERS foreign key (USER_ID)
      references USERS (USER_ID)
      on delete restrict on update restrict;

alter table TALENT_MANAGERS
   add constraint FK_TALENT_M_USERS_INH_USERS foreign key (USER_ID)
      references USERS (USER_ID)
      on delete restrict on update restrict;

alter table USERS
   add constraint FK_USERS_LANG_USER_PREFERRE foreign key (PREFERRED_LANG_ID)
      references PREFERRED_LANG (PREFERRED_LANG_ID)
      on delete restrict on update restrict;

alter table USERS
   add constraint FK_USERS_LOCATION__LOCATION foreign key (LOCATION_ID)
      references LOCATIONS (LOCATION_ID)
      on delete restrict on update restrict;

alter table USERS
   add constraint FK_USERS_USER_INTE_USER_BAD foreign key (INTERACTION_ID)
      references USER_BADGES_INTERACTIONS (INTERACTION_ID)
      on delete restrict on update restrict;

alter table USER_BADGES_INTERACTIONS
   add constraint FK_USER_BAD_BADGES_IN_BADGES foreign key (BADGE_ID)
      references BADGES (BADGE_ID)
      on delete restrict on update restrict;

alter table USER_BADGES_INTERACTIONS
   add constraint FK_USER_BAD_USER_INTE_USERS foreign key (USER_ID)
      references USERS (USER_ID)
      on delete restrict on update restrict;

