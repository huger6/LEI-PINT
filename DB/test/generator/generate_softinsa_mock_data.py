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

NUM_CONSULTANTS = 50
NUM_TALENT_MANAGERS = 3
NUM_ADMINISTRATORS = 2
NUM_SL_LEADERS = 15
NUM_BADGE_APPLICATIONS = 150

NUM_REQUIREMENTS_PER_BADGE = 3
NUM_GDPR_POLICIES = 3
NUM_SLAS = 6
NUM_SYSTEM_ANNOUNCEMENTS = 8
NUM_GOALS = 80
NUM_NOTIFICATIONS = 180
NUM_USER_BADGE_INTERACTIONS = 220
NUM_DEVICE_TOKENS = 10
NUM_USER_NOTIFICATION_PREF_OVERRIDES = 8
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
    ("OutSystems", "Low-code application development on the OutSystems platform."),
    ("Ansible", "Infrastructure automation, configuration management and orchestration with Ansible."),
    ("Prometheus", "Time-series metrics collection, alerting rules and PromQL querying."),
    ("Grafana", "Observability dashboards, data visualization and alerting."),
    ("ELK Stack", "Centralized logging with Elasticsearch, Logstash and Kibana."),
    ("OpenTelemetry", "Vendor-neutral instrumentation for traces, metrics and logs."),
    ("SAP", "SAP ERP system administration, ABAP development and S/4HANA migration."),
    ("Selenium", "Browser-based UI test automation with Selenium WebDriver."),
    ("Cypress", "Modern end-to-end testing framework for web applications."),
    ("JMeter", "Load testing, performance benchmarking and capacity planning with Apache JMeter."),
    ("C# / .NET", "Enterprise application development with the .NET ecosystem."),
    ("Power Apps", "Low-code business application development on Microsoft Power Platform."),
    ("Power Automate", "Workflow automation and process orchestration with Microsoft Power Automate."),
    ("SharePoint", "SharePoint administration, SPFx development and collaboration solutions."),
    ("Microsoft 365", "Microsoft 365 tenant administration and cloud productivity services."),
    ("Penetration Testing", "Offensive security assessment, vulnerability exploitation and reporting."),
    ("Talent Management", "Technical recruitment, skills assessment and workforce development."),
    ("Workforce Analytics", "People analytics, workforce planning dashboards and HR data insights."),
]

# Maps area name fragments to the skills associated with badges in that area.
THEME_BADGE_SKILLS: dict[str, list[str]] = {
    "LowCode": ["OutSystems", "REST APIs", "JavaScript", "React", "PostgreSQL", "Agile Delivery", "C# / .NET"],
    "Cloud Native": ["Docker", "Kubernetes", "OpenShift", "Linux", "Terraform", "Microservices", "AWS Cloud", "Azure Cloud", "IBM Cloud"],
    "DevSecOps": ["DevSecOps", "GitHub Actions", "Jenkins", "Terraform", "Ansible", "Docker", "Kubernetes", "Cybersecurity", "Linux"],
    "Observability": ["Prometheus", "Grafana", "ELK Stack", "OpenTelemetry", "Observability", "Linux", "Kubernetes"],
    "Sourcing": ["Talent Management", "Workforce Analytics", "Business Analysis", "Agile Delivery"],
    "Data Engineering": ["Data Engineering", "Python", "Apache Spark", "dbt", "PostgreSQL", "SQL Server", "Kafka", "Power BI"],
    "Machine Learning": ["Machine Learning", "MLOps", "Python", "Apache Spark", "Data Engineering"],
    "Security Operations": ["Cybersecurity", "Penetration Testing", "Identity and Access Management", "Linux", "DevSecOps"],
    "Microsoft 365": ["Microsoft 365", "Power Apps", "Power Automate", "SharePoint", "Power BI"],
    "SAP": ["SAP", "ITIL", "Business Analysis", "Java", "REST APIs"],
    "Test Automation": ["Test Automation", "Selenium", "Cypress", "JMeter", "Quality Assurance", "REST APIs"],
}
DEFAULT_BADGE_SKILLS = ["Agile Delivery", "Scrum", "Quality Assurance", "Business Analysis", "REST APIs"]

# Service line hex colors (no #) used in badge SVG generation.
SL_COLORS: dict[str, str] = {
    "Hybrid Cloud": "1565C0",
    "Application Operations": "2E7D32",
    "Sourcing & Talent Management": "6A1B9A",
    "Data & AI": "E65100",
    "Cybersecurity": "C62828",
    "Digital Workplace": "00838F",
    "Enterprise Applications": "4527A0",
    "Quality Engineering": "558B2F",
}

