const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const DEFAULT_COUNT = 200;
const DEFAULT_BATCH_SIZE = 50;
const DEFAULT_BCRYPT_ROUNDS = 10;
const DEFAULT_APPLICATION_STATES = ['Open', 'Submitted', 'Approved', 'Rejected', 'Closed'];
const DEFAULT_BADGE_TYPES = ['Technical', 'Behavioral', 'Certification', 'Participation'];
const DEFAULT_ROLES = ['Consultant', 'Administrator', 'Talent Manager'];

const parseArgs = (argv) => {
    const options = {
        count: DEFAULT_COUNT,
        reset: false,
        tables: null
    };

    for (const arg of argv) {
        if (arg === '--reset' || arg === '--truncate') {
            options.reset = true;
            continue;
        }

        const [key, value] = arg.split('=');
        if (!key || value === undefined) continue;

        if (key === '--count') {
            const parsed = Number(value);
            if (Number.isFinite(parsed) && parsed > 0) {
                options.count = Math.floor(parsed);
            }
            continue;
        }

        if (key === '--tables') {
            options.tables = value
                .split(',')
                .map((table) => table.trim())
                .filter(Boolean);
        }
    }

    return options;
};

const toLabel = (value) => value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const safeBase = (value) => value.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();

const uniqueToken = () => crypto.randomUUID().replace(/-/g, '').slice(0, 12);

const pick = (values, index) => values[index % values.length];

const rollBoolean = (index) => index % 2 === 0;

const rollDate = (index, daysBack = 365) => {
    const date = new Date();
    date.setDate(date.getDate() - (index % daysBack));
    date.setHours(12, 0, 0, 0);
    return date;
};

const rollDateOnly = (index, daysBack = 365) => rollDate(index, daysBack).toISOString().slice(0, 10);

const rollTime = (index) => {
    const hours = String((index * 3) % 24).padStart(2, '0');
    const minutes = String((index * 7) % 60).padStart(2, '0');
    const seconds = String((index * 11) % 60).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
};

