/*==============================================================*/
/* DBMS name:      Microsoft SQL Server 2017                    */
/* Created on:     13/02/2026 12:38:19                          */
/*==============================================================*/


if exists (select 1
   from sys.sysreferences r join sys.sysobjects o on (o.id = r.constid and o.type = 'F')
   where r.fkeyid = object_id('ADMINISTRATORS') and o.name = 'FK_ADMINIST_USERS_INH_USERS')
alter table ADMINISTRATORS
   drop constraint FK_ADMINIST_USERS_INH_USERS
go

if exists (select 1
   from sys.sysreferences r join sys.sysobjects o on (o.id = r.constid and o.type = 'F')
   where r.fkeyid = object_id('APPLICATION_TIMELINES') and o.name = 'FK_APPLICAT_CONS_TIME_CONSULTA')
alter table APPLICATION_TIMELINES
   drop constraint FK_APPLICAT_CONS_TIME_CONSULTA
go

if exists (select 1
   from sys.sysreferences r join sys.sysobjects o on (o.id = r.constid and o.type = 'F')
   where r.fkeyid = object_id('APPLICATION_TIMELINES') and o.name = 'FK_APPLICAT_TIMELINES_BADGE_AP')
alter table APPLICATION_TIMELINES
   drop constraint FK_APPLICAT_TIMELINES_BADGE_AP
go

if exists (select 1
   from sys.sysreferences r join sys.sysobjects o on (o.id = r.constid and o.type = 'F')
   where r.fkeyid = object_id('APPLICATION_VALIDATION_LOGS') and o.name = 'FK_APPLICAT_APPLICATI_BADGE_AP')
alter table APPLICATION_VALIDATION_LOGS
   drop constraint FK_APPLICAT_APPLICATI_BADGE_AP
go

if exists (select 1
   from sys.sysreferences r join sys.sysobjects o on (o.id = r.constid and o.type = 'F')
   where r.fkeyid = object_id('APPLICATION_VALIDATION_LOGS') and o.name = 'FK_APPLICAT_USERS_VAL_USERS')
alter table APPLICATION_VALIDATION_LOGS
   drop constraint FK_APPLICAT_USERS_VAL_USERS
go

if exists (select 1
   from sys.sysreferences r join sys.sysobjects o on (o.id = r.constid and o.type = 'F')
   where r.fkeyid = object_id('AREAS') and o.name = 'FK_AREAS_SL_AREAS_SERVICES')
alter table AREAS
   drop constraint FK_AREAS_SL_AREAS_SERVICES
go

if exists (select 1
   from sys.sysreferences r join sys.sysobjects o on (o.id = r.constid and o.type = 'F')
   where r.fkeyid = object_id('AWARDED_BADGES') and o.name = 'FK_AWARDED__AWARDED_A_BADGE_AP')
alter table AWARDED_BADGES
   drop constraint FK_AWARDED__AWARDED_A_BADGE_AP
go

if exists (select 1
   from sys.sysreferences r join sys.sysobjects o on (o.id = r.constid and o.type = 'F')
   where r.fkeyid = object_id('AWARDED_BADGES') and o.name = 'FK_AWARDED__CONS_AWAR_CONSULTA')
alter table AWARDED_BADGES
   drop constraint FK_AWARDED__CONS_AWAR_CONSULTA
go

if exists (select 1
   from sys.sysreferences r join sys.sysobjects o on (o.id = r.constid and o.type = 'F')
   where r.fkeyid = object_id('AWARDED_BADGES') and o.name = 'FK_AWARDED__VALIDATIO_APPLICAT')
alter table AWARDED_BADGES
   drop constraint FK_AWARDED__VALIDATIO_APPLICAT
go

if exists (select 1
   from sys.sysreferences r join sys.sysobjects o on (o.id = r.constid and o.type = 'F')
   where r.fkeyid = object_id('BADGES') and o.name = 'FK_BADGES_AREA_BADG_AREAS')
alter table BADGES
   drop constraint FK_BADGES_AREA_BADG_AREAS
go

if exists (select 1
   from sys.sysreferences r join sys.sysobjects o on (o.id = r.constid and o.type = 'F')
   where r.fkeyid = object_id('BADGES') and o.name = 'FK_BADGES_STAGES_BA_PROGRESS')
alter table BADGES
   drop constraint FK_BADGES_STAGES_BA_PROGRESS
go

if exists (select 1
   from sys.sysreferences r join sys.sysobjects o on (o.id = r.constid and o.type = 'F')
   where r.fkeyid = object_id('BADGE_APPLICATIONS') and o.name = 'FK_BADGE_AP_APPLICATI_CERTIFIC')
alter table BADGE_APPLICATIONS
   drop constraint FK_BADGE_AP_APPLICATI_CERTIFIC
go

if exists (select 1
   from sys.sysreferences r join sys.sysobjects o on (o.id = r.constid and o.type = 'F')
   where r.fkeyid = object_id('BADGE_APPLICATIONS') and o.name = 'FK_BADGE_AP_AWARDED_A_AWARDED_')
alter table BADGE_APPLICATIONS
   drop constraint FK_BADGE_AP_AWARDED_A_AWARDED_
go

if exists (select 1
   from sys.sysreferences r join sys.sysobjects o on (o.id = r.constid and o.type = 'F')
   where r.fkeyid = object_id('BADGE_APPLICATIONS') and o.name = 'FK_BADGE_AP_BADGES_AP_BADGES')
alter table BADGE_APPLICATIONS
   drop constraint FK_BADGE_AP_BADGES_AP_BADGES
go

if exists (select 1
   from sys.sysreferences r join sys.sysobjects o on (o.id = r.constid and o.type = 'F')
   where r.fkeyid = object_id('BADGE_APPLICATIONS') and o.name = 'FK_BADGE_AP_CONS_APLL_CONSULTA')
alter table BADGE_APPLICATIONS
   drop constraint FK_BADGE_AP_CONS_APLL_CONSULTA
go

if exists (select 1
   from sys.sysreferences r join sys.sysobjects o on (o.id = r.constid and o.type = 'F')
   where r.fkeyid = object_id('BADGE_APPLICATIONS') and o.name = 'FK_BADGE_AP_TIMELINES_APPLICAT')
alter table BADGE_APPLICATIONS
   drop constraint FK_BADGE_AP_TIMELINES_APPLICAT
go

if exists (select 1
   from sys.sysreferences r join sys.sysobjects o on (o.id = r.constid and o.type = 'F')
   where r.fkeyid = object_id('BADGE_REQUIREMENTS') and o.name = 'FK_BADGE_RE_BADGES_RE_BADGES')
alter table BADGE_REQUIREMENTS
   drop constraint FK_BADGE_RE_BADGES_RE_BADGES
go

if exists (select 1
   from sys.sysreferences r join sys.sysobjects o on (o.id = r.constid and o.type = 'F')
   where r.fkeyid = object_id('BADGE_REQUIREMENTS') and o.name = 'FK_BADGE_RE_STAGES_RE_PROGRESS')
alter table BADGE_REQUIREMENTS
   drop constraint FK_BADGE_RE_STAGES_RE_PROGRESS
go

if exists (select 1
   from sys.sysreferences r join sys.sysobjects o on (o.id = r.constid and o.type = 'F')
   where r.fkeyid = object_id('CERTIFICATES') and o.name = 'FK_CERTIFIC_APPLICATI_BADGE_AP')
alter table CERTIFICATES
   drop constraint FK_CERTIFIC_APPLICATI_BADGE_AP
go

if exists (select 1
   from sys.sysreferences r join sys.sysobjects o on (o.id = r.constid and o.type = 'F')
   where r.fkeyid = object_id('CONSULTANTS') and o.name = 'FK_CONSULTA_USERS_INH_USERS')
alter table CONSULTANTS
   drop constraint FK_CONSULTA_USERS_INH_USERS
go