# The single learning path and its full structure.
# Dict: LP title -> { SL title -> { area title -> [(badge_title, badge_description), ...] } }
PLATFORM_STRUCTURE: dict[str, dict[str, dict[str, list[tuple[str, str]]]]] = {
    "Jornada Técnica": {
        "Hybrid Cloud": {
            "LowCode (OutSystems)": [
                ("OutSystems Reactive Web Fundamentals", "Foundation concepts of reactive web development in OutSystems including UI patterns, data models and server actions."),
                ("OutSystems Integration Specialist", "Integration of OutSystems applications with REST APIs, external databases and enterprise connectors."),
                ("OutSystems Architecture Patterns", "Advanced architectural patterns including multi-tenant design, scalability and performance optimization in OutSystems."),
                ("OutSystems Security & Governance", "Enterprise security practices, role-based access, code quality and governance frameworks in the OutSystems platform."),
                ("OutSystems Technical Lead", "Strategic platform leadership for solution architecture, team mentoring and enterprise-scale OutSystems deployments."),
            ],
            "Cloud Native & Containers": [
                ("Container Fundamentals", "Docker containerization basics, image building, multi-stage builds, networking and local orchestration with Docker Compose."),
                ("Kubernetes Operations", "Kubernetes cluster operations, deployment strategies, service discovery, ConfigMaps, Secrets and resource management."),
                ("Cloud Native Architecture", "Designing cloud-native microservices with service meshes, API gateways, circuit breakers and distributed patterns."),
                ("OpenShift Enterprise Platform", "Red Hat OpenShift administration, Operator framework, S2I builds, routes and enterprise platform operations."),
                ("Multi-Cloud Strategy Lead", "Hybrid and multi-cloud architecture governance, cost optimization, vendor management and cross-provider resilience."),
            ],
        },
        "Application Operations": {
            "DevSecOps & IT Automation": [
                ("CI/CD Pipeline Fundamentals", "Building continuous integration and delivery pipelines with Jenkins, GitHub Actions or Azure DevOps including build, test and deploy stages."),
                ("Infrastructure as Code", "Provisioning and managing cloud infrastructure using Terraform modules, state management, providers and drift detection."),
                ("DevSecOps Practitioner", "Embedding SAST, DAST and SCA security scanning into CI/CD pipelines with automated compliance and vulnerability gates."),
                ("Ansible Automation Expert", "Enterprise IT automation with Ansible for configuration management, playbook design, roles and orchestration workflows."),
                ("DevSecOps Architect", "End-to-end DevSecOps platform design with policy-as-code, GitOps, supply chain security and shift-left organizational strategy."),
            ],
            "Observability & SRE": [
                ("Monitoring Fundamentals", "Metrics collection with Prometheus, Grafana dashboards, alerting rules and infrastructure monitoring patterns."),
                ("Log Management & Analysis", "Centralized log aggregation with ELK Stack or Loki, structured logging, correlation IDs and log-based alerting."),
                ("Distributed Tracing", "Implementing distributed tracing with OpenTelemetry, Jaeger and context propagation for microservices observability."),
                ("SRE Practices & Reliability", "Site Reliability Engineering including SLOs, SLIs, error budgets, blameless postmortems and chaos engineering."),
                ("Observability Platform Lead", "Enterprise observability strategy, tool standardization, AIOps integration and operational excellence frameworks."),
            ],
        },
        "Sourcing & Talent Management": {
            "Sourcing & Talent Management": [
                ("Technical Recruiting Fundamentals", "Core IT recruitment competencies, Boolean search techniques, sourcing strategies and candidate screening for technical roles."),
                ("Talent Pipeline Management", "Building sustainable talent pipelines, employer branding, candidate experience optimization and recruitment analytics."),
                ("Skills Assessment & Evaluation", "Designing technical assessment frameworks, competency matrices, structured interviews and evaluation scoring systems."),
                ("Workforce Planning & Analytics", "Strategic workforce planning, talent analytics dashboards, succession planning and skills gap analysis methodologies."),
                ("Talent Strategy Leader", "Organizational talent strategy, diversity and inclusion programs, retention frameworks and business transformation alignment."),
            ],
        },
        "Data & AI": {
            "Data Engineering": [
                ("SQL & Relational Databases", "Advanced SQL querying, data modeling, indexing strategies, query optimization and PostgreSQL or SQL Server administration."),
                ("ETL & Data Integration", "Building ETL and ELT pipelines with Apache NiFi, Talend or Azure Data Factory for batch and streaming data integration."),
                ("Big Data Processing", "Distributed data processing with Apache Spark, batch analytics, streaming with Spark Structured Streaming and data lake patterns."),
                ("Data Warehouse Architecture", "Designing modern data warehouses with dimensional modeling, dbt transformations, data marts and analytics engineering practices."),
                ("Data Platform Lead", "Enterprise data platform strategy, data governance frameworks, data mesh architecture and organizational data maturity leadership."),
            ],
            "Machine Learning & AI": [
                ("Python for Data Science", "Python data analysis with pandas, NumPy, matplotlib, scikit-learn and Jupyter for exploratory data analysis and feature engineering."),
                ("Machine Learning Fundamentals", "Supervised and unsupervised learning algorithms, model evaluation metrics, cross-validation, hyperparameter tuning and bias detection."),
                ("Deep Learning & Neural Networks", "Deep learning with TensorFlow or PyTorch, CNNs for image recognition, RNNs for sequence data and transfer learning techniques."),
                ("MLOps & Model Deployment", "ML model lifecycle management, model serving with MLflow, monitoring for drift, A/B testing and production ML pipelines."),
                ("AI Solutions Architect", "Enterprise AI strategy, responsible AI frameworks, LLM integration patterns and large-scale ML system design and governance."),
            ],
        },
        "Cybersecurity": {
            "Security Operations": [
                ("Cybersecurity Fundamentals", "Core security concepts, threat landscape awareness, CIA triad, security controls and CompTIA Security+ aligned knowledge."),
                ("Network Security", "Network security architecture, firewall configuration, IDS/IPS systems, VPN technologies and network segmentation strategies."),
                ("Vulnerability Management", "Vulnerability scanning with Nessus or Qualys, penetration testing methodology, CVSS scoring and remediation prioritization."),
                ("Security Incident Response", "SIEM operations with Splunk or Sentinel, incident response procedures, digital forensics basics and SOC analyst workflows."),
                ("Security Architecture Lead", "Enterprise security architecture, zero-trust frameworks, threat modeling, compliance automation and security governance leadership."),
            ],
        },
        "Digital Workplace": {
            "Microsoft 365 & Power Platform": [
                ("Microsoft 365 Administration", "Microsoft 365 tenant administration, user lifecycle management, Exchange Online, Teams and SharePoint Online configuration."),
                ("Power Platform Development", "Power Apps canvas and model-driven app development, Power Automate cloud flows and Power BI report creation."),
                ("SharePoint & Teams Solutions", "SharePoint Framework development, Teams app customization, Graph API integration and collaborative platform solutions."),
                ("Power Platform Advanced", "Custom connectors, Dataverse advanced modeling, AI Builder integration, CoE toolkit and governance policies for Power Platform."),
                ("Digital Workplace Architect", "Enterprise digital workplace strategy, Microsoft 365 governance, adoption frameworks and modern workplace transformation."),
            ],
        },
        "Enterprise Applications": {
            "SAP & ERP Integration": [
                ("SAP Fundamentals", "SAP system navigation, core modules overview covering FI, CO, MM and SD, transaction codes and basic customizing."),
                ("SAP ABAP Development", "ABAP programming fundamentals, data dictionary, ALV reports, function modules, BAPIs and enhancement framework techniques."),
                ("SAP Integration & BTP", "SAP Business Technology Platform, API management, CPI integration flows and cloud-to-on-premise connectivity patterns."),
                ("SAP S/4HANA Migration", "S/4HANA conversion planning, data migration with LTMC, custom code adaptation, Fiori UX and cutover testing strategies."),
                ("ERP Solutions Architect", "Enterprise ERP architecture, multi-system landscape design, integration patterns and digital transformation program leadership."),
            ],
        },
        "Quality Engineering": {
            "Test Automation & QA": [
                ("Software Testing Fundamentals", "Test planning, test case design techniques, ISTQB-aligned testing concepts, defect management and test reporting."),
                ("Automated UI Testing", "UI test automation with Selenium WebDriver or Cypress, page object model patterns, test data management and CI integration."),
                ("API & Contract Testing", "REST and GraphQL API testing with Postman, contract testing with Pact, schema validation and API quality gates in pipelines."),
                ("Performance Testing", "Load testing with JMeter or k6, stress testing, performance benchmarking, bottleneck analysis and capacity planning."),
                ("Quality Engineering Lead", "Test strategy design, quality metrics frameworks, shift-left testing culture, test architecture and organizational QA leadership."),
            ],
        },
    },
}