const SPECIAL_FIELD_VALUES = {
    users: {
        user_role: (index) => pick(DEFAULT_ROLES, index),
        password_hash: () => bcrypt.hashSync('Test123!', DEFAULT_BCRYPT_ROUNDS),
        phone_number: (index) => `+3519${String(10000000 + index).slice(-8)}`,
        birthdate: (index) => rollDateOnly(index, 12000),
        profile_img_url: (index, fieldName, modelName) => `https://example.com/${safeBase(modelName)}/${fieldName}/${index}.png`,
        last_login_at: (index) => rollDate(index, 90),
        last_online: (index) => rollDate(index, 7),
        current_streak_days: (index) => index % 31
    },
    languages: {
        language_iso: (index) => pick(['pt', 'en', 'es', `lg-${index}`], index),
        language_name: (index) => pick(['Portuguese', 'English', 'Spanish', `Language ${index}`], index)
    },
    locations: {
        location_name: (index) => `Location ${index}`
    },
    learning_paths: {
        path_name: (index) => `Learning Path ${index}`,
        path_slug: (index) => `learning-path-${index}-${uniqueToken()}`,
        path_description: (index) => `Learning path generated for test data ${index}.`
    },
    service_lines: {
        service_line_name: (index) => `Service Line ${index}`,
        sl_slug: (index) => `service-line-${index}-${uniqueToken()}`,
        service_line_description: (index) => `Service line generated for test data ${index}.`
    },
    areas: {
        area_name: (index) => `Area ${index}`,
        area_slug: (index) => `area-${index}-${uniqueToken()}`,
        area_code: (index) => `AR-${String(index).padStart(4, '0')}`,
        area_description: (index) => `Area generated for test data ${index}.`
    },
    stage_codes: {
        stage_code_name: (index) => `Stage Code ${index}`,
        stage_code_description: (index) => `Stage code generated for test data ${index}.`
    },
    progression_stages: {
        stage_name: (index) => `Progression Stage ${index}`,
        stage_description: (index) => `Progression stage generated for test data ${index}.`
    },
    badges: {
        badge_title: (index) => `Badge ${index}`,
        badge_slug: (index) => `badge-${index}-${uniqueToken()}`,
        badge_type: (index) => pick(DEFAULT_BADGE_TYPES, index),
        badge_points: (index) => 10 + (index % 250),
        expiration_duration_days: (index) => (index % 2 === 0 ? 90 + (index % 120) : null),
        estimated_time_to_acquire: (index) => rollTime(index),
        badge_description: (index) => `Badge generated for test data ${index}.`,
        badge_img_url: (index, fieldName, modelName) => `https://example.com/${safeBase(modelName)}/${fieldName}/${index}.png`
    },
    badge_requirements: {
        requirement_title: (index) => `Requirement ${index}`,
        requirement_description: (index) => `Requirement generated for test data ${index}.`
    },
    goals: {
        goal_title: (index) => `Goal ${index}`,
        goal_description: (index) => `Goal generated for test data ${index}.`
    },
    rewards: {
        reward_title: (index) => `Reward ${index}`,
        reward_description: (index) => `Reward generated for test data ${index}.`
    },
    skills: {
        skill_name: (index) => `Skill ${index}`,
        skill_description: (index) => `Skill generated for test data ${index}.`
    },
    notification_definitions: {
        definition_name: (index) => `Notification Definition ${index}`,
        definition_code: (index) => `NOTIF-${String(index).padStart(4, '0')}`,
        title: (index) => `Notification Definition ${index}`,
        description: (index) => `Definition generated for test data ${index}.`
    },
    notification_preferences: {
        preference_name: (index) => `Preference ${index}`,
        preference_description: (index) => `Preference generated for test data ${index}.`
    },
    slas: {
        sla_name: (index) => `SLA ${index}`,
        sla_description: (index) => `SLA generated for test data ${index}.`
    },
    system_announcements: {
        announcement_title: (index) => `Announcement ${index}`,
        announcement_slug: (index) => `announcement-${index}-${uniqueToken()}`,
        announcement_body: (index) => `Announcement generated for test data ${index}.`
    },
    badge_applications: {
        application_state: (index) => pick(DEFAULT_APPLICATION_STATES, index),
        reviewer_notes: (index) => `Reviewer notes generated for test data ${index}.`,
        submitted_at: (index) => (index % 3 === 0 ? rollDate(index, 180) : null),
        closed_at: (index) => (index % 4 === 0 ? rollDate(index, 90) : null)
    },
    awarded_badges: {
        awarded_at: (index) => rollDate(index, 180)
    },
    certificates: {
        certificate_title: (index) => `Certificate ${index}`,
        certificate_file_url: (index, fieldName, modelName) => `https://example.com/${safeBase(modelName)}/${fieldName}/${index}.pdf`
    },
    points_history: {
        points_delta: (index) => (index % 2 === 0 ? 10 : -5),
        reason: (index) => `Points history generated for test data ${index}.`
    },
    requirements_evidences: {
        evidence_title: (index) => `Evidence ${index}`,
        evidence_description: (index) => `Evidence generated for test data ${index}.`,
        evidence_url: (index, fieldName, modelName) => `https://example.com/${safeBase(modelName)}/${fieldName}/${index}.pdf`
    },
    notifications: {
        title: (index) => `Notification ${index}`,
        body: (index) => `Notification generated for test data ${index}.`
    },
    consultant_areas: {
        is_primary: (index) => index % 5 === 0
    },
    consultants_selected_skills: {
        proficiency: (index) => pick(['Beginner', 'Intermediate', 'Advanced'], index)
    },
    service_line_leaders: {
        leadership_notes: (index) => `Leadership notes generated for test data ${index}.`
    },
    user_badges_interactions: {
        interaction_type: (index) => pick(['Viewed', 'Liked', 'Shared', 'Saved'], index)
    },
    user_account_tokens: {
        token_hash: () => crypto.randomUUID().replace(/-/g, ''),
        token_expires_at: (index) => rollDate(index, 30)
    },
    user_refresh_tokens: {
        token_hash: () => crypto.randomUUID().replace(/-/g, ''),
        token_expires_at: (index) => rollDate(index, 30)
    },
    gdpr_policies: {
        policy_title: (index) => `GDPR Policy ${index}`,
        policy_description: (index) => `GDPR policy generated for test data ${index}.`
    },
    announc_sl: {
        note: (index) => `Announcement/service line link ${index}`
    },
    sl_slas: {
        note: (index) => `SLA/service line link ${index}`
    },
    talent_managers: {
        notes: (index) => `Talent manager note ${index}`
    },
    administrators: {
        notes: (index) => `Administrator note ${index}`
    }
};