if exists (select 1
   from sys.sysreferences r join sys.sysobjects o on (o.id = r.constid and o.type = 'F')
   where r.fkeyid = object_id('CONSULTANT_AREAS') and o.name = 'FK_CONSULTA_CONSULTAN_CONSULTA')
alter table CONSULTANT_AREAS
   drop constraint FK_CONSULTA_CONSULTAN_CONSULTA
go

if exists (select 1
   from sys.sysreferences r join sys.sysobjects o on (o.id = r.constid and o.type = 'F')
   where r.fkeyid = object_id('CONSULTANT_AREAS') and o.name = 'FK_CONSULTA_CONSULTAN_AREAS')
alter table CONSULTANT_AREAS
   drop constraint FK_CONSULTA_CONSULTAN_AREAS
go

if exists (select 1
   from sys.sysreferences r join sys.sysobjects o on (o.id = r.constid and o.type = 'F')
   where r.fkeyid = object_id('LEARNING_PATHS') and o.name = 'FK_LEARNING_ADMIN_LP_ADMINIST')
alter table LEARNING_PATHS
   drop constraint FK_LEARNING_ADMIN_LP_ADMINIST
go

if exists (select 1
   from sys.sysreferences r join sys.sysobjects o on (o.id = r.constid and o.type = 'F')
   where r.fkeyid = object_id('NOTIFICATIONS') and o.name = 'FK_NOTIFICA_NOT_TYPE_NOTIFICA')
alter table NOTIFICATIONS
   drop constraint FK_NOTIFICA_NOT_TYPE_NOTIFICA
go

if exists (select 1
   from sys.sysreferences r join sys.sysobjects o on (o.id = r.constid and o.type = 'F')
   where r.fkeyid = object_id('NOTIFICATIONS') and o.name = 'FK_NOTIFICA_USER_NOTI_USERS')
alter table NOTIFICATIONS
   drop constraint FK_NOTIFICA_USER_NOTI_USERS
go

if exists (select 1
   from sys.sysreferences r join sys.sysobjects o on (o.id = r.constid and o.type = 'F')
   where r.fkeyid = object_id('POINTS_HISTORY') and o.name = 'FK_POINTS_H_BADGES_PO_BADGES')
alter table POINTS_HISTORY
   drop constraint FK_POINTS_H_BADGES_PO_BADGES
go

if exists (select 1
   from sys.sysreferences r join sys.sysobjects o on (o.id = r.constid and o.type = 'F')
   where r.fkeyid = object_id('POINTS_HISTORY') and o.name = 'FK_POINTS_H_CONS_POIN_CONSULTA')
alter table POINTS_HISTORY
   drop constraint FK_POINTS_H_CONS_POIN_CONSULTA
go

if exists (select 1
   from sys.sysreferences r join sys.sysobjects o on (o.id = r.constid and o.type = 'F')
   where r.fkeyid = object_id('POINTS_HISTORY') and o.name = 'FK_POINTS_H_REQUIREME_BADGE_RE')
alter table POINTS_HISTORY
   drop constraint FK_POINTS_H_REQUIREME_BADGE_RE
go

if exists (select 1
   from sys.sysreferences r join sys.sysobjects o on (o.id = r.constid and o.type = 'F')
   where r.fkeyid = object_id('PROGRESSION_STAGES') and o.name = 'FK_PROGRESS_AREAS_STA_AREAS')
alter table PROGRESSION_STAGES
   drop constraint FK_PROGRESS_AREAS_STA_AREAS
go

if exists (select 1
   from sys.sysreferences r join sys.sysobjects o on (o.id = r.constid and o.type = 'F')
   where r.fkeyid = object_id('PROGRESSION_STAGES') and o.name = 'FK_PROGRESS_STAGES_BA_BADGES')
alter table PROGRESSION_STAGES
   drop constraint FK_PROGRESS_STAGES_BA_BADGES
go

if exists (select 1
   from sys.sysreferences r join sys.sysobjects o on (o.id = r.constid and o.type = 'F')
   where r.fkeyid = object_id('PROGRESSION_STAGES') and o.name = 'FK_PROGRESS_STAGE_STA_STAGE_CO')
alter table PROGRESSION_STAGES
   drop constraint FK_PROGRESS_STAGE_STA_STAGE_CO
go

if exists (select 1
   from sys.sysreferences r join sys.sysobjects o on (o.id = r.constid and o.type = 'F')
   where r.fkeyid = object_id('REQUIREMENTS_EVIDENCES') and o.name = 'FK_REQUIREM_APPLICATI_BADGE_AP')
alter table REQUIREMENTS_EVIDENCES
   drop constraint FK_REQUIREM_APPLICATI_BADGE_AP
go

if exists (select 1
   from sys.sysreferences r join sys.sysobjects o on (o.id = r.constid and o.type = 'F')
   where r.fkeyid = object_id('REQUIREMENTS_EVIDENCES') and o.name = 'FK_REQUIREM_REQUIREME_BADGE_RE')
alter table REQUIREMENTS_EVIDENCES
   drop constraint FK_REQUIREM_REQUIREME_BADGE_RE
go

if exists (select 1
   from sys.sysreferences r join sys.sysobjects o on (o.id = r.constid and o.type = 'F')
   where r.fkeyid = object_id('SERVICES_LINES') and o.name = 'FK_SERVICES_SL_LP_LEARNING')
alter table SERVICES_LINES
   drop constraint FK_SERVICES_SL_LP_LEARNING
go

if exists (select 1
   from sys.sysreferences r join sys.sysobjects o on (o.id = r.constid and o.type = 'F')
   where r.fkeyid = object_id('SERVICE_LINE_LEADERS') and o.name = 'FK_SERVICE__SL_SLL_SERVICES')
alter table SERVICE_LINE_LEADERS
   drop constraint FK_SERVICE__SL_SLL_SERVICES
go

if exists (select 1
   from sys.sysreferences r join sys.sysobjects o on (o.id = r.constid and o.type = 'F')
   where r.fkeyid = object_id('SERVICE_LINE_LEADERS') and o.name = 'FK_SERVICE__USERS_INH_USERS')
alter table SERVICE_LINE_LEADERS
   drop constraint FK_SERVICE__USERS_INH_USERS
go

if exists (select 1
   from sys.sysreferences r join sys.sysobjects o on (o.id = r.constid and o.type = 'F')
   where r.fkeyid = object_id('SLA_DEFINITIONS') and o.name = 'FK_SLA_DEFI_ADMIN_SLA_ADMINIST')
alter table SLA_DEFINITIONS
   drop constraint FK_SLA_DEFI_ADMIN_SLA_ADMINIST
go

if exists (select 1
   from sys.sysreferences r join sys.sysobjects o on (o.id = r.constid and o.type = 'F')
   where r.fkeyid = object_id('SYSTEM_ANNOUNCEMENTS') and o.name = 'FK_SYSTEM_A_USER_ANNO_USERS')
alter table SYSTEM_ANNOUNCEMENTS
   drop constraint FK_SYSTEM_A_USER_ANNO_USERS
go

if exists (select 1
   from sys.sysreferences r join sys.sysobjects o on (o.id = r.constid and o.type = 'F')
   where r.fkeyid = object_id('TALENT_MANAGERS') and o.name = 'FK_TALENT_M_USERS_INH_USERS')
alter table TALENT_MANAGERS
   drop constraint FK_TALENT_M_USERS_INH_USERS
go

if exists (select 1
   from sys.sysreferences r join sys.sysobjects o on (o.id = r.constid and o.type = 'F')
   where r.fkeyid = object_id('USERS') and o.name = 'FK_USERS_LANG_USER_PREFERRE')
alter table USERS
   drop constraint FK_USERS_LANG_USER_PREFERRE
go

if exists (select 1
            from  sysobjects
           where  id = object_id('ADMINISTRATORS')
            and   type = 'U')
   drop table ADMINISTRATORS
go

