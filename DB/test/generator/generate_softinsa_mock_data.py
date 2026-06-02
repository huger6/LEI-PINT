#!/usr/bin/env python3
"""
Generate realistic mock data for the Softinsa badge platform.

The script emits a standalone PostgreSQL SQL file made of INSERT statements.
It targets the schema in DB/PINT_SCRIPT.sql and intentionally skips auth-token
tables: user_account_tokens and user_refresh_tokens.
"""

from __future__ import annotations

import argparse
import random
import re
import unicodedata
import uuid
from datetime import date, datetime, time, timedelta, timezone
from pathlib import Path


# --- CONFIGURATION SETTINGS -------------------------------------------------
# Change these values to tune the volume of generated data per logical area.
OUTPUT_SQL_FILE = "softinsa_mock_data.sql"
RANDOM_SEED = 20260521
BASE_NOW = datetime(2026, 5, 21, 12, 0, 0, tzinfo=timezone.utc)

NUM_LEARNING_PATHS = 3
NUM_SERVICE_LINES_PER_PATH = 5
NUM_AREAS_PER_SERVICE_LINE = 2
NUM_CONSULTANTS = 50
NUM_TALENT_MANAGERS = 3
NUM_ADMINISTRATORS = 2
NUM_SL_LEADERS = NUM_LEARNING_PATHS * NUM_SERVICE_LINES_PER_PATH
NUM_BADGE_APPLICATIONS = 150

NUM_REQUIREMENTS_PER_BADGE = 3
NUM_GDPR_POLICIES = 3
NUM_SLAS = 6
NUM_SYSTEM_ANNOUNCEMENTS = 8
NUM_GOALS = 80
NUM_NOTIFICATIONS = 180
NUM_USER_BADGE_INTERACTIONS = 220
INCLUDE_SEQUENCE_RESETS = True
# ----------------------------------------------------------------------------


LANGUAGES = [
    ("pt-PT", "Português"),
    ("en-GB", "English"),
    ("es-ES", "Español"),
]

LOCATIONS = [
    "Lisboa",
    "Tomar",
    "Viseu",
    "Vila Real",
    "Fundão",
    "Portalegre",
    "Remote",
]

STAGE_CODES = ["A", "B", "C", "D", "E"]

STAGE_NAMES = {
    "A": ("Foundation", 1, "Builds supervised delivery capability and core terminology."),
    "B": ("Practitioner", 2, "Delivers predictable work with growing technical autonomy."),
    "C": ("Advanced", 3, "Handles complex scenarios and contributes reusable practices."),
    "D": ("Expert", 4, "Leads technical direction and mentors delivery teams."),
    "E": ("Principal", 5, "Shapes strategy, governance and cross-team excellence."),
}

SKILL_CATALOG = [
    ("Python", "Backend automation, APIs and data processing with Python."),
    ("Java", "Enterprise application development with the Java ecosystem."),
    ("JavaScript", "Modern browser and Node.js application development."),
    ("TypeScript", "Typed application development for scalable frontend and backend systems."),
    ("React", "Component-based web interfaces and stateful user experiences."),
    ("Angular", "Enterprise single-page applications using Angular."),
    ("Node.js", "Server-side JavaScript services and integration APIs."),
    ("PostgreSQL", "Relational data modelling, SQL tuning and PostgreSQL operations."),
    ("SQL Server", "Microsoft SQL Server development and administration."),
    ("MongoDB", "Document database modelling and query patterns."),
    ("Redis", "Caching, queues and low-latency data access patterns."),
    ("AWS Cloud", "Cloud-native architecture and managed services on AWS."),
    ("Azure Cloud", "Microsoft Azure architecture, governance and services."),
    ("IBM Cloud", "Hybrid cloud workloads and IBM Cloud services."),
    ("Docker", "Container packaging, local orchestration and runtime hygiene."),
    ("Kubernetes", "Cluster orchestration, deployments and service operations."),
    ("Terraform", "Infrastructure as code and repeatable cloud provisioning."),
    ("GitHub Actions", "CI/CD pipelines and automated quality gates."),
    ("Jenkins", "Build automation and release orchestration."),
    ("DevSecOps", "Security controls embedded in delivery pipelines."),
    ("OpenShift", "Enterprise Kubernetes deployments and platform operations."),
    ("Linux", "Shell operations, service management and troubleshooting."),
    ("REST APIs", "Resource-oriented API design, documentation and integration."),
    ("GraphQL", "Schema-driven API development and client data orchestration."),
    ("Microservices", "Distributed services design, deployment and observability."),
    ("Event-Driven Architecture", "Asynchronous systems with events, streams and queues."),
    ("Kafka", "Streaming platforms, topics and event processing."),
    ("RabbitMQ", "Message broker integration and reliable asynchronous workflows."),
    ("Power BI", "Business intelligence dashboards and data modelling."),
    ("Tableau", "Visual analytics and dashboard storytelling."),
    ("Data Engineering", "Data pipelines, orchestration and quality controls."),
    ("Apache Spark", "Distributed data processing and analytics engineering."),
    ("dbt", "Analytics engineering, transformations and lineage."),
    ("Machine Learning", "Applied model development and operational evaluation."),
    ("MLOps", "Model deployment, monitoring and lifecycle management."),
    ("Cybersecurity", "Secure design, threat awareness and control implementation."),
    ("Identity and Access Management", "Authentication, authorization and access governance."),
    ("Observability", "Metrics, logs, traces and production diagnostics."),
    ("Agile Delivery", "Iterative planning, delivery cadence and team ceremonies."),
    ("Scrum", "Scrum practices, facilitation and continuous improvement."),
    ("ITIL", "Service management practices and operational governance."),
    ("Business Analysis", "Requirements discovery, process modelling and stakeholder alignment."),
    ("Quality Assurance", "Test strategy, automation and defect prevention."),
    ("Test Automation", "Automated regression coverage and maintainable test suites."),
    ("Accessibility", "Inclusive interface design and WCAG-oriented quality practices."),
]