const getModelNameByReference = (models, referenceModelName) => {
    if (!referenceModelName) return null;
    if (models[referenceModelName]) return referenceModelName;

    return Object.keys(models).find((modelName) => models[modelName].tableName === referenceModelName) || null;
};

const getPrimaryKeyField = (model) => {
    const entry = Object.entries(model.rawAttributes).find(([, attribute]) => attribute.primaryKey);
    return entry ? entry[0] : null;
};

const getRequiredDependencies = (modelName, model, models) => {
    const dependencies = new Set();

    for (const attribute of Object.values(model.rawAttributes)) {
        if (!attribute.references || attribute.allowNull !== false) continue;

        const dependencyName = getModelNameByReference(models, attribute.references.model);
        if (dependencyName && dependencyName !== modelName) {
            dependencies.add(dependencyName);
        }
    }

    return [...dependencies];
};

const topologicalSortModels = (models, preferredOrder) => {
    const visited = new Set();
    const active = new Set();
    const ordered = [];

    const visit = (modelName) => {
        if (visited.has(modelName) || active.has(modelName)) return;

        active.add(modelName);
        const model = models[modelName];
        for (const dependency of getRequiredDependencies(modelName, model, models)) {
            visit(dependency);
        }
        active.delete(modelName);
        visited.add(modelName);
        ordered.push(modelName);
    };

    for (const modelName of preferredOrder) {
        if (models[modelName]) visit(modelName);
    }

    for (const modelName of Object.keys(models)) {
        visit(modelName);
    }

    return ordered;
};

const getExistingPrimaryKeys = async (model) => {
    const primaryKeyField = getPrimaryKeyField(model);
    if (!primaryKeyField) return [];

    const rows = await model.findAll({
        attributes: [primaryKeyField],
        raw: true
    });

    return rows.map((row) => row[primaryKeyField]).filter((value) => value !== null && value !== undefined);
};

const clampLength = (value, attribute) => {
    if (typeof value !== 'string') return value;
    const maxLength = attribute?.type?.length;
    if (!maxLength || value.length <= maxLength) return value;
    return value.slice(0, maxLength);
};