if exists (select 1
            from  sysindexes
           where  id    = object_id('APPLICATION_TIMELINES')
            and   name  = 'TIMELINES_APPLICATIONS_FK'
            and   indid > 0
            and   indid < 255)
   drop index APPLICATION_TIMELINES.TIMELINES_APPLICATIONS_FK
go

if exists (select 1
            from  sysindexes
           where  id    = object_id('APPLICATION_TIMELINES')
            and   name  = 'CONS_TIMELINES_FK'
            and   indid > 0
            and   indid < 255)
   drop index APPLICATION_TIMELINES.CONS_TIMELINES_FK
go

if exists (select 1
            from  sysobjects
           where  id = object_id('APPLICATION_TIMELINES')
            and   type = 'U')
   drop table APPLICATION_TIMELINES
go

if exists (select 1
            from  sysindexes
           where  id    = object_id('APPLICATION_VALIDATION_LOGS')
            and   name  = 'USERS_VALIDATIONS_FK'
            and   indid > 0
            and   indid < 255)
   drop index APPLICATION_VALIDATION_LOGS.USERS_VALIDATIONS_FK
go

if exists (select 1
            from  sysindexes
           where  id    = object_id('APPLICATION_VALIDATION_LOGS')
            and   name  = 'APPLICATIONS_VALIDATIONS_FK'
            and   indid > 0
            and   indid < 255)
   drop index APPLICATION_VALIDATION_LOGS.APPLICATIONS_VALIDATIONS_FK
go

if exists (select 1
            from  sysobjects
           where  id = object_id('APPLICATION_VALIDATION_LOGS')
            and   type = 'U')
   drop table APPLICATION_VALIDATION_LOGS
go

if exists (select 1
            from  sysindexes
           where  id    = object_id('AREAS')
            and   name  = 'SL_AREAS_FK'
            and   indid > 0
            and   indid < 255)
   drop index AREAS.SL_AREAS_FK
go

if exists (select 1
            from  sysobjects
           where  id = object_id('AREAS')
            and   type = 'U')
   drop table AREAS
go

if exists (select 1
            from  sysindexes
           where  id    = object_id('AWARDED_BADGES')
            and   name  = 'VALIDATIONS_AWARDED_FK'
            and   indid > 0
            and   indid < 255)
   drop index AWARDED_BADGES.VALIDATIONS_AWARDED_FK
go

if exists (select 1
            from  sysindexes
           where  id    = object_id('AWARDED_BADGES')
            and   name  = 'AWARDED_APPLICATIONS2_FK'
            and   indid > 0
            and   indid < 255)
   drop index AWARDED_BADGES.AWARDED_APPLICATIONS2_FK
go

if exists (select 1
            from  sysindexes
           where  id    = object_id('AWARDED_BADGES')
            and   name  = 'CONS_AWARDED_FK'
            and   indid > 0
            and   indid < 255)
   drop index AWARDED_BADGES.CONS_AWARDED_FK
go

if exists (select 1
            from  sysobjects
           where  id = object_id('AWARDED_BADGES')
            and   type = 'U')
   drop table AWARDED_BADGES
go

if exists (select 1
            from  sysindexes
           where  id    = object_id('BADGES')
            and   name  = 'AREA_BADGES_FK'
            and   indid > 0
            and   indid < 255)
   drop index BADGES.AREA_BADGES_FK
go

if exists (select 1
            from  sysindexes
           where  id    = object_id('BADGES')
            and   name  = 'STAGES_BADGES2_FK'
            and   indid > 0
            and   indid < 255)
   drop index BADGES.STAGES_BADGES2_FK
go

if exists (select 1
            from  sysobjects
           where  id = object_id('BADGES')
            and   type = 'U')
   drop table BADGES
go

if exists (select 1
            from  sysindexes
           where  id    = object_id('BADGE_APPLICATIONS')
            and   name  = 'AWARDED_APPLICATIONS_FK'
            and   indid > 0
            and   indid < 255)
   drop index BADGE_APPLICATIONS.AWARDED_APPLICATIONS_FK
go

if exists (select 1
            from  sysindexes
           where  id    = object_id('BADGE_APPLICATIONS')
            and   name  = 'APPLICATIONS_CERTIFICATES_FK'
            and   indid > 0
            and   indid < 255)
   drop index BADGE_APPLICATIONS.APPLICATIONS_CERTIFICATES_FK
go

if exists (select 1
            from  sysindexes
           where  id    = object_id('BADGE_APPLICATIONS')
            and   name  = 'TIMELINES_APPLICATIONS2_FK'
            and   indid > 0
            and   indid < 255)
   drop index BADGE_APPLICATIONS.TIMELINES_APPLICATIONS2_FK
go

if exists (select 1
            from  sysindexes
           where  id    = object_id('BADGE_APPLICATIONS')
            and   name  = 'CONS_APLLICATIONS_FK'
            and   indid > 0
            and   indid < 255)
   drop index BADGE_APPLICATIONS.CONS_APLLICATIONS_FK
go

if exists (select 1
            from  sysindexes
           where  id    = object_id('BADGE_APPLICATIONS')
            and   name  = 'BADGES_APPLICATIONS_FK'
            and   indid > 0
            and   indid < 255)
   drop index BADGE_APPLICATIONS.BADGES_APPLICATIONS_FK
go

if exists (select 1
            from  sysobjects
           where  id = object_id('BADGE_APPLICATIONS')
            and   type = 'U')
   drop table BADGE_APPLICATIONS
go

if exists (select 1
            from  sysindexes
           where  id    = object_id('BADGE_REQUIREMENTS')
            and   name  = 'BADGES_REQUIREMENTS_FK'
            and   indid > 0
            and   indid < 255)
   drop index BADGE_REQUIREMENTS.BADGES_REQUIREMENTS_FK
go

if exists (select 1
            from  sysindexes
           where  id    = object_id('BADGE_REQUIREMENTS')
            and   name  = 'STAGES_REQUIREMENTS_FK'
            and   indid > 0
            and   indid < 255)
   drop index BADGE_REQUIREMENTS.STAGES_REQUIREMENTS_FK
go

if exists (select 1
            from  sysobjects
           where  id = object_id('BADGE_REQUIREMENTS')
            and   type = 'U')
   drop table BADGE_REQUIREMENTS
go

if exists (select 1
            from  sysindexes
           where  id    = object_id('CERTIFICATES')
            and   name  = 'APPLICATIONS_CERTIFICATES2_FK'
            and   indid > 0
            and   indid < 255)
   drop index CERTIFICATES.APPLICATIONS_CERTIFICATES2_FK
go

if exists (select 1
            from  sysobjects
           where  id = object_id('CERTIFICATES')
            and   type = 'U')
   drop table CERTIFICATES
go

if exists (select 1
            from  sysobjects
           where  id = object_id('CONSULTANTS')
            and   type = 'U')
   drop table CONSULTANTS
go

if exists (select 1
            from  sysindexes
           where  id    = object_id('CONSULTANT_AREAS')
            and   name  = 'CONSULTANT_AREAS2_FK'
            and   indid > 0
            and   indid < 255)
   drop index CONSULTANT_AREAS.CONSULTANT_AREAS2_FK
go

if exists (select 1
            from  sysindexes
           where  id    = object_id('CONSULTANT_AREAS')
            and   name  = 'CONSULTANT_AREAS_FK'
            and   indid > 0
            and   indid < 255)
   drop index CONSULTANT_AREAS.CONSULTANT_AREAS_FK
go

if exists (select 1
            from  sysobjects
           where  id = object_id('CONSULTANT_AREAS')
            and   type = 'U')
   drop table CONSULTANT_AREAS
go

if exists (select 1
            from  sysindexes
           where  id    = object_id('LEARNING_PATHS')
            and   name  = 'ADMIN_LP_FK'
            and   indid > 0
            and   indid < 255)
   drop index LEARNING_PATHS.ADMIN_LP_FK
go

