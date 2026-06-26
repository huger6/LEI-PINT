# CLAUDE.md

## Project Overview

The Softinsa Badge Platform is a gamified, web-based digital credential management system similar to Credly. It allows the company to track, validate, and standardize the technological certifications and skills of its consultants through dynamic Learning Paths, Service Lines, and Areas.

This project scope is focused strictly on the **Web Front-Office application, Backend REST API, and PostgreSQL 18 Database layer**.
Tech stack to use on the API (excluding framework or independent packages): Node.js, Express.js, Javascript, JWT
Tech stack to use on web (excluding framework or independent packages): React, React Router, Javacript, Bootstrap

---

## Architecture & Technology Stack

### Database Layer

- **DBMS**: PostgreSQL 18 (utilizing strict foreign keys, check constraints, and performance-tuned GIN/Btree tracking indexes).
- 
    
    **Core Hierarchy Data Model**: learning_paths $\rightarrow$ service_lines $\rightarrow$ areas $\rightarrow$ progression_stages $\rightarrow$ badges $\rightarrow$ badge_requirements.
    

### Security & Protocol Constraints

- 
    
    **Transport Encryption**: All server-client communications must strictly use HTTPS.
    
- 
    
    **Session Security**: Support persistent sessions ("remember me" features) via secure login credentials validating email and password configurations.
    

---

## Domain Rules & Core Workflows

### 1. User Profiles & RBAC Matrix

- 
    
    **Administrator**: Platform manager who creates users, assigns platform roles, customizes the point engine, manages active global alerts, defines team SLAs, and creates/modifies content entities.
    
- 
    
    **Consultant**: User who updates profile information, reviews available skill catalogs, tracks progress dashboards, uploads qualification files, and shares earned credentials.
    
- 
    
    **Talent Manager**: Global reviewer who evaluates proof documents for all application requests independent of specific service line groups.
    
- 
    
    **Service Line Leader**: Final gatekeeper restricted to reviewing or acting on applications occurring within their explicitly registered Service Line and Area assignments.
    

### 2. Badge Application Workflow States

Badge progression maps directly across five distinct state flags managed inside the badge_applications engine:

| **Database State** | **Description / Transition Event** | **Next Allowed Actor** |
| --- | --- | --- |
| `Open` | Default initial state, or an application returned back to the consultant due to improper/missing files.   | Consultant    |
| `Submitted` | Consultant finishes adding required files and locks the application for validation.   | Talent Manager    |
| `In validation` | Talent Manager verifies the file correctness and passes the record upstream.   | Service Line Leader    |
| `Accepted` | Service Line Leader provides final sign-off; the badge is generated and published.   | System (Closed)    |
| `Rejected` | Service Line Leader denies the application and logs concluding feedback comments.   | System (Closed)    |

### 3. Gamification & System Logic

- 
    
    **Point Persistence**: Accumulation points are permanently preserved on the consultant's record profile even if an underlying badge reaches an expiration limit.
    
- 
    
    **Badge Unlock Rule**: Consultants can submit an application for any specific stage level directly without having to earn badges for lower stages beforehand.
    
- 
    
    **Public Verifiability**: Every earned credential must output a unique public web address URL configuration used for external verification lookups and corporate email signature integrations.
    

---

## Code & Design Style Guidelines

### General Guidelines

- Keep code modularized.
- Re-use code if possible.
- Any code written or edited must be re-usable, unless deemed otherwise (something very specific).
- Always ask if in doubt.


### API Design Guidelines

- Use clear RESTful path conventions (e.g., POST /api/v1/applications, PATCH /api/v1/applications/:id/status).
- JSON body parameters and response fields must follow strict schema configurations reflecting database attributes.
- Return standardized HTTP response status codes: 200 OK for successes, 400 Bad Request for validation misses, 401 Unauthorized for auth gaps, 403 Forbidden for RBAC boundary breaches.
- Every controller that receives data should validate it via a Zod schema (modularized in /validations folder).
- Always use the ORM syntax when querying the DB, if possible.
- On change, scan if a cache invalidation call is required.
- Never expose or accept as argument(for a route) a table's PK ID if a GUID or slug is available.