const generateStringValue = ({ modelName, fieldName, attribute, index }) => {
    const lowerField = fieldName.toLowerCase();
    const modelOverrides = SPECIAL_FIELD_VALUES[modelName] || {};
    const override = modelOverrides[fieldName];
    if (override) return clampLength(override(index, fieldName, modelName), attribute);

    if (lowerField.includes('email')) return clampLength(`${modelName}.${index}.${uniqueToken()}@example.com`, attribute);
    if (lowerField.includes('username')) return clampLength(`${modelName}_${index}_${uniqueToken()}`, attribute);
    if (lowerField.includes('slug')) return clampLength(`${safeBase(modelName)}-${index}-${uniqueToken()}`, attribute);
    if (lowerField.includes('phone')) return clampLength(`+3519${String(10000000 + index).slice(-8)}`, attribute);
    if (lowerField.includes('iso')) return clampLength(`lg-${index}`, attribute);
    if (lowerField.includes('role')) return clampLength(pick(DEFAULT_ROLES, index), attribute);
    if (lowerField.includes('state')) return clampLength(pick(DEFAULT_APPLICATION_STATES, index), attribute);
    if (lowerField.includes('type')) return clampLength(pick(DEFAULT_BADGE_TYPES, index), attribute);
    if (lowerField.includes('code')) return clampLength(`${safeBase(modelName).slice(0, 3).toUpperCase()}-${String(index).padStart(4, '0')}`, attribute);
    if (lowerField.includes('title') || lowerField.includes('name')) return clampLength(`${toLabel(modelName)} ${index}`, attribute);
    if (lowerField.includes('description') || lowerField.includes('biography') || lowerField.includes('notes') || lowerField.includes('body') || lowerField.includes('content')) {
        return clampLength(`${toLabel(modelName)} ${fieldName} ${index} generated for test data.`, attribute);
    }
    if (lowerField.includes('url') || lowerField.includes('img') || lowerField.includes('file')) {
        const extension = lowerField.includes('pdf') ? 'pdf' : 'png';
        return clampLength(`https://example.com/${safeBase(modelName)}/${fieldName}/${index}.${extension}`, attribute);
    }
    if (lowerField.includes('hash') || lowerField.includes('token')) return clampLength(crypto.randomUUID().replace(/-/g, ''), attribute);

    return clampLength(`${toLabel(modelName)} ${fieldName} ${index} ${uniqueToken()}`, attribute);
};

const generateNumericValue = ({ modelName, fieldName, index, attribute }) => {
    const lowerField = fieldName.toLowerCase();
    const modelOverrides = SPECIAL_FIELD_VALUES[modelName] || {};
    const override = modelOverrides[fieldName];
    if (override) return override(index, fieldName, modelName);

    if (lowerField.includes('points')) return index * 10;
    if (lowerField.includes('duration')) return 30 + (index % 365);
    if (lowerField.includes('days')) return index % 365;
    if (lowerField.includes('priority')) return index % 10;
    if (lowerField.includes('order')) return index;
    if (lowerField.includes('level')) return 1 + (index % 10);
    if (lowerField.includes('rate')) return Number(((index % 100) / 10).toFixed(attribute?.type?.scale || 1));

    return index;
};

const generateDateValue = ({ modelName, fieldName, index, isOnlyDate = false }) => {
    const modelOverrides = SPECIAL_FIELD_VALUES[modelName] || {};
    const override = modelOverrides[fieldName];
    if (override) return override(index, fieldName, modelName);

    return isOnlyDate ? rollDateOnly(index, 3650) : rollDate(index, 3650);
};

const generateValueForAttribute = ({ modelName, fieldName, attribute, index, state }) => {
    const modelOverrides = SPECIAL_FIELD_VALUES[modelName] || {};
    const override = modelOverrides[fieldName];
    if (override) return clampLength(override(index, fieldName, modelName), attribute);

    if (attribute.references) {
        const dependencyName = getModelNameByReference(state.models, attribute.references.model);
        const dependencyIds = dependencyName ? state.generatedIds[dependencyName] : null;
        if (dependencyIds && dependencyIds.length) {
            return pick(dependencyIds, index);
        }
    }

    if (attribute.values && Array.isArray(attribute.values) && attribute.values.length) {
        return pick(attribute.values, index);
    }

    switch (attribute.type?.key) {
        case 'BOOLEAN':
            return rollBoolean(index);
        case 'DATEONLY':
            return generateDateValue({ modelName, fieldName, index, isOnlyDate: true });
        case 'DATE':
            return generateDateValue({ modelName, fieldName, index });
        case 'TIME':
            return rollTime(index);
        case 'UUID':
            return crypto.randomUUID();
        case 'INTEGER':
        case 'BIGINT':
        case 'SMALLINT':
        case 'TINYINT':
        case 'FLOAT':
        case 'DOUBLE':
        case 'DECIMAL':
            return generateNumericValue({ modelName, fieldName, index, attribute });
        case 'TEXT':
        case 'STRING':
        case 'CHAR':
            return generateStringValue({ modelName, fieldName, attribute, index });
        case 'ENUM':
            return attribute.values ? pick(attribute.values, index) : generateStringValue({ modelName, fieldName, attribute, index });
        case 'JSON':
        case 'JSONB':
            return {
                generated: true,
                model: modelName,
                field: fieldName,
                index
            };
        default:
            return generateStringValue({ modelName, fieldName, attribute, index });
    }
};