if exists (select 1
            from  sysobjects
           where  id = object_id('LEARNING_PATHS')
            and   type = 'U')
   drop table LEARNING_PATHS
go

if exists (select 1
            from  sysindexes
           where  id    = object_id('NOTIFICATIONS')
            and   name  = 'NOT_TYPE_FK'
            and   indid > 0
            and   indid < 255)
   drop index NOTIFICATIONS.NOT_TYPE_FK
go

if exists (select 1
            from  sysindexes
           where  id    = object_id('NOTIFICATIONS')
            and   name  = 'USER_NOTIFICATIONS_FK'
            and   indid > 0
            and   indid < 255)
   drop index NOTIFICATIONS.USER_NOTIFICATIONS_FK
go

if exists (select 1
            from  sysobjects
           where  id = object_id('NOTIFICATIONS')
            and   type = 'U')
   drop table NOTIFICATIONS
go

if exists (select 1
            from  sysobjects
           where  id = object_id('NOTIFICATIONS_TYPE')
            and   type = 'U')
   drop table NOTIFICATIONS_TYPE
go

if exists (select 1
            from  sysindexes
           where  id    = object_id('POINTS_HISTORY')
            and   name  = 'REQUIREMENTS_POINTS_FK'
            and   indid > 0
            and   indid < 255)
   drop index POINTS_HISTORY.REQUIREMENTS_POINTS_FK
go

if exists (select 1
            from  sysindexes
           where  id    = object_id('POINTS_HISTORY')
            and   name  = 'BADGES_POINTS_FK'
            and   indid > 0
            and   indid < 255)
   drop index POINTS_HISTORY.BADGES_POINTS_FK
go

if exists (select 1
            from  sysindexes
           where  id    = object_id('POINTS_HISTORY')
            and   name  = 'CONS_POINTS_FK'
            and   indid > 0
            and   indid < 255)
   drop index POINTS_HISTORY.CONS_POINTS_FK
go

if exists (select 1
            from  sysobjects
           where  id = object_id('POINTS_HISTORY')
            and   type = 'U')
   drop table POINTS_HISTORY
go

if exists (select 1
            from  sysobjects
           where  id = object_id('PREFERRED_LANG')
            and   type = 'U')
   drop table PREFERRED_LANG
go

if exists (select 1
            from  sysindexes
           where  id    = object_id('PROGRESSION_STAGES')
            and   name  = 'STAGE_STAGECODES_FK'
            and   indid > 0
            and   indid < 255)
   drop index PROGRESSION_STAGES.STAGE_STAGECODES_FK
go

if exists (select 1
            from  sysindexes
           where  id    = object_id('PROGRESSION_STAGES')
            and   name  = 'STAGES_BADGES_FK'
            and   indid > 0
            and   indid < 255)
   drop index PROGRESSION_STAGES.STAGES_BADGES_FK
go

if exists (select 1
            from  sysindexes
           where  id    = object_id('PROGRESSION_STAGES')
            and   name  = 'AREAS_STAGES_FK'
            and   indid > 0
            and   indid < 255)
   drop index PROGRESSION_STAGES.AREAS_STAGES_FK
go

if exists (select 1
            from  sysobjects
           where  id = object_id('PROGRESSION_STAGES')
            and   type = 'U')
   drop table PROGRESSION_STAGES
go

if exists (select 1
            from  sysindexes
           where  id    = object_id('REQUIREMENTS_EVIDENCES')
            and   name  = 'APPLICATIONS_EVIDENCES_FK'
            and   indid > 0
            and   indid < 255)
   drop index REQUIREMENTS_EVIDENCES.APPLICATIONS_EVIDENCES_FK
go

if exists (select 1
            from  sysindexes
           where  id    = object_id('REQUIREMENTS_EVIDENCES')
            and   name  = 'REQUIREMENTS_EVIDENCES_FK'
            and   indid > 0
            and   indid < 255)
   drop index REQUIREMENTS_EVIDENCES.REQUIREMENTS_EVIDENCES_FK
go

if exists (select 1
            from  sysobjects
           where  id = object_id('REQUIREMENTS_EVIDENCES')
            and   type = 'U')
   drop table REQUIREMENTS_EVIDENCES
go

if exists (select 1
            from  sysindexes
           where  id    = object_id('SERVICES_LINES')
            and   name  = 'SL_LP_FK'
            and   indid > 0
            and   indid < 255)
   drop index SERVICES_LINES.SL_LP_FK
go

if exists (select 1
            from  sysobjects
           where  id = object_id('SERVICES_LINES')
            and   type = 'U')
   drop table SERVICES_LINES
go

if exists (select 1
            from  sysindexes
           where  id    = object_id('SERVICE_LINE_LEADERS')
            and   name  = 'SL_SLL_FK'
            and   indid > 0
            and   indid < 255)
   drop index SERVICE_LINE_LEADERS.SL_SLL_FK
go

if exists (select 1
            from  sysobjects
           where  id = object_id('SERVICE_LINE_LEADERS')
            and   type = 'U')
   drop table SERVICE_LINE_LEADERS
go

if exists (select 1
            from  sysindexes
           where  id    = object_id('SLA_DEFINITIONS')
            and   name  = 'ADMIN_SLA_FK'
            and   indid > 0
            and   indid < 255)
   drop index SLA_DEFINITIONS.ADMIN_SLA_FK
go

if exists (select 1
            from  sysobjects
           where  id = object_id('SLA_DEFINITIONS')
            and   type = 'U')
   drop table SLA_DEFINITIONS
go

if exists (select 1
            from  sysobjects
           where  id = object_id('STAGE_CODES')
            and   type = 'U')
   drop table STAGE_CODES
go

if exists (select 1
            from  sysindexes
           where  id    = object_id('SYSTEM_ANNOUNCEMENTS')
            and   name  = 'USER_ANNOUNCEMENTS_FK'
            and   indid > 0
            and   indid < 255)
   drop index SYSTEM_ANNOUNCEMENTS.USER_ANNOUNCEMENTS_FK
go

if exists (select 1
            from  sysobjects
           where  id = object_id('SYSTEM_ANNOUNCEMENTS')
            and   type = 'U')
   drop table SYSTEM_ANNOUNCEMENTS
go

if exists (select 1
            from  sysobjects
           where  id = object_id('TALENT_MANAGERS')
            and   type = 'U')
   drop table TALENT_MANAGERS
go

if exists (select 1
            from  sysindexes
           where  id    = object_id('USERS')
            and   name  = 'LANG_USER_FK'
            and   indid > 0
            and   indid < 255)
   drop index USERS.LANG_USER_FK
go

if exists (select 1
            from  sysobjects
           where  id = object_id('USERS')
            and   type = 'U')
   drop table USERS
go

/*==============================================================*/
/* Table: ADMINISTRATORS                                        */
/*==============================================================*/
create table ADMINISTRATORS (
   USER_ID              numeric              not null,
   PREFERRED_LANG_ID    numeric              null,
   EMAIL_ADDRESS        varchar(255)         not null,
   PASSOWRD_HASH        varchar(255)         not null,
   FULL_NAME            varchar(150)         not null,
   USERNAME             varchar(50)          null,
   PHONE_NUMBER         varchar(20)          null,
   IS_ACTIVE            bit                  not null,
   FORCE_PASSWORD_CHANGE bit                  not null,
   LAST_LOGIN_AT        datetime             null,
   IS_SUPER_ADMIN       bit                  null,
   ASSIGNED_AT          datetime             not null,
   constraint PK_ADMINISTRATORS primary key (USER_ID)
)
go

/*==============================================================*/
/* Table: APPLICATION_TIMELINES                                 */
/*==============================================================*/
create table APPLICATION_TIMELINES (
   TIMELINE_EVENT_ID    numeric              identity,
   APPLICATION_ID       numeric              null,
   USER_ID              numeric              null,
   EVENT_TITLE          varchar(150)         not null,
   EVENT_DESCRIPTION    text                 null,
   EVENT_START_DATE     datetime             null,
   EVENT_END_DATE       datetime             null,
   REMINDER_AT          datetime             null,
   constraint PK_APPLICATION_TIMELINES primary key (TIMELINE_EVENT_ID)
)
go