### Database Operations Rules

- Naming matching database conventions: all tables, column mappings, and index hooks are written lowercase using snake_case syntax.
- Every mutation changing an application's workflow path must append an immutable logging transaction record into the application_validation_logs audit trail table.
- Primary keys utilize automated database sequence identity controls. UUID strings are preserved for unique safe exposure mappings (user_guid, application_guid).
- Every change on PINT_SCRIPT.sql must result in the respective change in api/src/models.

### Web Guidelines

- Always use components for generalized styling, if possible. Components should be placed in web/src/components folder.
- Use inline styling only for bootstrap related classes.
- Use .module.css file for custom styling relative to a specific component/page.
- Always use main variables as colors in web/src/assets/styles/colors.css file.
- Do not repeat API calls if possible, instead, use contexts to avoid this problem.
- Styling must be a mix of bootstrap when possible but always following a modern approach with rounded corners and project theme based colors.
- Always ensure a responsive design for until at least 300px width.
- When integrating with the API, always check the correct endpoint and expected values beforehand.
- A file should only contain one component. Therefore, a component should be created in a folder specificaly for that component and contain a .jsx file and a .module.css file.

### Mobile Guidelines

- Follow an offline-first architecture approach. All UI screens must be fed exclusively by the local database, with the sole exception being the login/authentication screens.
- The application listens to Firebase notifications for database mutations. Receiving a notification(non push notification) must trigger a background REST API fetch to synchronize and update the local database.
- Pages: Must be created strictly under Mobile/lib/ui/pages/theme_directory.
- Widgets: Must be created strictly under Mobile/lib/ui/widgets/theme_directory.
- Page files are strictly for layout composition. You must never declare or build custom widgets inside a page file. Pages must exclusively invoke pre-existing components from the widgets directory.
- Never duplicate UI logic. Before creating a new widget, scan the widgets directory to ensure a similar component does not already exist. Maximize reusability for all new widgets.
- Ensure responsive design practices are applied to support varying mobile screen dimensions. The application layout is strictly locked to portrait orientation (device rotation is forbidden).
- Hardcoding colors in UI components is strictly forbidden. Always implement colors by invoking the predefined variables located exclusively in the Mobile/lib/core/theme directory. Variables follow functional semantic naming (e.g., primary, error, surface) to ensure scalability and ease of future theme modifications.
- If a required widget is not available during page composition, it must first be developed within the appropriate Mobile/lib/ui/widgets/theme_directory. This new widget must strictly follow the architectural logic and styling patterns of existing components before being finally instantiated in the target page.
- When doing changes in the Mobile part of the project never change the api part of the project


### Validation & Error Handling Architecture

- All fiedls validated in frontend must be validated on backend and vice-versa.
- Invalid field records passed down to web interfaces must trigger strict field-specific red highlight error messages, unless specified otherwise.
- Maintain clear database lookup integrity matching supported application strings:
    - **Role Names**: Consultant, Talent Manager, Service Line Leader, Administrator
    - **Languages**: pt-PT, en-GB, es-ES 
    - **Application States**: Open, Submitted, In validation, Accepted, Rejected

### Internationalization & Notification Mechanics

- **Language Engines**: Provide language rendering lookups supporting Portuguese, English, and Spanish localized messages.
    
- **Time-Based Greeting Rules**:
    - Display a general "Bem-vindo!" context message on an initial account registration or immediate first system authentication.
    - Display "Seja bem-vindo novamente" when a user returns after a period greater than 15 days without logging in.
    - Default to standard day part greetings ("Bom dia!", "Boa Tarde!", or "Boa Noite!") for all remaining normal application entries.

### Business logic

- Consultants are the focus of the project, therefore, it's easier to say what the other roles should NOT have:
    - **Talent Manager(TM)**: Similar to HR, does not have Service Line (SL) or Area. This means that these fiels should not be shown when talking/refering about this role (this rule follows to the remaining roles that do not have a certain field).
    - **Service Line Leader(SLL)**: Has a SL associated with him (he manages it). Has no area.
    - **Admin**: Has no SL or Area. Can see everything and edit/delete anything.