FIRST_NAMES = [
    "Ana", "Andre", "Beatriz", "Bruno", "Carla", "Carlos", "Catarina",
    "Daniel", "Diana", "Diogo", "Eduardo", "Filipa", "Francisco", "Helena",
    "Ines", "Joana", "Joao", "Jose", "Leonor", "Luis", "Mafalda", "Manuel",
    "Marta", "Miguel", "Nuno", "Patricia", "Paulo", "Pedro", "Raquel",
    "Rita", "Ruben", "Sara", "Sofia", "Tiago", "Vera",
]

LAST_NAMES = [
    "Almeida", "Antunes", "Barbosa", "Cardoso", "Carvalho", "Castro",
    "Costa", "Fernandes", "Ferreira", "Figueiredo", "Gomes", "Lopes",
    "Marques", "Martins", "Matos", "Mendes", "Monteiro", "Moreira",
    "Neves", "Nogueira", "Oliveira", "Pereira", "Ribeiro", "Rocha",
    "Rodrigues", "Santos", "Silva", "Soares", "Sousa", "Teixeira",
    "Vieira",
]

LEARNING_PATH_BASES = [
    "Hybrid Cloud Academy",
    "Automation and Integration",
    "Data and AI Engineering",
    "Digital Product Delivery",
    "Cybersecurity and Governance",
]

SERVICE_LINE_BASES = [
    "Hybrid Cloud",
    "Automation",
    "Data Engineering",
    "Application Modernization",
    "DevSecOps Platform",
    "Integration APIs",
    "Quality Engineering",
    "Business Analysis",
    "AI Solutions",
    "Cyber Resilience",
]

AREA_BASES = [
    "Core Delivery",
    "Advanced Engineering",
    "Platform Operations",
    "Solution Architecture",
    "Client Excellence",
]

TARGET_PROFILES = ["Consultant", "Talent Manager", "Service Line Leader", "Administrator"]
NOTIFICATION_TYPES = [
    "HOME",
    "BADGES",
    "APPLICATIONS",
    "ACHIEVEMENTS",
    "POINTS",
    "OBJECTIVES",
    "EVOLUTION",
    "ANNOUNCEMENTS",
    "SYSTEM",
]
APPLICATION_STATES = ["Accepted", "Submitted", "In validation", "Open", "Rejected"]
INTERACTION_TYPES = ["VIEW", "SHARE_LINKEDIN", "FAVORITE"]

CONFIRMED_PASSWORD_HASH = "$2b$10$HeVPLvvIURQ2EyMdp3frJ.snlFd5F4EqF646Fss4f5LNBzoykYG9G"
UNCONFIRMED_PASSWORD_HASH = "$2b$10$softinsa.mock.hash.for.local.testing"


class IdFactory:
    def __init__(self) -> None:
        self._next: dict[str, int] = {}

    def next(self, table: str) -> int:
        value = self._next.get(table, 1)
        self._next[table] = value + 1
        return value


class SqlWriter:
    def __init__(self) -> None:
        self.lines: list[str] = []

    def comment(self, text: str = "") -> None:
        if text:
            self.lines.append(f"-- {text}")
        else:
            self.lines.append("")

    def section(self, title: str) -> None:
        self.lines.extend(["", f"-- {title}", ""])

    def insert(self, table: str, row: dict[str, object]) -> None:
        columns = ", ".join(row.keys())
        values = ", ".join(sql_value(value) for value in row.values())
        self.lines.append(f"INSERT INTO {table} ({columns}) VALUES ({values});")

    def extend(self, lines: list[str]) -> None:
        self.lines.extend(lines)

    def render(self) -> str:
        return "\n".join(self.lines).strip() + "\n"