/*==============================================================*/
/* Index: CONS_TIMELINES_FK                                     */
/*==============================================================*/




create nonclustered index CONS_TIMELINES_FK on APPLICATION_TIMELINES (USER_ID ASC)
go

/*==============================================================*/
/* Index: TIMELINES_APPLICATIONS_FK                             */
/*==============================================================*/




create nonclustered index TIMELINES_APPLICATIONS_FK on APPLICATION_TIMELINES (APPLICATION_ID ASC)
go

/*==============================================================*/
/* Table: APPLICATION_VALIDATION_LOGS                           */
/*==============================================================*/
create table APPLICATION_VALIDATION_LOGS (
   VALIDATION_LOG_ID    numeric              identity,
   USER_ID              numeric              null,
   APPLICATION_ID       numeric              not null,
   VALIDATOR_FUNCTION   varchar(50)          not null,
   VALIDATOR_ACTION     varchar(50)          not null,
   VALIDATIONS_COMMENTS text                 null,
   constraint PK_APPLICATION_VALIDATION_LOGS primary key (VALIDATION_LOG_ID)
)
go

/*==============================================================*/
/* Index: APPLICATIONS_VALIDATIONS_FK                           */
/*==============================================================*/




create nonclustered index APPLICATIONS_VALIDATIONS_FK on APPLICATION_VALIDATION_LOGS (APPLICATION_ID ASC)
go

/*==============================================================*/
/* Index: USERS_VALIDATIONS_FK                                  */
/*==============================================================*/




create nonclustered index USERS_VALIDATIONS_FK on APPLICATION_VALIDATION_LOGS (USER_ID ASC)
go

/*==============================================================*/
/* Table: AREAS                                                 */
/*==============================================================*/
create table AREAS (
   AREA_ID              numeric              identity,
   SERVICE_LINE_ID      numeric              not null,
   AREA_NAME            varchar(100)         not null,
   AREA_CODE            varchar(20)          null,
   AREA_DESCRIPTION     text                 null,
   constraint PK_AREAS primary key (AREA_ID)
)
go

/*==============================================================*/
/* Index: SL_AREAS_FK                                           */
/*==============================================================*/




create nonclustered index SL_AREAS_FK on AREAS (SERVICE_LINE_ID ASC)
go

/*==============================================================*/
/* Table: AWARDED_BADGES                                        */
/*==============================================================*/
create table AWARDED_BADGES (
   AWARDED_BADGES_ID    numeric              identity,
   VALIDATION_LOG_ID    numeric              null,
   APPLICATION_ID       numeric              not null,
   USER_ID              numeric              null,
   AWARDED_AT           datetime             not null,
   IS_PUBLISHED         bit                  null,
   PUBLIC_VERIFICATION_LINK varchar(500)         null,
   EXPIRATION_AT        datetime             null,
   POINTS_SNAPSHOT      int                  null,
   constraint PK_AWARDED_BADGES primary key (AWARDED_BADGES_ID)
)
go

/*==============================================================*/
/* Index: CONS_AWARDED_FK                                       */
/*==============================================================*/




create nonclustered index CONS_AWARDED_FK on AWARDED_BADGES (USER_ID ASC)
go

/*==============================================================*/
/* Index: AWARDED_APPLICATIONS2_FK                              */
/*==============================================================*/




create nonclustered index AWARDED_APPLICATIONS2_FK on AWARDED_BADGES (APPLICATION_ID ASC)
go

/*==============================================================*/
/* Index: VALIDATIONS_AWARDED_FK                                */
/*==============================================================*/




create nonclustered index VALIDATIONS_AWARDED_FK on AWARDED_BADGES (VALIDATION_LOG_ID ASC)
go

/*==============================================================*/
/* Table: BADGES                                                */
/*==============================================================*/
create table BADGES (
   BADGE_ID             numeric              identity,
   PROGRESSION_STAGE_ID numeric              not null,
   AREA_ID              numeric              not null,
   BADGE_TITLE          varchar(100)         not null,
   BADGE_DESCRIPTION    text                 null,
   BADGE_IMG_URL        varchar(500)         null,
   BADGE_SLUG           varchar(100)         null,
   BADGE_POINTS         int                  null,
   EXPIRATION_DURATION_DAYS int                  null,
   constraint PK_BADGES primary key (BADGE_ID),
   constraint AK_IDENTIFIER_SLUG_BADGES unique (BADGE_SLUG)
)
go

/*==============================================================*/
/* Index: STAGES_BADGES2_FK                                     */
/*==============================================================*/




create nonclustered index STAGES_BADGES2_FK on BADGES (PROGRESSION_STAGE_ID ASC)
go

/*==============================================================*/
/* Index: AREA_BADGES_FK                                        */
/*==============================================================*/




create nonclustered index AREA_BADGES_FK on BADGES (AREA_ID ASC)
go

/*==============================================================*/
/* Table: BADGE_APPLICATIONS                                    */
/*==============================================================*/
create table BADGE_APPLICATIONS (
   APPLICATION_ID       numeric              identity,
   TIMELINE_EVENT_ID    numeric              null,
   BADGE_ID             numeric              not null,
   CERTIFICATE_ID       numeric              null,
   AWARDED_BADGES_ID    numeric              null,
   USER_ID              numeric              null,
   APPLICATION_STATE    varchar(50)          not null 
      constraint CKC_APPLICATION_STATE_BADGE_AP check (APPLICATION_STATE IN ('Submitted', 'In Review', 'Approved', 'Rejected')),
   SUBMITTED_AT         datetime             null,
   CLOSED_AT            datetime             null,
   REVIEWER_NOTES       text                 null,
   constraint PK_BADGE_APPLICATIONS primary key (APPLICATION_ID)
)
go

/*==============================================================*/
/* Index: BADGES_APPLICATIONS_FK                                */
/*==============================================================*/




create nonclustered index BADGES_APPLICATIONS_FK on BADGE_APPLICATIONS (BADGE_ID ASC)
go

/*==============================================================*/
/* Index: CONS_APLLICATIONS_FK                                  */
/*==============================================================*/




create nonclustered index CONS_APLLICATIONS_FK on BADGE_APPLICATIONS (USER_ID ASC)
go

/*==============================================================*/
/* Index: TIMELINES_APPLICATIONS2_FK                            */
/*==============================================================*/




create nonclustered index TIMELINES_APPLICATIONS2_FK on BADGE_APPLICATIONS (TIMELINE_EVENT_ID ASC)
go

/*==============================================================*/
/* Index: APPLICATIONS_CERTIFICATES_FK                          */
/*==============================================================*/




create nonclustered index APPLICATIONS_CERTIFICATES_FK on BADGE_APPLICATIONS (CERTIFICATE_ID ASC)
go

/*==============================================================*/
/* Index: AWARDED_APPLICATIONS_FK                               */
/*==============================================================*/




create nonclustered index AWARDED_APPLICATIONS_FK on BADGE_APPLICATIONS (AWARDED_BADGES_ID ASC)
go

/*==============================================================*/
/* Table: BADGE_REQUIREMENTS                                    */
/*==============================================================*/
create table BADGE_REQUIREMENTS (
   REQUIREMENT_ID       numeric              identity,
   PROGRESSION_STAGE_ID numeric              not null,
   BADGE_ID             numeric              not null,
   REQUIREMENT_TITLE    varchar(150)         not null,
   REQUIREMENT_DESCRIPTION text                 not null,
   REQUIREMENT_IMG_URL  varchar(500)         null,
   REQUIREMENT_SEQUENCE int                  null,
   constraint PK_BADGE_REQUIREMENTS primary key (REQUIREMENT_ID)
)
go

