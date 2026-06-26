# Chapter 3: Database Schema Diagrams - Required Images

This document outlines all necessary database schema diagram images for Chapter 3 of the project report.

---

## 1. User Hierarchy & RBAC Architecture

**Purpose**: Illustrate the user role structure and inheritance model.

**Tables to include**:
- `users` (base table with user_role enum)
- `administrators` (with super_admin flag)
- `consultants` (with biography, GDPR consent)
- `talent_managers` (with biography)
- `service_line_leaders` (with service_line_id, biography)
- Supporting: `user_account_tokens`, `user_refresh_tokens`

**Key relationships**: Users → Role-specific tables (1-to-1 inheritance)

---

## 2. Content Hierarchy & Progression Structure

**Purpose**: Show the complete content organization chain from top-level learning paths to individual badges.

**Tables to include**:
- `learning_paths` (top-level container)
- `service_lines` (child of learning_paths)
- `areas` (child of service_lines)
- `progression_stages` (child of areas)
- `stage_codes` (reference table for stage types)
- `badges` (child of progression_stages)

**Key relationships**: Learning Paths → Service Lines → Areas → Progression Stages → Badges

---

## 3. Badge Application Workflow

**Purpose**: Visualize the complete badge application lifecycle and validation process.

**Tables to include**:
- `badge_applications` (with application_state enum: Open, Submitted, In validation, Accepted, Rejected)
- `application_validation_logs` (audit trail of all transitions)
- `awarded_badges` (final badge award record with public_verification_link, expiration_at)
- `certificates` (supporting evidence documents)

**Key relationships**: Badge Application → Validation Logs → Awarded Badges, Certificates

---

## 4. Badge Requirements & Skills

**Purpose**: Detail the requirements structure and skill association model.

**Tables to include**:
- `badges` (parent)
- `badge_requirements` (many requirements per badge)
- `badge_skills` (many-to-many linking badges to skills)
- `skills` (skill catalog)
- `consultants_selected_skills` (consultant skill preferences)

**Key relationships**: 
- Badges → (1-to-many) Badge Requirements
- Badges → (many-to-many) Skills via badge_skills
- Consultants → (many-to-many) Skills via consultants_selected_skills

---

## 5. Gamification & Points System

**Purpose**: Show the points accumulation and tracking mechanism.

**Tables to include**:
- `badges` (badge_points field)
- `badge_requirements` (badge_points field)
- `points_history` (permanent audit log with user_id, badge_id, points_value, earned_at)
- `awarded_badges` (points_snapshot field)

**Key relationships**: Badge Application → Points History → Cumulative User Points

---

## 6. Consultant Profile & Areas

**Purpose**: Illustrate consultant account structure and area assignments.

**Tables to include**:
- `users` (base user data: full_name, email_address, phone_number, profile_img_url, location_id)
- `consultants` (biography, GDPR consent)
- `consultant_areas` (many-to-many with is_primary flag)
- `areas` (area details)
- `locations` (location reference)

**Key relationships**: Consultant → (many-to-many) Areas, Consultant → Location

---

## 7. Notification System

**Purpose**: Show the notification mechanism and user preference management.

**Tables to include**:
- `notifications` (notification records)
- `notification_definitions` (template definitions)
- `notification_preferences` (system-wide settings)
- `user_notification_preferences` (per-user overrides)
- `device_tokens` (Firebase device registration)

**Key relationships**: Notifications → User Preferences, Device Tokens for push delivery

---

## 8. SLA Management & Service Lines

**Purpose**: Visualize Service Level Agreement tracking and management.

**Tables to include**:
- `service_lines` (parent)
- `slas` (SLA definitions)
- `sl_slas` (many-to-many linking SLAs to service_lines)
- `sla_breach_alerts` (breach notifications)

**Key relationships**: Service Lines → (many-to-many) SLAs → Breach Alerts

---

## 9. System Announcements & Alerts

**Purpose**: Show the communication and alert distribution system.

**Tables to include**:
- `system_announcements` (global announcements)
- `announc_roles` (role-specific announcements)
- `announc_sl` (service line-specific announcements)
- `sla_breach_alerts` (SLA-related alerts)

**Key relationships**: Announcements → Role/Service Line targeting

---

## 10. GDPR & Compliance

**Purpose**: Illustrate consent management and GDPR compliance tracking.

**Tables to include**:
- `gdpr_policies` (with policy_type enum: Privacy, Terms, Cookies)
- `gdpr_consent_history` (audit trail with IP address, user agent, timestamp)
- `users` (email_confirmed field)

**Key relationships**: Users → GDPR Policies → Consent History (immutable audit trail)

---

## 11. Goals & Milestones

**Purpose**: Show user goal tracking and milestone management.

**Tables to include**:
- `goals` (user_id, badge_id, application_id references)
- `users` (context reference)
- `badges` (context reference)

**Key relationships**: Goals → (flexible FK to) Users/Badges/Applications

---

## 12. Languages & Localization

**Purpose**: Illustrate the multi-language support and user language preferences.

**Tables to include**:
- `languages` (language_code, language_name — supports pt-PT, en-GB, es-ES)
- `users` (language_id foreign key)

**Key relationships**: Users → Languages (default is Portuguese pt-PT)

---

## Optional Context Diagrams

### Authentication Flow Diagram
Illustrate the token lifecycle:
- Account confirmation tokens (`user_account_tokens` with type='CONFIRMATION')
- Password reset tokens (`user_account_tokens` with type='PASSWORD_RESET')
- Refresh tokens (`user_refresh_tokens` with is_persistent flag for "remember me")

### Badge Application State Machine
Simplified flowchart showing:
- 5 application states: Open → Submitted → In validation → Accepted/Rejected
- Actor transitions per state: Consultant → Talent Manager → Service Line Leader
- Immutable logging to `application_validation_logs`

---

## Summary

**Total Required Diagrams**: 12 core + 2 optional = 14 diagrams

**Recommended Grouping for Report**:
- Section 3.1: User & Role Management (Diagram 1)
- Section 3.2: Content Organization (Diagram 2)
- Section 3.3: Badge Lifecycle (Diagrams 3, 4, 5)
- Section 3.4: Consultant Features (Diagrams 6, 7, 11, 12)
- Section 3.5: Administrative & Compliance (Diagrams 8, 9, 10)
- Section 3.6: Workflows (Optional diagrams)