def badge_svg_data_uri(stage_letter: str, color: str) -> str:
    """Return a compact URL-encoded SVG data URI for a hexagonal badge."""
    svg = (
        "%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 110'%3E"
        f"%3Cpolygon points='50,5 95,30 95,80 50,105 5,80 5,30' fill='%23{color}'/%3E"
        "%3Cpolygon points='50,12 89,34 89,76 50,98 11,76 11,34' fill='none' stroke='%23fff' stroke-width='1.5' opacity='.3'/%3E"
        f"%3Ctext x='50' y='63' text-anchor='middle' fill='%23fff' font-size='32' font-weight='bold' font-family='Arial'%3E{stage_letter}%3C/text%3E"
        "%3C/svg%3E"
    )
    return f"data:image/svg+xml,{svg}"

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




TARGET_PROFILES = ["Consultant", "Talent Manager", "Service Line Leader", "Administrator"]
DEFAULT_GLOBAL_SLAS = [
    {
        "sla_name": "Default Talent Manager Validation",
        "response_time_hours": 48,
        "target_profile": "Talent Manager",
        "sla_description": "Default time limit for Talent Managers to review submitted evidences.",
    },
    {
        "sla_name": "Default Service Line Leader Validation",
        "response_time_hours": 72,
        "target_profile": "Service Line Leader",
        "sla_description": "Default time limit for Service Line Leaders to perform final approval on applications.",
    },
]
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