/*==============================================================*/
/* Index: STAGES_REQUIREMENTS_FK                                */
/*==============================================================*/




create nonclustered index STAGES_REQUIREMENTS_FK on BADGE_REQUIREMENTS (PROGRESSION_STAGE_ID ASC)
go

/*==============================================================*/
/* Index: BADGES_REQUIREMENTS_FK                                */
/*==============================================================*/




create nonclustered index BADGES_REQUIREMENTS_FK on BADGE_REQUIREMENTS (BADGE_ID ASC)
go

/*==============================================================*/
/* Table: CERTIFICATES                                          */
/*==============================================================*/
create table CERTIFICATES (
   CERTIFICATE_ID       numeric              identity,
   APPLICATION_ID       numeric              not null,
   CERTIFICATE_TITLE    varchar(150)         not null,
   ISSUING_ENTITY       varchar(150)         null,
   ISSUE_DATE           datetime             null,
   CERTIFICATE_FILE_URL varchar(500)         null,
   constraint PK_CERTIFICATES primary key (CERTIFICATE_ID)
)
go

/*==============================================================*/
/* Index: APPLICATIONS_CERTIFICATES2_FK                         */
/*==============================================================*/




create nonclustered index APPLICATIONS_CERTIFICATES2_FK on CERTIFICATES (APPLICATION_ID ASC)
go

/*==============================================================*/
/* Table: CONSULTANTS                                           */
/*==============================================================*/
create table CONSULTANTS (
   USER_ID              numeric              not null,
   PREFERRED_LANG_ID    numeric              null,
   EMAIL_ADDRESS        varchar(255)         not null,
   PASSOWRD_HASH        varchar(255)         not null,
   FULL_NAME            varchar(150)         not null,
   USERNAME             varchar(50)          null,
   PHONE_NUMBER         varchar(20)          null,
   IS_ACTIVE            bit                  not null,
   FORCE_PASSWORD_CHANGE bit                  not null,
   LAST_LOGIN_AT        datetime             null,
   BIOGRAPHY            text                 null,
   PROFILE_IMG_URL      varchar(500)         null,
   GDPR_ACCEPTED        bit                  not null,
   ASSIGNED_AT          datetime             not null,
   constraint PK_CONSULTANTS primary key (USER_ID)
)
go

/*==============================================================*/
/* Table: CONSULTANT_AREAS                                      */
/*==============================================================*/
create table CONSULTANT_AREAS (
   USER_ID              numeric              not null,
   AREA_ID              numeric              not null,
   IS_PRIMARY           bit                  null,
   constraint PK_CONSULTANT_AREAS primary key (USER_ID, AREA_ID)
)
go

/*==============================================================*/
/* Index: CONSULTANT_AREAS_FK                                   */
/*==============================================================*/




create nonclustered index CONSULTANT_AREAS_FK on CONSULTANT_AREAS (USER_ID ASC)
go

/*==============================================================*/
/* Index: CONSULTANT_AREAS2_FK                                  */
/*==============================================================*/




create nonclustered index CONSULTANT_AREAS2_FK on CONSULTANT_AREAS (AREA_ID ASC)
go

/*==============================================================*/
/* Table: LEARNING_PATHS                                        */
/*==============================================================*/
create table LEARNING_PATHS (
   LEARNING_PATH_ID     numeric              identity,
   USER_ID              numeric              null,
   PATH_TITLE           varchar(150)         not null,
   PATH_SLUG            varchar(100)         null,
   PATH_DESCRIPTION     text                 null,
   constraint PK_LEARNING_PATHS primary key (LEARNING_PATH_ID),
   constraint AK_IDENTIFIER_SLUG_LEARNING unique (PATH_SLUG)
)
go

/*==============================================================*/
/* Index: ADMIN_LP_FK                                           */
/*==============================================================*/




create nonclustered index ADMIN_LP_FK on LEARNING_PATHS (USER_ID ASC)
go

/*==============================================================*/
/* Table: NOTIFICATIONS                                         */
/*==============================================================*/
create table NOTIFICATIONS (
   NOTIFICATION_ID      numeric              identity,
   NOTIFICATIONS_TYPE_ID numeric              not null,
   USER_ID              numeric              not null,
   NOTIFICATION_PAYLOAD text                 null,
   IS_READ              bit                  null,
   SENT_AT              datetime             not null,
   constraint PK_NOTIFICATIONS primary key (NOTIFICATION_ID)
)
go

/*==============================================================*/
/* Index: USER_NOTIFICATIONS_FK                                 */
/*==============================================================*/




create nonclustered index USER_NOTIFICATIONS_FK on NOTIFICATIONS (USER_ID ASC)
go

/*==============================================================*/
/* Index: NOT_TYPE_FK                                           */
/*==============================================================*/




create nonclustered index NOT_TYPE_FK on NOTIFICATIONS (NOTIFICATIONS_TYPE_ID ASC)
go

/*==============================================================*/
/* Table: NOTIFICATIONS_TYPE                                    */
/*==============================================================*/
create table NOTIFICATIONS_TYPE (
   NOTIFICATIONS_TYPE_ID numeric              identity,
   NOTIFICATIONS_TYPE   varchar(50)          null,
   constraint PK_NOTIFICATIONS_TYPE primary key (NOTIFICATIONS_TYPE_ID)
)
go

/*==============================================================*/
/* Table: POINTS_HISTORY                                        */
/*==============================================================*/
create table POINTS_HISTORY (
   POINTS_HISTORY_ID    numeric              identity,
   REQUIREMENT_ID       numeric              null,
   BADGE_ID             numeric              null,
   USER_ID              numeric              not null,
   POINTS_DELTA         int                  not null,
   JUSTIFICATION        text                 null,
   constraint PK_POINTS_HISTORY primary key (POINTS_HISTORY_ID)
)
go

/*==============================================================*/
/* Index: CONS_POINTS_FK                                        */
/*==============================================================*/




create nonclustered index CONS_POINTS_FK on POINTS_HISTORY (USER_ID ASC)
go

/*==============================================================*/
/* Index: BADGES_POINTS_FK                                      */
/*==============================================================*/




create nonclustered index BADGES_POINTS_FK on POINTS_HISTORY (BADGE_ID ASC)
go

/*==============================================================*/
/* Index: REQUIREMENTS_POINTS_FK                                */
/*==============================================================*/




create nonclustered index REQUIREMENTS_POINTS_FK on POINTS_HISTORY (REQUIREMENT_ID ASC)
go

/*==============================================================*/
/* Table: PREFERRED_LANG                                        */
/*==============================================================*/
create table PREFERRED_LANG (
   PREFERRED_LANG_ID    numeric              identity,
   PREFERRED_LANG       varchar(10)          not null,
   constraint PK_PREFERRED_LANG primary key (PREFERRED_LANG_ID),
   constraint AK_IDENTIFIER_LANG_PREFERRE unique (PREFERRED_LANG)
)
go

/*==============================================================*/
/* Table: PROGRESSION_STAGES                                    */
/*==============================================================*/
create table PROGRESSION_STAGES (
   PROGRESSION_STAGE_ID numeric              identity,
   AREA_ID              numeric              not null,
   BADGE_ID             numeric              null,
   STAGE_CODE_ID        numeric              not null,
   STAGE_TITLE          varchar(100)         not null,
   STAGE_SEQUENCE       int                  null,
   constraint PK_PROGRESSION_STAGES primary key (PROGRESSION_STAGE_ID)
)
go

/*==============================================================*/
/* Index: AREAS_STAGES_FK                                       */
/*==============================================================*/




create nonclustered index AREAS_STAGES_FK on PROGRESSION_STAGES (AREA_ID ASC)
go

/*==============================================================*/
/* Index: STAGES_BADGES_FK                                      */
/*==============================================================*/




create nonclustered index STAGES_BADGES_FK on PROGRESSION_STAGES (BADGE_ID ASC)
go