def strip_accents(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    return "".join(ch for ch in normalized if not unicodedata.combining(ch))


def slugify(value: str) -> str:
    value = strip_accents(value).lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def username_from_name(full_name: str, used: set[str]) -> str:
    parts = strip_accents(full_name).lower().split()
    base = f"{parts[0]}.{parts[-1]}"
    base = re.sub(r"[^a-z0-9.]+", "", base)[:42]
    username = base
    suffix = 2
    while username in used:
        username = f"{base}{suffix}"
        suffix += 1
    used.add(username)
    return username


def make_person(used_usernames: set[str]) -> tuple[str, str, str]:
    full_name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
    username = username_from_name(full_name, used_usernames)
    email = f"{username}@softinsa.pt"
    return full_name, username, email


def sql_value(value: object) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"
    if isinstance(value, int):
        return str(value)
    if isinstance(value, uuid.UUID):
        return f"'{value}'::uuid"
    if isinstance(value, datetime):
        timestamp = value.astimezone(timezone.utc).isoformat(timespec="seconds")
        return f"'{timestamp}'::timestamptz"
    if isinstance(value, date) and not isinstance(value, datetime):
        return f"'{value.isoformat()}'::date"
    if isinstance(value, time):
        return f"'{value.isoformat(timespec='seconds')}'::time"
    escaped = str(value).replace("'", "''")
    return f"'{escaped}'"


def validate_config() -> None:
    minimums = {
        "NUM_LEARNING_PATHS": NUM_LEARNING_PATHS,
        "NUM_SERVICE_LINES_PER_PATH": NUM_SERVICE_LINES_PER_PATH,
        "NUM_AREAS_PER_SERVICE_LINE": NUM_AREAS_PER_SERVICE_LINE,
        "NUM_CONSULTANTS": NUM_CONSULTANTS,
        "NUM_TALENT_MANAGERS": NUM_TALENT_MANAGERS,
        "NUM_ADMINISTRATORS": NUM_ADMINISTRATORS,
        "NUM_SL_LEADERS": NUM_SL_LEADERS,
        "NUM_BADGE_APPLICATIONS": NUM_BADGE_APPLICATIONS,
        "NUM_REQUIREMENTS_PER_BADGE": NUM_REQUIREMENTS_PER_BADGE,
        "NUM_SLAS": NUM_SLAS,
        "NUM_SYSTEM_ANNOUNCEMENTS": NUM_SYSTEM_ANNOUNCEMENTS,
        "NUM_GOALS": NUM_GOALS,
        "NUM_NOTIFICATIONS": NUM_NOTIFICATIONS,
        "NUM_USER_BADGE_INTERACTIONS": NUM_USER_BADGE_INTERACTIONS,
    }
    invalid = [name for name, value in minimums.items() if value < 1]
    if invalid:
        raise ValueError(f"These settings must be at least 1 for full table coverage: {', '.join(invalid)}")


def random_past_datetime(days_back_min: int, days_back_max: int) -> datetime:
    days = random.randint(days_back_min, days_back_max)
    hours = random.randint(0, 23)
    minutes = random.choice([0, 15, 30, 45])
    return BASE_NOW - timedelta(days=days, hours=hours, minutes=minutes)


def clamp_before_now(value: datetime) -> datetime:
    return min(value, BASE_NOW - timedelta(hours=1))


def sequence_reset_lines(tables: list[tuple[str, str]]) -> list[str]:
    lines = ["", "-- Keep identity sequences aligned with explicit generated IDs."]
    for table, column in tables:
        lines.append(
            "SELECT setval(pg_get_serial_sequence("
            f"'{table}', '{column}'), "
            f"(SELECT COALESCE(MAX({column}), 1) FROM {table}), true);"
        )
    return lines


def generate_sql() -> str:
    validate_config()
    random.seed(RANDOM_SEED)

    ids = IdFactory()
    sql = SqlWriter()

    languages: dict[str, int] = {}
    locations: dict[str, int] = {}
    stage_codes: dict[str, int] = {}
    admins: list[dict[str, object]] = []
    consultants: list[dict[str, object]] = []
    talent_managers: list[dict[str, object]] = []
    sl_leader_users: list[dict[str, object]] = []
    users: list[dict[str, object]] = []
    learning_paths: list[dict[str, object]] = []
    service_lines: list[dict[str, object]] = []
    areas: list[dict[str, object]] = []
    progression_stages: list[dict[str, object]] = []
    badges: list[dict[str, object]] = []
    requirements_by_badge: dict[int, list[dict[str, object]]] = {}
    skills: list[dict[str, object]] = []
    gdpr_policies: list[dict[str, object]] = []
    notification_definitions: list[dict[str, object]] = []
    slas: list[dict[str, object]] = []
    system_announcements: list[dict[str, object]] = []
    goals: list[dict[str, object]] = []
    applications: list[dict[str, object]] = []
    evidences: list[dict[str, object]] = []
    validation_logs: list[dict[str, object]] = []
    awarded_badges: list[dict[str, object]] = []
    certificates: list[dict[str, object]] = []
    points_history: list[dict[str, object]] = []

    used_usernames: set[str] = set()

    sql.comment("Generated Softinsa mock data for PostgreSQL 18.")
    sql.comment("Run against a clean schema created from DB/PINT_SCRIPT.sql.")
    sql.comment("Auth token tables are intentionally excluded.")
    sql.comment("service_line_leaders are inserted after service_lines because service_line_id is NOT NULL.")
    sql.extend(["", "BEGIN;"])

    sql.section("1. Static Lookup Data")
    for iso, name in LANGUAGES:
        language_id = ids.next("languages")
        languages[iso] = language_id
        sql.insert("languages", {
            "language_id": language_id,
            "language_iso": iso,
            "language_name": name,
        })

    for location_name in LOCATIONS:
        location_id = ids.next("locations")
        locations[location_name] = location_id
        sql.insert("locations", {
            "location_id": location_id,
            "location_name": location_name,
        })

    for code in STAGE_CODES:
        stage_code_id = ids.next("stage_codes")
        stage_codes[code] = stage_code_id
        sql.insert("stage_codes", {
            "stage_code_id": stage_code_id,
            "stage_code": code,
        })

    sql.section("2. Core Users")

    def add_user(role: str, full_name: str | None = None) -> dict[str, object]:
        if full_name is None:
            full_name, username, email = make_person(used_usernames)
        else:
            username = username_from_name(full_name, used_usernames)
            email = f"{username}@softinsa.pt"

        user_id = ids.next("users")
        location_name = random.choice(LOCATIONS)
        language_iso = random.choices(["pt-PT", "en-GB", "es-ES"], weights=[7, 2, 1], k=1)[0]
        created_at = random_past_datetime(120, 720)
        last_login = clamp_before_now(BASE_NOW - timedelta(days=random.randint(0, 45), hours=random.randint(1, 20)))
        email_confirmed = True
        row = {
            "user_id": user_id,
            "full_name": full_name,
            "username": username,
            "email_address": email,
            "password_hash": CONFIRMED_PASSWORD_HASH if email_confirmed else UNCONFIRMED_PASSWORD_HASH,
            "user_role": role,
            "user_guid": uuid.uuid5(uuid.NAMESPACE_DNS, f"softinsa-user-{user_id}"),
            "phone_number": f"+3519{random.randint(10000000, 99999999)}",
            "birthdate": date(random.randint(1974, 2000), random.randint(1, 12), random.randint(1, 28)),
            "profile_img_url": None,
            "language_id": languages[language_iso],
            "location_id": locations[location_name],
            "approved_by": None,
            "is_active": True,
            "email_confirmed": email_confirmed,
            "force_password_change": False,
            "last_login_at": last_login,
            "last_online": last_login + timedelta(minutes=random.randint(2, 90)),
            "current_streak_days": random.randint(0, 40),
            "created_at": created_at,
            "updated_at": created_at + timedelta(days=random.randint(1, 90)),
        }
        users.append(row)
        sql.insert("users", row)
        return row

    for index in range(NUM_ADMINISTRATORS):
        name = "Admin Softinsa" if index == 0 else None
        user = add_user("Administrator", name)
        admins.append(user)

    for _ in range(NUM_CONSULTANTS):
        user = add_user("Consultant")
        consultants.append(user)

    for _ in range(NUM_TALENT_MANAGERS):
        user = add_user("Talent Manager")
        talent_managers.append(user)

    for _ in range(NUM_SL_LEADERS):
        user = add_user("Service Line Leader")
        sl_leader_users.append(user)

    sql.section("3. Core Profiles Except Service Line Leaders")
    for index, admin in enumerate(admins):
        sql.insert("administrators", {
            "user_id": admin["user_id"],
            "is_super_admin": index == 0,
            "location_id": admin["location_id"],
            "interaction_id": None,
        })

    for consultant in consultants:
        focus = random.choice(["cloud delivery", "data platforms", "application modernization", "quality engineering", "automation"])
        sql.insert("consultants", {
            "user_id": consultant["user_id"],
            "gdpr_accepted": True,
            "biography": f"Softinsa consultant focused on {focus} and continuous skill progression.",
        })

    for manager in talent_managers:
        sql.insert("talent_managers", {
            "user_id": manager["user_id"],
            "biography": "Talent manager responsible for evidence review, career development and skills governance.",
        })

    admin_ids = [int(admin["user_id"]) for admin in admins]
    all_user_ids = [int(user["user_id"]) for user in users]
    consultant_ids = [int(user["user_id"]) for user in consultants]
    tm_ids = [int(user["user_id"]) for user in talent_managers]
    sll_user_ids = [int(user["user_id"]) for user in sl_leader_users]

    sql.section("4. Global Contexts")
    policy_templates = [
        ("Privacy", "Privacy Policy", "Explains how Softinsa processes profile, progression and certification data."),
        ("Terms", "Platform Terms", "Defines acceptable use, validation responsibilities and badge lifecycle rules."),
        ("Cookies", "Cookie Notice", "Documents essential and analytics cookies used by the platform."),
    ]
    for index in range(min(NUM_GDPR_POLICIES, len(policy_templates))):
        policy_type, title, body = policy_templates[index]
        row = {
            "policy_id": ids.next("gdpr_policies"),
            "policy_type": policy_type,
            "version": f"2026.{index + 1}",
            "policy_text": f"{title}: {body}",
            "is_mandatory": policy_type in {"Privacy", "Terms"},
            "is_active": True,
            "updated_by": random.choice(admin_ids),
            "created_by": random.choice(admin_ids),
            "created_at": BASE_NOW - timedelta(days=120 - index * 10),
            "updated_at": BASE_NOW - timedelta(days=30 - index * 3),
        }
        gdpr_policies.append(row)
        sql.insert("gdpr_policies", row)

    definition_templates = [
        ("HOME_DIGEST", "Home digest", "Daily activity summary", "/home", "HOME"),
        ("BADGE_AVAILABLE", "Badge available", "New badge available in an enrolled area", "/badges", "BADGES"),
        ("APPLICATION_SUBMITTED", "Application submitted", "Application submitted for validation", "/applications", "APPLICATIONS"),
        ("ACHIEVEMENT_UNLOCKED", "Achievement unlocked", "Achievement milestone reached", "/achievements", "ACHIEVEMENTS"),
        ("POINTS_AWARDED", "Points awarded", "Points added to consultant history", "/ranking", "POINTS"),
        ("OBJECTIVE_DUE", "Objective due", "Goal reminder for a consultant", "/objectives", "OBJECTIVES"),
        ("EVOLUTION_UPDATE", "Evolution update", "Progression trend notification", "/evolution", "EVOLUTION"),
        ("ANNOUNCEMENT_PUBLISHED", "Announcement published", "New platform announcement", "/announcements", "ANNOUNCEMENTS"),
        ("SYSTEM_MESSAGE", "System message", "Operational platform message", "/notifications", "SYSTEM"),
    ]
    for code, name, description, route, _notification_type in definition_templates:
        row = {
            "definition_id": ids.next("notification_definitions"),
            "code": code,
            "name": name,
            "description": description,
            "target_route": route,
            "user_id": random.choice(admin_ids),
        }
        notification_definitions.append(row)
        sql.insert("notification_definitions", row)

    for index in range(NUM_SLAS):
        target_profile = TARGET_PROFILES[index % len(TARGET_PROFILES)]
        row = {
            "sla_id": ids.next("slas"),
            "sla_name": f"{target_profile} validation SLA {index + 1}",
            "response_time_hours": random.choice([24, 48, 72, 96]),
            "start_date": BASE_NOW - timedelta(days=60),
            "end_date": BASE_NOW + timedelta(days=365 + index * 30),
            "target_profile": target_profile,
            "is_global": index % 2 == 0,
            "is_active": True,
            "sla_description": f"Operational response commitment for {target_profile} workflows.",
            "definition_id": random.choice(notification_definitions)["definition_id"],
            "user_id": random.choice(all_user_ids),
            "preference_id": None,
            "created_by": random.choice(admin_ids),
            "updated_by": random.choice(admin_ids),
            "created_at": BASE_NOW - timedelta(days=80),
            "updated_at": BASE_NOW - timedelta(days=random.randint(1, 25)),
        }
        slas.append(row)
        sql.insert("slas", row)

    announcement_titles = [
        "Quarterly Badge Review",
        "New Cloud Enablement Content",
        "Evidence Validation Window",
        "Data Community Session",
        "Security Awareness Update",
        "Platform Maintenance Notice",
        "Recognition Week",
        "Leadership Learning Sprint",
    ]
    announcement_types = ["Information", "New Content", "Warning", "Other"]
    for index in range(NUM_SYSTEM_ANNOUNCEMENTS):
        title = announcement_titles[index % len(announcement_titles)]
        starts_at = BASE_NOW - timedelta(days=random.randint(1, 30))
        row = {
            "announcement_id": ids.next("system_announcements"),
            "announcement_title": f"{title} {index + 1}",
            "announcement_message": f"Softinsa update for {title.lower()} with clear next steps for affected teams.",
            "starts_at": starts_at,
            "ends_at": starts_at + timedelta(days=random.randint(14, 45)),
            "announcement_type": announcement_types[index % len(announcement_types)],
            "target_profile": TARGET_PROFILES[index % len(TARGET_PROFILES)],
            "is_global": index % 3 == 0,
            "is_active": True,
            "preference_id": None,
            "user_id": None if index % 3 == 0 else random.choice(all_user_ids),
            "created_by": random.choice(admin_ids),
            "updated_by": random.choice(admin_ids),
            "created_at": starts_at - timedelta(days=3),
            "updated_at": starts_at - timedelta(days=1),
        }
        system_announcements.append(row)
        sql.insert("system_announcements", row)

    sql.section("5. Core Platform Architecture")
    for index in range(NUM_LEARNING_PATHS):
        base = LEARNING_PATH_BASES[index % len(LEARNING_PATH_BASES)]
        title = f"{base} {index + 1}"
        row = {
            "learning_path_id": ids.next("learning_paths"),
            "path_title": title,
            "path_slug": slugify(title),
            "path_description": f"Structured Softinsa path for {base.lower()} capabilities.",
            "img_url": None,
            "is_active": True,
            "created_by": random.choice(admin_ids),
            "updated_by": random.choice(admin_ids),
            "created_at": BASE_NOW - timedelta(days=180 - index),
            "updated_at": BASE_NOW - timedelta(days=30 - index),
        }
        learning_paths.append(row)
        sql.insert("learning_paths", row)

    for path in learning_paths:
        for index in range(NUM_SERVICE_LINES_PER_PATH):
            base = SERVICE_LINE_BASES[index % len(SERVICE_LINE_BASES)]
            title = f"{base} LP{path['learning_path_id']}-{index + 1}"
            row = {
                "service_line_id": ids.next("service_lines"),
                "learning_path_id": path["learning_path_id"],
                "service_line_name": title,
                "sl_slug": slugify(title),
                "service_line_description": f"Service line for {base.lower()} delivery, mentoring and operational excellence.",
                "img_url": None,
                "is_active": True,
                "created_by": random.choice(admin_ids),
                "updated_by": random.choice(admin_ids),
                "created_at": BASE_NOW - timedelta(days=150 - index),
                "updated_at": BASE_NOW - timedelta(days=20 - index),
            }
            service_lines.append(row)
            sql.insert("service_lines", row)

    sql.comment("Service Line Leader profiles are emitted here, after service_lines, to satisfy service_line_id FK.")
    for index, leader_user_id in enumerate(sll_user_ids):
        service_line = service_lines[index % len(service_lines)]
        sql.insert("service_line_leaders", {
            "user_id": leader_user_id,
            "service_line_id": service_line["service_line_id"],
            "biography": f"Service Line Leader accountable for {service_line['service_line_name']} capability growth.",
        })

    for service_line in service_lines:
        for index in range(NUM_AREAS_PER_SERVICE_LINE):
            base = AREA_BASES[index % len(AREA_BASES)]
            title = f"{service_line['service_line_name']} {base}"
            row = {
                "area_id": ids.next("areas"),
                "service_line_id": service_line["service_line_id"],
                "area_name": title,
                "area_slug": slugify(title),
                "area_description": f"Area focused on {base.lower()} practices within {service_line['service_line_name']}.",
                "img_url": None,
                "is_active": True,
                "created_by": random.choice(admin_ids),
                "updated_by": random.choice(admin_ids),
                "created_at": BASE_NOW - timedelta(days=130 - index),
                "updated_at": BASE_NOW - timedelta(days=10 - index),
            }
            areas.append(row)
            sql.insert("areas", row)

    for area in areas:
        for code in STAGE_CODES:
            stage_name, sequence, description = STAGE_NAMES[code]
            title = f"{area['area_name']} {stage_name}"
            row = {
                "progression_stage_id": ids.next("progression_stages"),
                "area_id": area["area_id"],
                "stage_code_id": stage_codes[code],
                "stage_title": title[:100],
                "stage_sequence": sequence,
                "stage_description": f"{description} Area context: {area['area_name']}.",
                "created_by": random.choice(admin_ids),
                "updated_by": random.choice(admin_ids),
                "created_at": BASE_NOW - timedelta(days=110 - sequence),
                "updated_at": BASE_NOW - timedelta(days=8 - min(sequence, 7)),
            }
            progression_stages.append(row)
            sql.insert("progression_stages", row)

    area_by_id = {int(area["area_id"]): area for area in areas}
    service_line_by_id = {int(sl["service_line_id"]): sl for sl in service_lines}
    learning_path_by_id = {int(lp["learning_path_id"]): lp for lp in learning_paths}

    for stage in progression_stages:
        area = area_by_id[int(stage["area_id"])]
        service_line = service_line_by_id[int(area["service_line_id"])]
        learning_path = learning_path_by_id[int(service_line["learning_path_id"])]
        title = f"{area['area_name']} Badge {stage['stage_sequence']}"
        badge_type = "Special" if int(stage["stage_sequence"]) == 5 else "Standard"
        row = {
            "badge_id": ids.next("badges"),
            "progression_stage_id": stage["progression_stage_id"],
            "area_id": area["area_id"],
            "service_line_id": service_line["service_line_id"],
            "learning_path_id": learning_path["learning_path_id"],
            "badge_title": title[:100],
            "badge_slug": slugify(title)[:100],
            "badge_type": badge_type,
            "badge_points": int(stage["stage_sequence"]) * 125,
            "expiration_duration_days": 730 if badge_type == "Special" else None,
            "badge_description": f"Recognizes validated capability in {area['area_name']} at stage {stage['stage_sequence']}.",
            "badge_img_url": None,
            "is_active": True,
            "created_by": random.choice(admin_ids),
            "updated_by": random.choice(admin_ids),
            "created_at": BASE_NOW - timedelta(days=100),
            "updated_at": BASE_NOW - timedelta(days=random.randint(1, 20)),
        }
        badges.append(row)
        sql.insert("badges", row)

    for badge in badges:
        requirements_by_badge[int(badge["badge_id"])] = []
        templates = [
            ("Training Completion", "Complete structured learning modules and knowledge checks."),
            ("Practical Delivery", "Submit evidence from a real or simulated delivery scenario."),
            ("Peer Review", "Receive validation from a reviewer with relevant platform expertise."),
            ("Client Impact", "Document measurable business or operational impact."),
            ("Knowledge Sharing", "Publish reusable notes, demos or enablement material for the team."),
        ]
        for sequence in range(1, NUM_REQUIREMENTS_PER_BADGE + 1):
            template_title, template_description = templates[(sequence - 1) % len(templates)]
            row = {
                "requirement_id": ids.next("badge_requirements"),
                "badge_id": badge["badge_id"],
                "progression_stage_id": badge["progression_stage_id"],
                "requirement_title": f"{template_title} {sequence} - {badge['badge_title']}"[:150],
                "requirement_sequence": sequence,
                "requirement_description": f"{template_description} Badge context: {badge['badge_title']}.",
                "requirement_img_url": None,
                "badge_points": max(10, int(badge["badge_points"]) // NUM_REQUIREMENTS_PER_BADGE),
                "is_active": True,
                "created_by": random.choice(admin_ids),
                "updated_by": random.choice(admin_ids),
                "created_at": BASE_NOW - timedelta(days=95),
                "updated_at": BASE_NOW - timedelta(days=random.randint(1, 18)),
            }
            requirements_by_badge[int(badge["badge_id"])].append(row)
            sql.insert("badge_requirements", row)

    for index, (skill_name, skill_description) in enumerate(SKILL_CATALOG):
        row = {
            "skills_id": ids.next("skills"),
            "badge_id": badges[index % len(badges)]["badge_id"],
            "skill_name": skill_name,
            "skill_description": skill_description,
            "created_by": random.choice(admin_ids),
            "updated_by": random.choice(admin_ids),
            "created_at": BASE_NOW - timedelta(days=90),
            "updated_at": BASE_NOW - timedelta(days=random.randint(1, 15)),
        }
        skills.append(row)
        sql.insert("skills", row)

    sql.section("6. Intermediary and Mapping Tables")
    for consultant in consultants:
        sampled_areas = random.sample(areas, k=min(len(areas), random.randint(1, 3)))
        for index, area in enumerate(sampled_areas):
            sql.insert("consultant_areas", {
                "user_id": consultant["user_id"],
                "area_id": area["area_id"],
                "is_primary": index == 0,
            })

    for consultant in consultants:
        sampled_skills = random.sample(skills, k=min(len(skills), random.randint(3, 6)))
        for skill in sampled_skills:
            sql.insert("consultants_selected_skills", {
                "user_id": consultant["user_id"],
                "skills_id": skill["skills_id"],
            })

    for announcement in system_announcements:
        if announcement["is_global"]:
            service_line_sample = random.sample(service_lines, k=min(len(service_lines), 2))
        else:
            service_line_sample = [random.choice(service_lines)]
        for service_line in service_line_sample:
            sql.insert("announc_sl", {
                "announcement_id": announcement["announcement_id"],
                "service_line_id": service_line["service_line_id"],
            })

    for sla in slas:
        sampled_service_lines = random.sample(service_lines, k=min(len(service_lines), random.randint(1, 3)))
        for service_line in sampled_service_lines:
            sql.insert("sl_slas", {
                "service_line_id": service_line["service_line_id"],
                "sla_id": sla["sla_id"],
            })

    sql.section("7. Transactions and Actions")
    for index in range(NUM_GOALS):
        consultant_id = random.choice(consultant_ids)
        badge = random.choice(badges)
        start = BASE_NOW + timedelta(days=random.randint(1, 120))
        row = {
            "goal_id": ids.next("goals"),
            "user_id": consultant_id,
            "badge_id": badge["badge_id"],
            "application_id": None,
            "event_title": f"Earn {badge['badge_title']}"[:150],
            "event_description": f"Personal development goal linked to {badge['badge_title']}.",
            "event_start_date": start,
            "event_end_date": start + timedelta(days=random.randint(30, 120)),
            "reminder_at": start - timedelta(days=random.choice([3, 7, 14])),
        }
        goals.append(row)
        sql.insert("goals", row)

    for index in range(NUM_BADGE_APPLICATIONS):
        state = APPLICATION_STATES[index % len(APPLICATION_STATES)]
        consultant_id = random.choice(consultant_ids)
        badge = random.choice(badges)
        opened_at = random_past_datetime(20, 360)
        submitted_at = None
        closed_at = None
        if state != "Open":
            submitted_at = opened_at + timedelta(days=random.randint(1, 14), hours=random.randint(1, 8))
        if state in {"Accepted", "Rejected"}:
            closed_at = submitted_at + timedelta(days=random.randint(1, 12), hours=random.randint(1, 8))  # type: ignore[operator]
        row = {
            "application_id": ids.next("badge_applications"),
            "badge_id": badge["badge_id"],
            "user_id": consultant_id,
            "certificate_id": None,
            "awarded_badges_id": None,
            "application_guid": uuid.uuid5(uuid.NAMESPACE_URL, f"softinsa-application-{index + 1}-{consultant_id}-{badge['badge_id']}"),
            "application_state": state,
            "reviewer_notes": "Evidence accepted and badge awarded." if state == "Accepted" else (
                "More detail is required for practical delivery evidence." if state == "Rejected" else None
            ),
            "opened_at": opened_at,
            "submitted_at": submitted_at,
            "closed_at": closed_at,
        }
        applications.append(row)
        sql.insert("badge_applications", row)

    reviewer_pool = tm_ids + sll_user_ids + admin_ids
    for application in applications:
        badge_requirements = requirements_by_badge[int(application["badge_id"])]
        if application["application_state"] == "Open":
            continue
        evidence_count = len(badge_requirements) if application["application_state"] in {"Accepted", "Rejected"} else random.randint(1, len(badge_requirements))
        for requirement in badge_requirements[:evidence_count]:
            uploaded_at = application["opened_at"] + timedelta(days=random.randint(1, 10), hours=random.randint(1, 6))  # type: ignore[operator]
            if application["submitted_at"]:
                uploaded_at = min(uploaded_at, application["submitted_at"] - timedelta(hours=2))  # type: ignore[operator]
            row = {
                "evidence_id": ids.next("requirements_evidences"),
                "application_id": application["application_id"],
                "requirement_id": requirement["requirement_id"],
                "evidence_file_url": f"https://files.softinsa.pt/evidence/app-{application['application_id']}-req-{requirement['requirement_id']}.pdf",
                "evidence_title": f"Evidence for {requirement['requirement_title']}"[:150],
                "evidence_description": "Submitted project artefact, certification proof or review note for validation.",
                "evidence_file_type": "application/pdf",
                "tm_reviewed": application["application_state"] in {"In validation", "Accepted", "Rejected"},
                "sll_reviewed": application["application_state"] in {"Accepted", "Rejected"},
                "uploaded_at": uploaded_at,
            }
            evidences.append(row)
            sql.insert("requirements_evidences", row)

    for application in applications:
        if application["application_state"] not in {"In validation", "Accepted", "Rejected"}:
            continue
        submitted_at = application["submitted_at"] or application["opened_at"]
        log_actions = [("Talent Manager", "Review", "Evidence package reviewed by Talent Manager.")]
        if application["application_state"] in {"Accepted", "Rejected"}:
            action = "Approve" if application["application_state"] == "Accepted" else "Reject"
            comment = "Application approved for badge award." if action == "Approve" else "Application rejected pending stronger evidence."
            log_actions.append(("Service Line Leader", action, comment))
        for offset, (function, action, comment) in enumerate(log_actions):
            row = {
                "validation_log_id": ids.next("application_validation_logs"),
                "application_id": application["application_id"],
                "user_id": random.choice(reviewer_pool),
                "validator_function": function,
                "validator_action": action,
                "validations_comments": comment,
                "validated_at": submitted_at + timedelta(days=offset + 1, hours=random.randint(1, 5)),  # type: ignore[operator]
            }
            validation_logs.append(row)
            sql.insert("application_validation_logs", row)

    accepted_applications = [app for app in applications if app["application_state"] == "Accepted"]
    badge_by_id = {int(badge["badge_id"]): badge for badge in badges}
    for index, application in enumerate(accepted_applications):
        badge = badge_by_id[int(application["badge_id"])]
        closed_at = application["closed_at"] or BASE_NOW - timedelta(days=1)
        row = {
            "awarded_badges_id": ids.next("awarded_badges"),
            "application_id": application["application_id"],
            "user_id": application["user_id"],
            "awarded_at": closed_at + timedelta(hours=2),  # type: ignore[operator]
            "expiration_at": (closed_at + timedelta(days=730)) if badge["expiration_duration_days"] else None,  # type: ignore[operator]
            "points_snapshot": badge["badge_points"],
            "public_verification_link": f"https://badges.softinsa.pt/verify/{application['application_guid']}",
            "is_published": index % 4 != 0,
            "is_featured": index % 10 == 0,
            "display_order": index + 1,
        }
        awarded_badges.append(row)
        sql.insert("awarded_badges", row)

    for application in accepted_applications:
        issue_dt = (application["closed_at"] or BASE_NOW).date()
        row = {
            "certificate_id": ids.next("certificates"),
            "application_id": application["application_id"],
            "certificate_title": f"Softinsa Certificate - Application {application['application_id']}",
            "issuing_entity": "Softinsa",
            "issue_date": issue_dt,
            "certificate_file_url": f"https://files.softinsa.pt/certificates/app-{application['application_id']}.pdf",
        }
        certificates.append(row)
        sql.insert("certificates", row)

    for award in awarded_badges:
        app = next(item for item in applications if item["application_id"] == award["application_id"])
        badge = badge_by_id[int(app["badge_id"])]
        row = {
            "points_history_id": ids.next("points_history"),
            "user_id": award["user_id"],
            "requirement_id": None,
            "badge_id": badge["badge_id"],
            "points_delta": badge["badge_points"],
            "justification": f"Badge awarded: {badge['badge_title']}",
            "created_at": award["awarded_at"],
        }
        points_history.append(row)
        sql.insert("points_history", row)

    special_badges = [badge for badge in badges if badge["badge_type"] == "Special"]
    for index, badge in enumerate(special_badges[: max(1, min(len(special_badges), 20))]):
        sql.insert("rewards", {
            "reward_id": ids.next("rewards"),
            "badge_id": badge["badge_id"],
            "special_title": f"Recognition reward for {badge['badge_title']}"[:255],
            "special_portrait_svg": (
                "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'>"
                "<rect width='128' height='128' rx='12' fill='#0f766e'/>"
                "<text x='64' y='72' text-anchor='middle' font-size='30' fill='white'>S</text>"
                "</svg>"
            ),
        })

    for index in range(NUM_NOTIFICATIONS):
        definition = notification_definitions[index % len(notification_definitions)]
        notification_type = NOTIFICATION_TYPES[index % len(NOTIFICATION_TYPES)]
        sent_at = random_past_datetime(0, 90)
        sql.insert("notifications", {
            "notification_id": ids.next("notifications"),
            "user_id": all_user_ids[index % len(all_user_ids)],
            "definition_id": definition["definition_id"],
            "notification_payload": f"Softinsa {notification_type.lower()} update #{index + 1}.",
            "notification_url": definition["target_route"],
            "notification_type": notification_type,
            "is_read": index % 3 != 0,
            "sent_at": sent_at,
        })

    for definition in notification_definitions:
        sql.insert("notification_preferences", {
            "preference_id": ids.next("notification_preferences"),
            "definition_id": definition["definition_id"],
            "sla_id": None,
            "announcement_id": None,
            "send_email": True,
            "send_push": True,
            "is_enabled": True,
            "trigger_before_value": None,
            "trigger_before_unit": None,
            "created_by": random.choice(admin_ids),
            "updated_by": random.choice(admin_ids),
            "created_at": BASE_NOW - timedelta(days=50),
            "updated_at": BASE_NOW - timedelta(days=random.randint(1, 10)),
        })

    for sla in slas:
        sql.insert("notification_preferences", {
            "preference_id": ids.next("notification_preferences"),
            "definition_id": sla["definition_id"],
            "sla_id": sla["sla_id"],
            "announcement_id": None,
            "send_email": True,
            "send_push": False,
            "is_enabled": True,
            "trigger_before_value": random.choice([12, 24, 48]),
            "trigger_before_unit": "hours",
            "created_by": random.choice(admin_ids),
            "updated_by": random.choice(admin_ids),
            "created_at": BASE_NOW - timedelta(days=45),
            "updated_at": BASE_NOW - timedelta(days=random.randint(1, 10)),
        })

    for announcement in system_announcements:
        sql.insert("notification_preferences", {
            "preference_id": ids.next("notification_preferences"),
            "definition_id": random.choice(notification_definitions)["definition_id"],
            "sla_id": None,
            "announcement_id": announcement["announcement_id"],
            "send_email": announcement["target_profile"] != "Consultant",
            "send_push": True,
            "is_enabled": True,
            "trigger_before_value": 1,
            "trigger_before_unit": "days",
            "created_by": random.choice(admin_ids),
            "updated_by": random.choice(admin_ids),
            "created_at": BASE_NOW - timedelta(days=42),
            "updated_at": BASE_NOW - timedelta(days=random.randint(1, 10)),
        })

    for index in range(NUM_USER_BADGE_INTERACTIONS):
        sql.insert("user_badges_interactions", {
            "interaction_id": ids.next("user_badges_interactions"),
            "user_id": all_user_ids[index % len(all_user_ids)],
            "badge_id": badges[index % len(badges)]["badge_id"],
            "interaction_type": INTERACTION_TYPES[index % len(INTERACTION_TYPES)],
            "interaction_date": random_past_datetime(0, 180),
        })

    if INCLUDE_SEQUENCE_RESETS:
        sql.extend(sequence_reset_lines([
            ("languages", "language_id"),
            ("locations", "location_id"),
            ("stage_codes", "stage_code_id"),
            ("users", "user_id"),
            ("gdpr_policies", "policy_id"),
            ("notification_definitions", "definition_id"),
            ("slas", "sla_id"),
            ("system_announcements", "announcement_id"),
            ("learning_paths", "learning_path_id"),
            ("service_lines", "service_line_id"),
            ("areas", "area_id"),
            ("progression_stages", "progression_stage_id"),
            ("badges", "badge_id"),
            ("badge_requirements", "requirement_id"),
            ("skills", "skills_id"),
            ("goals", "goal_id"),
            ("badge_applications", "application_id"),
            ("requirements_evidences", "evidence_id"),
            ("application_validation_logs", "validation_log_id"),
            ("awarded_badges", "awarded_badges_id"),
            ("certificates", "certificate_id"),
            ("points_history", "points_history_id"),
            ("rewards", "reward_id"),
            ("notifications", "notification_id"),
            ("notification_preferences", "preference_id"),
            ("user_badges_interactions", "interaction_id"),
        ]))

    sql.extend(["", "COMMIT;"])
    return sql.render()


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate Softinsa PostgreSQL mock data SQL.")
    parser.add_argument(
        "-o",
        "--output",
        default=OUTPUT_SQL_FILE,
        help=f"Output SQL file path. Defaults to {OUTPUT_SQL_FILE} next to this script.",
    )
    args = parser.parse_args()

    output_path = Path(args.output)
    if not output_path.is_absolute():
        output_path = Path(__file__).resolve().parent / output_path
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(generate_sql(), encoding="utf-8")
    print(f"Wrote {output_path}")


if __name__ == "__main__":
    main()