STORE_REWARDS: list[dict[str, object]] = [
    {
        "reward_name": "CS50: Introduction to Computer Science",
        "reward_description": "Harvard's renowned introductory CS course. Learn programming fundamentals, algorithms, and data structures with professor David J. Malan.",
        "access_link": "https://cs50.harvard.edu/x/",
        "access_info": "You will receive an enrollment code via email. Use it at cs50.harvard.edu/x to access the full course materials and certificate.",
        "cost_points": 3500,
        "is_active": True,
        "reward_category": "course",
    },
    {
        "reward_name": "Hack The Box VIP+ — 1 Month",
        "reward_description": "1-month VIP+ subscription on Hack The Box. Access exclusive machines, advanced labs, and premium cybersecurity training content.",
        "access_link": "https://www.hackthebox.com/",
        "access_info": "A redemption code will be sent to your email. Activate it at hackthebox.com/redeem.",
        "cost_points": 4500,
        "is_active": True,
        "reward_category": "voucher",
    },
    {
        "reward_name": "Udemy Course Voucher — €20",
        "reward_description": "€20 Udemy credit for any course of your choice. Expand your skills in technology, business, or personal development.",
        "access_link": "https://www.udemy.com/",
        "access_info": "You will receive a unique gift code via email. Apply it at udemy.com/cart during checkout.",
        "cost_points": 2000,
        "is_active": True,
        "reward_category": "voucher",
    },
    {
        "reward_name": "AWS Solutions Architect — Exam Voucher",
        "reward_description": "Voucher covering the AWS Solutions Architect Associate (SAA-C03) certification exam fee. Approximate value: $150 USD.",
        "access_link": "https://aws.amazon.com/certification/",
        "access_info": "The exam voucher code will be emailed to you. Schedule your exam at aws.training using the code.",
        "cost_points": 15000,
        "is_active": True,
        "reward_category": "voucher",
    },
    {
        "reward_name": "Exclusive Title: Tech Pioneer",
        "reward_description": 'Unlock the special "Tech Pioneer" title on your profile. Show that you are among the first to earn store rewards on the platform.',
        "access_link": None,
        "access_info": "Your title will be applied to your profile automatically within 24 hours.",
        "cost_points": 300,
        "is_active": True,
        "reward_category": "title",
    },
    {
        "reward_name": "Exclusive Title: Innovation Leader",
        "reward_description": 'Unlock the exclusive "Innovation Leader" title on your profile. A symbol of excellence and leadership in technology innovation.',
        "access_link": None,
        "access_info": "Your title will be applied to your profile automatically within 24 hours.",
        "cost_points": 600,
        "is_active": True,
        "reward_category": "title",
    },
    {
        "reward_name": "Mechanical Keyboard — Keychron K2 Pro",
        "reward_description": "Premium wireless mechanical keyboard with Gateron switches and RGB backlight. Compact 75% layout, ideal for developers.",
        "access_link": None,
        "access_info": "Our team will contact you via email to arrange delivery to your office location.",
        "cost_points": 12000,
        "is_active": True,
        "reward_category": "physical",
    },
    {
        "reward_name": "Amazon Gift Card — €25",
        "reward_description": "€25 Amazon gift card. Use it to buy tech books, gadgets, or anything you like.",
        "access_link": None,
        "access_info": "The gift card code will be sent to your registered email address within 48 hours.",
        "cost_points": 2500,
        "is_active": True,
        "reward_category": "physical",
    },
    {
        "reward_name": "LinkedIn Learning — 3 Months",
        "reward_description": "3-month access to LinkedIn Learning with over 16,000 courses in technology, business, and creativity.",
        "access_link": "https://www.linkedin.com/learning/",
        "access_info": "An activation link will be sent to your email. Click it to unlock 3 months of LinkedIn Learning.",
        "cost_points": 9000,
        "is_active": True,
        "reward_category": "subscription",
    },
]


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
    email = f"{username}@softinsatestplatform.pt"
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
        "NUM_DEVICE_TOKENS": NUM_DEVICE_TOKENS,
        "NUM_USER_NOTIFICATION_PREF_OVERRIDES": NUM_USER_NOTIFICATION_PREF_OVERRIDES,
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
    default_global_sla_ids: set[int] = set()
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

    TERMS_TEXT = (
        "Termos e Condições de Utilização\n"
        "Última Revisão: Versão 1.0 — Junho 2026\n\n"
        "Bem-vindo à Plataforma de Badges da Softinsa. Ao registar-se e utilizar "
        "esta aplicação (Web e Mobile), o utilizador aceita expressamente os "
        "seguintes termos:\n\n"
        "1. Objetivo do Serviço\n"
        "A plataforma visa a partilha, validação e atribuição de insígnias digitais "
        "(badges) com base em evidências de competências técnicas e certificações "
        "obtidas externamente (e.g., Udemy, IBM, AWS, Microsoft).\n\n"
        "2. Elegibilidade e Registo\n"
        "O acesso é exclusivo a colaboradores e consultores da Softinsa. O "
        "utilizador obriga-se a fornecer dados verdadeiros no registo e a proceder "
        "à alteração obrigatória de palavra-passe no primeiro acesso.\n\n"
        "3. Submissão de Evidências\n"
        "Ao submeter candidaturas a um badge, o consultor é responsável pela "
        "veracidade dos ficheiros carregados (diplomas, relatórios, certificados). "
        "A submissão intencional de documentos falsos constitui uma infração "
        "disciplinar.\n\n"
        "4. Sistema de Gamificação e Pontuação\n"
        "A plataforma atribui pontos conforme a obtenção de badges. O sistema de "
        "pontuação é definido pelo Administrador e serve como critério interno de "
        "avaliação de mérito pelas lideranças (Service Line Leaders). Em caso de "
        "expiração de um badge, os pontos acumulados pelo consultor mantêm-se.\n\n"
        "5. Uso de Páginas Públicas\n"
        "Cada badge conquistado gera uma ligação (link) pública de verificação "
        "única. O utilizador compreende que este endereço poderá ser acedido "
        "publicamente e integrado em assinaturas de e-mail corporativas ou perfis "
        "de redes profissionais (LinkedIn)."
    )

    PRIVACY_TEXT = (
        "Política de Privacidade (RGPD)\n"
        "Última Revisão: Versão 1.0 — Junho 2026\n\n"
        "A Softinsa está empenhada em proteger os dados pessoais dos seus "
        "colaboradores. No âmbito da Plataforma de Badges, o tratamento de dados "
        "rege-se pelos seguintes pressupostos:\n\n"
        "1. Responsável pelo Tratamento\n"
        "Softinsa – Engenharia de Software Avançado, Lda.\n\n"
        "2. Dados Recolhidos\n"
        "Nome completo, e-mail corporativo, palavra-passe encriptada, Service "
        "Line/Área de atuação, histórico de formação, e ficheiros de evidências "
        "carregados pelo utilizador.\n\n"
        "3. Finalidade do Tratamento\n"
        "- Gestão e validação de competências internas.\n"
        "- Atribuição de incentivos profissionais com base no progresso das "
        "Learning Paths.\n"
        "- Disponibilização de uma galeria pública e mecanismos de partilha de "
        "conquistas no LinkedIn.\n\n"
        "4. Consentimento (RGPD)\n"
        "A publicação na galeria pública de badges e a partilha externa dependem "
        "da aceitação expressa e prévia dos termos do RGPD na plataforma. O "
        "utilizador tem o direito de revogar o seu consentimento a qualquer "
        "momento através das definições de perfil.\n\n"
        "5. Segurança\n"
        "Toda a comunicação entre o dispositivo do utilizador e os servidores da "
        "plataforma é obrigatoriamente cifrada através do protocolo HTTPS."
    )

    COOKIES_TEXT = (
        "Política de Cookies\n"
        "Última Revisão: Versão 1.0 — Junho 2026\n\n"
        "A Plataforma de Badges da Softinsa utiliza cookies para garantir o "
        "funcionamento seguro da aplicação. Esta política explica quais cookies "
        "são utilizados, a sua finalidade e a base legal aplicável.\n\n"
        "1. O Que São Cookies\n"
        "Cookies são pequenos ficheiros de texto armazenados no navegador do "
        "utilizador quando este acede à plataforma. Permitem que o servidor "
        "reconheça sessões e mantenha o estado de autenticação.\n\n"
        "2. Cookies Utilizados\n\n"
        "a) refreshToken (Cookie Estritamente Necessário)\n"
        "- Finalidade: Armazena o token de atualização (refresh token) que "
        "permite renovar a sessão do utilizador sem necessidade de repetir o "
        "início de sessão.\n"
        "- Tipo: Cookie HTTP-only, não acessível por JavaScript do lado do "
        "cliente.\n"
        "- Atributos de segurança: HttpOnly, Secure (em produção), SameSite="
        "Strict.\n"
        "- Âmbito (Path): Restrito às rotas de autenticação (/api/auth).\n"
        "- Duração: Até 30 dias quando a opção \"Lembrar-me\" está ativa; "
        "1 hora na sessão padrão.\n"
        "- Base legal: Interesse legítimo e necessidade técnica — este cookie é "
        "indispensável para o funcionamento da autenticação da plataforma.\n\n"
        "3. Cookies de Terceiros\n"
        "A plataforma não utiliza cookies de terceiros, de rastreamento "
        "publicitário ou de análise comportamental (analytics). Nenhum dado é "
        "partilhado com redes de publicidade ou plataformas de tracking.\n\n"
        "4. Gestão de Cookies\n"
        "Por se tratar de um cookie estritamente necessário ao funcionamento da "
        "plataforma, o refreshToken não requer consentimento separado nos termos "
        "do artigo 5.º, n.º 3 da Diretiva ePrivacy (2002/58/CE). O utilizador "
        "pode, no entanto, eliminar cookies através das definições do seu "
        "navegador, sendo que tal ação resultará no encerramento da sessão "
        "ativa.\n\n"
        "5. Alterações a Esta Política\n"
        "A Softinsa reserva-se o direito de atualizar esta política de cookies. "
        "Quaisquer alterações serão comunicadas através da plataforma e "
        "refletidas na data de revisão indicada no topo deste documento."
    )

    policy_templates = [
        ("Privacy", PRIVACY_TEXT),
        ("Terms", TERMS_TEXT),
        ("Cookies", COOKIES_TEXT),
    ]
    for index, (policy_type, policy_text) in enumerate(policy_templates):
        row = {
            "policy_id": ids.next("gdpr_policies"),
            "policy_type": policy_type,
            "version": "1.0",
            "policy_text": policy_text,
            "is_mandatory": policy_type in {"Privacy", "Terms"},
            "is_active": True,
            "updated_by": random.choice(admin_ids),
            "created_by": random.choice(admin_ids),
            "created_at": BASE_NOW - timedelta(days=120 - index * 10),
            "updated_at": BASE_NOW - timedelta(days=30 - index * 3),
        }
        gdpr_policies.append(row)
        sql.insert("gdpr_policies", row)

    for consultant in consultants:
        for policy in gdpr_policies:
            if not policy["is_mandatory"]:
                continue
            sql.insert("gdpr_consent_history", {
                "consent_id": ids.next("gdpr_consent_history"),
                "user_id": consultant["user_id"],
                "policy_id": policy["policy_id"],
                "action": "ACCEPTED",
                "ip_address": f"10.0.{random.randint(1, 254)}.{random.randint(1, 254)}",
                "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) SoftinsaMock/1.0",
                "consented_at": consultant["created_at"] + timedelta(minutes=random.randint(1, 30)),
            })

    for index in range(min(4, len(admin_ids))):
        admin_id = admin_ids[index % len(admin_ids)]
        platform = "teams" if index % 2 == 0 else "slack"
        sql.insert("integration_webhooks", {
            "webhook_id": ids.next("integration_webhooks"),
            "platform": platform,
            "webhook_url": f"https://hooks.{platform}.example.com/softinsa/channel-{index + 1}",
            "channel_name": f"#badges-alerts-{index + 1}",
            "is_active": index < 3,
            "created_by": admin_id,
            "updated_by": admin_id,
            "created_at": BASE_NOW - timedelta(days=60),
            "updated_at": BASE_NOW - timedelta(days=random.randint(1, 15)),
        })

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
        ("APPLICATION_APPROVED", "Application approved", "Badge application approved", "/applications", "APPLICATIONS"),
        ("APPLICATION_REJECTED", "Application rejected", "Badge application rejected", "/applications", "APPLICATIONS"),
        ("BADGE_EXPIRING_SOON", "Badge expiring soon", "An awarded badge is close to expiring", "/badges", "BADGES"),
        ("BADGE_EXPIRED", "Badge expired", "An awarded badge has expired", "/badges", "BADGES"),
        ("SLA_BREACH", "SLA breach", "An SLA response time has been exceeded", "/notifications", "SYSTEM"),
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

    for default_sla in DEFAULT_GLOBAL_SLAS:
        row = {
            "sla_id": ids.next("slas"),
            "sla_name": default_sla["sla_name"],
            "response_time_hours": default_sla["response_time_hours"],
            "start_date": BASE_NOW - timedelta(days=60),
            "end_date": BASE_NOW + timedelta(days=365),
            "target_profile": default_sla["target_profile"],
            "is_global": True,
            "is_active": True,
            "sla_description": default_sla["sla_description"],
            "definition_id": random.choice(notification_definitions)["definition_id"],
            "user_id": None,
            "created_by": random.choice(admin_ids),
            "updated_by": random.choice(admin_ids),
            "created_at": BASE_NOW - timedelta(days=80),
            "updated_at": BASE_NOW - timedelta(days=1),
        }
        slas.append(row)
        default_global_sla_ids.add(int(row["sla_id"]))
        sql.insert("slas", row)

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
            "is_global": index % 3 == 0,
            "is_active": True,
            "created_by": random.choice(admin_ids),
            "updated_by": random.choice(admin_ids),
            "created_at": starts_at - timedelta(days=3),
            "updated_at": starts_at - timedelta(days=1),
        }
        system_announcements.append(row)
        sql.insert("system_announcements", row)

    sql.section("5. Core Platform Architecture")

    sl_counter = 0
    area_counter = 0
    for lp_title, sl_map in PLATFORM_STRUCTURE.items():
        lp_row = {
            "learning_path_id": ids.next("learning_paths"),
            "path_title": lp_title,
            "path_slug": slugify(lp_title),
            "path_description": f"Structured Softinsa learning path for professional growth across all service lines.",
            "img_url": None,
            "is_active": True,
            "created_by": random.choice(admin_ids),
            "updated_by": random.choice(admin_ids),
            "created_at": BASE_NOW - timedelta(days=180),
            "updated_at": BASE_NOW - timedelta(days=30),
        }
        learning_paths.append(lp_row)
        sql.insert("learning_paths", lp_row)

        for sl_title, area_map in sl_map.items():
            sl_row = {
                "service_line_id": ids.next("service_lines"),
                "learning_path_id": lp_row["learning_path_id"],
                "service_line_name": sl_title,
                "sl_slug": slugify(sl_title),
                "service_line_description": f"Service line for {sl_title.lower()} delivery, mentoring and operational excellence.",
                "img_url": None,
                "is_active": True,
                "created_by": random.choice(admin_ids),
                "updated_by": random.choice(admin_ids),
                "created_at": BASE_NOW - timedelta(days=150 - sl_counter),
                "updated_at": BASE_NOW - timedelta(days=20 - min(sl_counter, 19)),
            }
            service_lines.append(sl_row)
            sql.insert("service_lines", sl_row)
            sl_counter += 1

            for area_title, badge_defs in area_map.items():
                area_row = {
                    "area_id": ids.next("areas"),
                    "service_line_id": sl_row["service_line_id"],
                    "area_name": area_title,
                    "area_slug": slugify(area_title),
                    "area_description": f"Area focused on {area_title.lower()} practices within {sl_title}.",
                    "img_url": None,
                    "is_active": True,
                    "created_by": random.choice(admin_ids),
                    "updated_by": random.choice(admin_ids),
                    "created_at": BASE_NOW - timedelta(days=130 - area_counter),
                    "updated_at": BASE_NOW - timedelta(days=10 - min(area_counter, 9)),
                }
                areas.append(area_row)
                sql.insert("areas", area_row)
                area_counter += 1

                sl_color = SL_COLORS.get(sl_title, "555555")
                for stage_idx, code in enumerate(STAGE_CODES):
                    stage_name, sequence, description = STAGE_NAMES[code]
                    stage_title_str = f"{area_title} - {stage_name}"
                    stage_row = {
                        "progression_stage_id": ids.next("progression_stages"),
                        "area_id": area_row["area_id"],
                        "stage_code_id": stage_codes[code],
                        "stage_title": stage_title_str[:100],
                        "stage_sequence": sequence,
                        "stage_description": f"{description} Area context: {area_title}.",
                        "created_by": random.choice(admin_ids),
                        "updated_by": random.choice(admin_ids),
                        "created_at": BASE_NOW - timedelta(days=110 - sequence),
                        "updated_at": BASE_NOW - timedelta(days=8 - min(sequence, 7)),
                    }
                    progression_stages.append(stage_row)
                    sql.insert("progression_stages", stage_row)

                    badge_title_str, badge_desc = badge_defs[stage_idx]
                    badge_type = "Special" if sequence == 5 else "Standard"
                    badge_row = {
                        "badge_id": ids.next("badges"),
                        "progression_stage_id": stage_row["progression_stage_id"],
                        "area_id": area_row["area_id"],
                        "service_line_id": sl_row["service_line_id"],
                        "learning_path_id": lp_row["learning_path_id"],
                        "badge_title": badge_title_str[:100],
                        "badge_slug": slugify(badge_title_str)[:100],
                        "badge_type": badge_type,
                        "badge_points": sequence * 125,
                        "expiration_duration_days": 730 if badge_type == "Special" else None,
                        "badge_description": badge_desc,
                        "badge_img_url": badge_svg_data_uri(code, sl_color),
                        "is_active": True,
                        "created_by": random.choice(admin_ids),
                        "updated_by": random.choice(admin_ids),
                        "created_at": BASE_NOW - timedelta(days=100),
                        "updated_at": BASE_NOW - timedelta(days=random.randint(1, 20)),
                        "_area_name": area_title,
                    }
                    badges.append(badge_row)
                    sql.insert("badges", {k: v for k, v in badge_row.items() if not k.startswith("_")})

    sql.comment("Service Line Leader profiles are emitted here, after service_lines, to satisfy service_line_id FK.")
    for index, leader_user_id in enumerate(sll_user_ids):
        service_line = service_lines[index % len(service_lines)]
        sql.insert("service_line_leaders", {
            "user_id": leader_user_id,
            "service_line_id": service_line["service_line_id"],
            "biography": f"Service Line Leader accountable for {service_line['service_line_name']} capability growth.",
        })

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

    skill_id_by_name = {skill["skill_name"]: skill["skills_id"] for skill in skills}
    for badge in badges:
        area_name = badge.get("_area_name", badge["badge_title"])
        theme_skills = next(
            (names for theme, names in THEME_BADGE_SKILLS.items() if theme in area_name),
            DEFAULT_BADGE_SKILLS,
        )
        pool = [skill_id_by_name[name] for name in theme_skills if name in skill_id_by_name]
        if not pool:
            continue
        badge_id = int(badge["badge_id"])
        count = min(len(pool), 4 + (badge_id % 3))
        start = badge_id % len(pool)
        chosen = sorted({pool[(start + offset) % len(pool)] for offset in range(count)})
        for skills_id in chosen:
            sql.insert("badge_skills", {
                "badge_id": badge_id,
                "skills_id": skills_id,
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

    for announcement in system_announcements:
        if announcement["is_global"]:
            continue
        role_sample = random.sample(TARGET_PROFILES, k=random.randint(1, 2))
        for role in role_sample:
            sql.insert("announc_roles", {
                "announcement_id": announcement["announcement_id"],
                "role_name": role,
            })

    sql.extend([
        "INSERT INTO sl_slas (service_line_id, sla_id)",
        "SELECT sl.service_line_id, s.sla_id",
        "FROM service_lines sl",
        "CROSS JOIN slas s",
        "WHERE s.sla_name IN ('Default Talent Manager Validation', 'Default Service Line Leader Validation')",
        "ON CONFLICT DO NOTHING;",
    ])

    for sla in slas:
        if int(sla["sla_id"]) in default_global_sla_ids:
            continue
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
            "reminder_sent": False,
            "auto_reminder_sent": False,
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
            "application_guid": uuid.uuid5(uuid.NAMESPACE_URL, f"softinsa-application-{index + 1}-{consultant_id}-{badge['badge_id']}"),
            "application_state": state,
            "consultant_notes": None,
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
        # An application can only leave 'Open' with evidence for EVERY requirement
        # (the API enforces this on submit), so only Open apps may have partial evidence.
        if application["application_state"] in {"Submitted", "In validation", "Accepted", "Rejected"}:
            evidence_count = len(badge_requirements)
        else:
            evidence_count = random.randint(0, len(badge_requirements))
        for requirement in badge_requirements[:evidence_count]:
            uploaded_at = application["opened_at"] + timedelta(days=random.randint(1, 10), hours=random.randint(1, 6))  # type: ignore[operator]
            if application["submitted_at"]:
                uploaded_at = min(uploaded_at, application["submitted_at"] - timedelta(hours=2))  # type: ignore[operator]
            row = {
                "evidence_id": ids.next("requirements_evidences"),
                "application_id": application["application_id"],
                "requirement_id": requirement["requirement_id"],
                # A real, publicly reachable sample file so "view document" works in tests.
                "evidence_file_url": "https://www.africau.edu/images/default/sample.pdf",
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
            "last_expiry_alert_days": None,
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
            "certificate_file_url": "https://www.africau.edu/images/default/sample.pdf",
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

    sla_breach_seen: set[tuple[int, int, int]] = set()
    for sla in slas:
        sampled_apps = random.sample(applications, k=min(len(applications), 3))
        for app in sampled_apps:
            recipient = random.choice(reviewer_pool)
            key = (int(sla["sla_id"]), int(app["application_id"]), recipient)
            if key in sla_breach_seen:
                continue
            sla_breach_seen.add(key)
            sql.insert("sla_breach_alerts", {
                "alert_id": ids.next("sla_breach_alerts"),
                "sla_id": sla["sla_id"],
                "application_id": app["application_id"],
                "user_id": recipient,
                "alerted_at": (app["submitted_at"] or app["opened_at"]) + timedelta(hours=int(sla["response_time_hours"]) + random.randint(1, 12)),
            })

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

    sql.comment("Store rewards (redeemable with points)")
    for reward in STORE_REWARDS:
        row = {"reward_id": ids.next("rewards")}
        row.update(reward)
        sql.insert("rewards", row)

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
            "send_email": index % 2 == 0,
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

    sql.section("12. Device Tokens & User Notification Preferences")

    device_token_platforms = ["android", "ios"]
    for index in range(NUM_DEVICE_TOKENS):
        cid = consultant_ids[index % len(consultant_ids)]
        platform = device_token_platforms[index % len(device_token_platforms)]
        sql.insert("device_tokens", {
            "device_token_id": ids.next("device_tokens"),
            "user_id": cid,
            "fcm_token": f"fcm_mock_token_user{cid}_device{index + 1}",
            "device_name": f"{'Pixel 8' if platform == 'android' else 'iPhone 15'} #{index + 1}",
            "platform": platform,
            "is_active": index % 5 != 0,
            "created_at": random_past_datetime(10, 60),
            "last_used_at": random_past_datetime(0, 10),
        })

    for index in range(NUM_USER_NOTIFICATION_PREF_OVERRIDES):
        cid = consultant_ids[index % len(consultant_ids)]
        definition = notification_definitions[index % len(notification_definitions)]
        sql.insert("user_notification_preferences", {
            "user_pref_id": ids.next("user_notification_preferences"),
            "user_id": cid,
            "definition_id": definition["definition_id"],
            "send_push": False if index % 3 == 0 else None,
            "send_email": False if index % 4 == 0 else None,
            "is_enabled": None,
            "updated_at": random_past_datetime(0, 20),
        })

    if INCLUDE_SEQUENCE_RESETS:
        sql.extend(sequence_reset_lines([
            ("languages", "language_id"),
            ("locations", "location_id"),
            ("stage_codes", "stage_code_id"),
            ("users", "user_id"),
            ("gdpr_policies", "policy_id"),
            ("gdpr_consent_history", "consent_id"),
            ("integration_webhooks", "webhook_id"),
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
            ("device_tokens", "device_token_id"),
            ("user_notification_preferences", "user_pref_id"),
            ("sla_breach_alerts", "alert_id"),
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