/*==============================================================*/
/* Index: STAGE_STAGECODES_FK                                   */
/*==============================================================*/




create nonclustered index STAGE_STAGECODES_FK on PROGRESSION_STAGES (STAGE_CODE_ID ASC)
go

/*==============================================================*/
/* Table: REQUIREMENTS_EVIDENCES                                */
/*==============================================================*/
create table REQUIREMENTS_EVIDENCES (
   EVIDENCE_ID          numeric              identity,
   REQUIREMENT_ID       numeric              null,
   APPLICATION_ID       numeric              not null,
   EVIDENCE_FILE_URL    varchar(500)         not null,
   EVIDENCE_FILE_TYPE   varchar(100)         null,
   EVIDENCE_TITLE       varchar(150)         null,
   EVIDENCE_DESCRIPTION text                 null,
   UPLOADED_AT          datetime             not null,
   IS_VERIFIED          bit                  null,
   constraint PK_REQUIREMENTS_EVIDENCES primary key (EVIDENCE_ID)
)
go

/*==============================================================*/
/* Index: REQUIREMENTS_EVIDENCES_FK                             */
/*==============================================================*/




create nonclustered index REQUIREMENTS_EVIDENCES_FK on REQUIREMENTS_EVIDENCES (REQUIREMENT_ID ASC)
go

/*==============================================================*/
/* Index: APPLICATIONS_EVIDENCES_FK                             */
/*==============================================================*/




create nonclustered index APPLICATIONS_EVIDENCES_FK on REQUIREMENTS_EVIDENCES (APPLICATION_ID ASC)
go

/*==============================================================*/
/* Table: SERVICES_LINES                                        */
/*==============================================================*/
create table SERVICES_LINES (
   SERVICE_LINE_ID      numeric              identity,
   LEARNING_PATH_ID     numeric              not null,
   SERVICE_LINE_NAME    varchar(100)         not null,
   SERVICE_LINE_DESCRIPTION text                 null,
   constraint PK_SERVICES_LINES primary key (SERVICE_LINE_ID)
)
go

/*==============================================================*/
/* Index: SL_LP_FK                                              */
/*==============================================================*/




create nonclustered index SL_LP_FK on SERVICES_LINES (LEARNING_PATH_ID ASC)
go

/*==============================================================*/
/* Table: SERVICE_LINE_LEADERS                                  */
/*==============================================================*/
create table SERVICE_LINE_LEADERS (
   USER_ID              numeric              not null,
   SERVICE_LINE_ID      numeric              not null,
   PREFERRED_LANG_ID    numeric              null,
   EMAIL_ADDRESS        varchar(255)         not null,
   PASSOWRD_HASH        varchar(255)         not null,
   FULL_NAME            varchar(150)         not null,
   USERNAME             varchar(50)          null,
   PHONE_NUMBER         varchar(20)          null,
   IS_ACTIVE            bit                  not null,
   FORCE_PASSWORD_CHANGE bit                  not null,
   LAST_LOGIN_AT        datetime             null,
   ASSIGNED_AT          datetime             not null,
   BIOGRAPHY            text                 null,
   PROFILE_IMG_URL      varchar(500)         null,
   constraint PK_SERVICE_LINE_LEADERS primary key (USER_ID)
)
go

/*==============================================================*/
/* Index: SL_SLL_FK                                             */
/*==============================================================*/




create nonclustered index SL_SLL_FK on SERVICE_LINE_LEADERS (SERVICE_LINE_ID ASC)
go

/*==============================================================*/
/* Table: SLA_DEFINITIONS                                       */
/*==============================================================*/
create table SLA_DEFINITIONS (
   SLA_ID               numeric              identity,
   USER_ID              numeric              not null,
   SLA_NAME             varchar(100)         not null,
   SLA_DESCRIPTION      text                 null,
   RESPONSE_TIME_HOURS  int                  not null,
   NOTIFICATION_EMAIL   varchar(255)         null,
   constraint PK_SLA_DEFINITIONS primary key (SLA_ID)
)
go

/*==============================================================*/
/* Index: ADMIN_SLA_FK                                          */
/*==============================================================*/




create nonclustered index ADMIN_SLA_FK on SLA_DEFINITIONS (USER_ID ASC)
go

/*==============================================================*/
/* Table: STAGE_CODES                                           */
/*==============================================================*/
create table STAGE_CODES (
   STAGE_CODE_ID        numeric              identity,
   STAGE_CODE           varchar(20)          null,
   constraint PK_STAGE_CODES primary key (STAGE_CODE_ID),
   constraint AK_IDENTIFIER_CODE_STAGE_CO unique (STAGE_CODE)
)
go

/*==============================================================*/
/* Table: SYSTEM_ANNOUNCEMENTS                                  */
/*==============================================================*/
create table SYSTEM_ANNOUNCEMENTS (
   ANNOUNCEMENT_ID      numeric              identity,
   USER_ID              numeric              not null,
   ANNOUNCEMENT_TITLE   varchar(150)         not null,
   ANNOUNCEMENT_MESSAGE text                 not null,
   IS_ACTIVE            bit                  not null,
   STARTS_AT            datetime             null,
   ENDS_AT              datetime             null,
   constraint PK_SYSTEM_ANNOUNCEMENTS primary key (ANNOUNCEMENT_ID)
)
go

/*==============================================================*/
/* Index: USER_ANNOUNCEMENTS_FK                                 */
/*==============================================================*/




create nonclustered index USER_ANNOUNCEMENTS_FK on SYSTEM_ANNOUNCEMENTS (USER_ID ASC)
go

/*==============================================================*/
/* Table: TALENT_MANAGERS                                       */
/*==============================================================*/
create table TALENT_MANAGERS (
   USER_ID              numeric              not null,
   PREFERRED_LANG_ID    numeric              null,
   EMAIL_ADDRESS        varchar(255)         not null,
   PASSOWRD_HASH        varchar(255)         not null,
   FULL_NAME            varchar(150)         not null,
   USERNAME             varchar(50)          null,
   PHONE_NUMBER         varchar(20)          null,
   IS_ACTIVE            bit                  not null,
   FORCE_PASSWORD_CHANGE bit                  not null,
   LAST_LOGIN_AT        datetime             null,
   BIOGRAPHY            text                 null,
   PROFILE_IMG_URL      varchar(500)         null,
   ASSIGNED_AT          datetime             not null,
   constraint PK_TALENT_MANAGERS primary key (USER_ID)
)
go

/*==============================================================*/
/* Table: USERS                                                 */
/*==============================================================*/
create table USERS (
   USER_ID              numeric              identity,
   PREFERRED_LANG_ID    numeric              null,
   EMAIL_ADDRESS        varchar(255)         not null,
   PASSOWRD_HASH        varchar(255)         not null,
   FULL_NAME            varchar(150)         not null,
   USERNAME             varchar(50)          null,
   PHONE_NUMBER         varchar(20)          null,
   IS_ACTIVE            bit                  not null,
   FORCE_PASSWORD_CHANGE bit                  not null,
   LAST_LOGIN_AT        datetime             null,
   constraint PK_USERS primary key (USER_ID),
   constraint AK_IDENTIFIER_EMAIL_USERS unique (EMAIL_ADDRESS),
   constraint AK_IDENTIFIER_USERNAM_USERS unique (USERNAME)
)
go

/*==============================================================*/
/* Index: LANG_USER_FK                                          */
/*==============================================================*/




create nonclustered index LANG_USER_FK on USERS (PREFERRED_LANG_ID ASC)
go

alter table ADMINISTRATORS
   add constraint FK_ADMINIST_USERS_INH_USERS foreign key (USER_ID)
      references USERS (USER_ID)
go

alter table APPLICATION_TIMELINES
   add constraint FK_APPLICAT_CONS_TIME_CONSULTA foreign key (USER_ID)
      references CONSULTANTS (USER_ID)
go