const shouldSkipAttribute = (attribute) => attribute.autoIncrement || attribute.primaryKey;

const buildPayload = ({ modelName, model, index, state }) => {
    const payload = {};

    for (const [fieldName, attribute] of Object.entries(model.rawAttributes)) {
        if (shouldSkipAttribute(attribute)) continue;

        const value = generateValueForAttribute({ modelName, fieldName, attribute, index, state });
        if (value !== undefined) {
            payload[fieldName] = value;
        }
    }

    return payload;
};

const seedModel = async ({ modelName, models, targetCount, state, seededModels }) => {
    if (seededModels.has(modelName)) return;

    const model = models[modelName];
    if (!model) return;

    for (const dependency of getRequiredDependencies(modelName, model, models)) {
        await seedModel({
            modelName: dependency,
            models,
            targetCount,
            state,
            seededModels
        });
    }

    const existingIds = await getExistingPrimaryKeys(model);
    state.generatedIds[modelName] = [...existingIds];

    const currentCount = existingIds.length;
    const missingCount = Math.max(0, targetCount - currentCount);
    if (missingCount === 0) {
        seededModels.add(modelName);
        return;
    }

    console.log(`Seeding ${modelName}: ${currentCount} existing, adding ${missingCount}`);

    for (let createdIndex = 1; createdIndex <= missingCount; createdIndex += 1) {
        const absoluteIndex = currentCount + createdIndex;
        const payload = buildPayload({ modelName, model, index: absoluteIndex, state });
        const created = await model.create(payload);
        const primaryKeyField = getPrimaryKeyField(model);

        if (primaryKeyField) {
            state.generatedIds[modelName].push(created[primaryKeyField]);
        }

        if (createdIndex % DEFAULT_BATCH_SIZE === 0 || createdIndex === missingCount) {
            console.log(`  ${modelName}: ${createdIndex}/${missingCount}`);
        }
    }

    seededModels.add(modelName);
};

const main = async () => {
    const { sequelize, models } = require('../config/db');
    const options = parseArgs(process.argv.slice(2));

    const preferredOrder = [
        'languages',
        'locations',
        'stage_codes',
        'learning_paths',
        'users',
        'administrators',
        'consultants'
    ].filter((modelName) => models[modelName]);

    const orderedModels = topologicalSortModels(models, preferredOrder);
    const targetModels = options.tables?.length
        ? orderedModels.filter((modelName) => options.tables.includes(modelName) || options.tables.includes(models[modelName].tableName))
        : orderedModels;

    await sequelize.authenticate();

    if (options.reset) {
        const tables = [...new Set(orderedModels.map((modelName) => `"${models[modelName].tableName}"`))];
        if (tables.length) {
            await sequelize.query(`TRUNCATE ${tables.join(', ')} RESTART IDENTITY CASCADE;`);
        }
    }

    const state = {
        models,
        generatedIds: {}
    };
    const seededModels = new Set();

    for (const modelName of targetModels) {
        await seedModel({
            modelName,
            models,
            targetCount: options.count,
            state,
            seededModels
        });
    }

    await sequelize.close();
    console.log(`Mass test data generation completed for ${targetModels.length} tables.`);
};

if (require.main === module) {
    main().catch((error) => {
        console.error('Failed to generate test data:', error);
        process.exitCode = 1;
    });
}

module.exports = {
    parseArgs,
    topologicalSortModels,
    getRequiredDependencies,
    buildPayload,
    generateValueForAttribute
};