alter table APPLICATION_TIMELINES
   add constraint FK_APPLICAT_TIMELINES_BADGE_AP foreign key (APPLICATION_ID)
      references BADGE_APPLICATIONS (APPLICATION_ID)
go

alter table APPLICATION_VALIDATION_LOGS
   add constraint FK_APPLICAT_APPLICATI_BADGE_AP foreign key (APPLICATION_ID)
      references BADGE_APPLICATIONS (APPLICATION_ID)
go

alter table APPLICATION_VALIDATION_LOGS
   add constraint FK_APPLICAT_USERS_VAL_USERS foreign key (USER_ID)
      references USERS (USER_ID)
go

alter table AREAS
   add constraint FK_AREAS_SL_AREAS_SERVICES foreign key (SERVICE_LINE_ID)
      references SERVICES_LINES (SERVICE_LINE_ID)
go

alter table AWARDED_BADGES
   add constraint FK_AWARDED__AWARDED_A_BADGE_AP foreign key (APPLICATION_ID)
      references BADGE_APPLICATIONS (APPLICATION_ID)
go

alter table AWARDED_BADGES
   add constraint FK_AWARDED__CONS_AWAR_CONSULTA foreign key (USER_ID)
      references CONSULTANTS (USER_ID)
go

alter table AWARDED_BADGES
   add constraint FK_AWARDED__VALIDATIO_APPLICAT foreign key (VALIDATION_LOG_ID)
      references APPLICATION_VALIDATION_LOGS (VALIDATION_LOG_ID)
go

alter table BADGES
   add constraint FK_BADGES_AREA_BADG_AREAS foreign key (AREA_ID)
      references AREAS (AREA_ID)
go

alter table BADGES
   add constraint FK_BADGES_STAGES_BA_PROGRESS foreign key (PROGRESSION_STAGE_ID)
      references PROGRESSION_STAGES (PROGRESSION_STAGE_ID)
go

alter table BADGE_APPLICATIONS
   add constraint FK_BADGE_AP_APPLICATI_CERTIFIC foreign key (CERTIFICATE_ID)
      references CERTIFICATES (CERTIFICATE_ID)
go

alter table BADGE_APPLICATIONS
   add constraint FK_BADGE_AP_AWARDED_A_AWARDED_ foreign key (AWARDED_BADGES_ID)
      references AWARDED_BADGES (AWARDED_BADGES_ID)
go

alter table BADGE_APPLICATIONS
   add constraint FK_BADGE_AP_BADGES_AP_BADGES foreign key (BADGE_ID)
      references BADGES (BADGE_ID)
go

alter table BADGE_APPLICATIONS
   add constraint FK_BADGE_AP_CONS_APLL_CONSULTA foreign key (USER_ID)
      references CONSULTANTS (USER_ID)
go

alter table BADGE_APPLICATIONS
   add constraint FK_BADGE_AP_TIMELINES_APPLICAT foreign key (TIMELINE_EVENT_ID)
      references APPLICATION_TIMELINES (TIMELINE_EVENT_ID)
go

alter table BADGE_REQUIREMENTS
   add constraint FK_BADGE_RE_BADGES_RE_BADGES foreign key (BADGE_ID)
      references BADGES (BADGE_ID)
go

alter table BADGE_REQUIREMENTS
   add constraint FK_BADGE_RE_STAGES_RE_PROGRESS foreign key (PROGRESSION_STAGE_ID)
      references PROGRESSION_STAGES (PROGRESSION_STAGE_ID)
go

alter table CERTIFICATES
   add constraint FK_CERTIFIC_APPLICATI_BADGE_AP foreign key (APPLICATION_ID)
      references BADGE_APPLICATIONS (APPLICATION_ID)
go

alter table CONSULTANTS
   add constraint FK_CONSULTA_USERS_INH_USERS foreign key (USER_ID)
      references USERS (USER_ID)
go

alter table CONSULTANT_AREAS
   add constraint FK_CONSULTA_CONSULTAN_CONSULTA foreign key (USER_ID)
      references CONSULTANTS (USER_ID)
go

alter table CONSULTANT_AREAS
   add constraint FK_CONSULTA_CONSULTAN_AREAS foreign key (AREA_ID)
      references AREAS (AREA_ID)
go

alter table LEARNING_PATHS
   add constraint FK_LEARNING_ADMIN_LP_ADMINIST foreign key (USER_ID)
      references ADMINISTRATORS (USER_ID)
go

alter table NOTIFICATIONS
   add constraint FK_NOTIFICA_NOT_TYPE_NOTIFICA foreign key (NOTIFICATIONS_TYPE_ID)
      references NOTIFICATIONS_TYPE (NOTIFICATIONS_TYPE_ID)
go

alter table NOTIFICATIONS
   add constraint FK_NOTIFICA_USER_NOTI_USERS foreign key (USER_ID)
      references USERS (USER_ID)
go

alter table POINTS_HISTORY
   add constraint FK_POINTS_H_BADGES_PO_BADGES foreign key (BADGE_ID)
      references BADGES (BADGE_ID)
go

alter table POINTS_HISTORY
   add constraint FK_POINTS_H_CONS_POIN_CONSULTA foreign key (USER_ID)
      references CONSULTANTS (USER_ID)
go

alter table POINTS_HISTORY
   add constraint FK_POINTS_H_REQUIREME_BADGE_RE foreign key (REQUIREMENT_ID)
      references BADGE_REQUIREMENTS (REQUIREMENT_ID)
go

alter table PROGRESSION_STAGES
   add constraint FK_PROGRESS_AREAS_STA_AREAS foreign key (AREA_ID)
      references AREAS (AREA_ID)
go

alter table PROGRESSION_STAGES
   add constraint FK_PROGRESS_STAGES_BA_BADGES foreign key (BADGE_ID)
      references BADGES (BADGE_ID)
go

alter table PROGRESSION_STAGES
   add constraint FK_PROGRESS_STAGE_STA_STAGE_CO foreign key (STAGE_CODE_ID)
      references STAGE_CODES (STAGE_CODE_ID)
go

alter table REQUIREMENTS_EVIDENCES
   add constraint FK_REQUIREM_APPLICATI_BADGE_AP foreign key (APPLICATION_ID)
      references BADGE_APPLICATIONS (APPLICATION_ID)
go

alter table REQUIREMENTS_EVIDENCES
   add constraint FK_REQUIREM_REQUIREME_BADGE_RE foreign key (REQUIREMENT_ID)
      references BADGE_REQUIREMENTS (REQUIREMENT_ID)
go

alter table SERVICES_LINES
   add constraint FK_SERVICES_SL_LP_LEARNING foreign key (LEARNING_PATH_ID)
      references LEARNING_PATHS (LEARNING_PATH_ID)
go

alter table SERVICE_LINE_LEADERS
   add constraint FK_SERVICE__SL_SLL_SERVICES foreign key (SERVICE_LINE_ID)
      references SERVICES_LINES (SERVICE_LINE_ID)
go

alter table SERVICE_LINE_LEADERS
   add constraint FK_SERVICE__USERS_INH_USERS foreign key (USER_ID)
      references USERS (USER_ID)
go

alter table SLA_DEFINITIONS
   add constraint FK_SLA_DEFI_ADMIN_SLA_ADMINIST foreign key (USER_ID)
      references ADMINISTRATORS (USER_ID)
go

alter table SYSTEM_ANNOUNCEMENTS
   add constraint FK_SYSTEM_A_USER_ANNO_USERS foreign key (USER_ID)
      references USERS (USER_ID)
go

alter table TALENT_MANAGERS
   add constraint FK_TALENT_M_USERS_INH_USERS foreign key (USER_ID)
      references USERS (USER_ID)
go

alter table USERS
   add constraint FK_USERS_LANG_USER_PREFERRE foreign key (PREFERRED_LANG_ID)
      references PREFERRED_LANG (PREFERRED_LANG_ID)
go

