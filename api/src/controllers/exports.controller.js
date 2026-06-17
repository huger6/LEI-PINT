const { QueryTypes } = require('sequelize');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const { sequelize } = require('../config/db');
const { logger } = require('../utils/logger');
const { exportQuerySchema, exportApplicationsQuerySchema, exportBadgesQuerySchema } = require('../validations/exports.validation');
const { handleZodError } = require('../utils/responseHelper');

const escapeCsvValue = (value) => {
    if (value === null || value === undefined) {
        return '';
    }

    const text = String(value).replace(/"/g, '""');
    return `"${text}"`;
};

const buildCsv = (columns, rows) => {
    const header = columns.map((column) => escapeCsvValue(column.header)).join(',');
    const lines = rows.map((row) => columns.map((column) => escapeCsvValue(column.accessor(row))).join(','));
    return [header, ...lines].join('\n');
};

const sendAttachment = (res, filename, contentType, body) => {
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', contentType);
    res.send(body);
};

const buildPdf = async (title, columns, rows) => new Promise((resolve, reject) => {
    // Wide tables (many columns) use landscape so cells don't get crushed.
    const landscape = columns.length > 6;
    const margin = 40;
    const doc = new PDFDocument({ size: 'A4', layout: landscape ? 'landscape' : 'portrait', margin });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const usableWidth = doc.page.width - margin * 2;
    const columnWidth = usableWidth / columns.length;
    const fontSize = columns.length > 9 ? 7 : (columns.length > 6 ? 8 : 9);
    const rowHeight = fontSize + 7;
    const bottomLimit = doc.page.height - margin - rowHeight;

    doc.fontSize(16).text(title, { align: 'center' });
    doc.moveDown(0.8);
    let rowY = doc.y;

    // Each cell is clipped to a single line (ellipsis) so rows never overlap.
    const drawRow = (cells, bold) => {
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(fontSize);
        cells.forEach((text, index) => {
            doc.text(String(text ?? ''), margin + (index * columnWidth), rowY, {
                width: columnWidth - 4,
                height: rowHeight,
                ellipsis: true,
                lineBreak: false,
            });
        });
        rowY += rowHeight;
        if (rowY > bottomLimit) {
            doc.addPage();
            rowY = margin;
        }
    };

    drawRow(columns.map((c) => c.header), true);
    rows.forEach((row) => drawRow(columns.map((c) => c.accessor(row)), false));

    doc.end();
});

const buildXlsx = async (sheetName, columns, rows) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName.slice(0, 31));

    worksheet.columns = columns.map((column) => ({ header: column.header, key: column.key, width: column.width || 24 }));
    worksheet.addRows(rows.map((row) => columns.reduce((acc, column) => {
        acc[column.key] = column.accessor(row);
        return acc;
    }, {})));

    worksheet.getRow(1).font = { bold: true };
    return workbook.xlsx.writeBuffer();
};

const getExportArgs = (req, schema = exportQuerySchema) => {
    const parsed = schema.parse(req.query);
    return {
        format: parsed.format || 'csv',
        from: parsed.from || null,
        to: parsed.to || null,
        state: parsed.state || null
    };
};

const getDateFilter = ({ from, to, columnName }) => {
    const conditions = [];
    const replacements = {};

    if (from) {
        conditions.push(`${columnName} >= :from`);
        replacements.from = from;
    }

    if (to) {
        // `to` is a calendar date (e.g. 2026-06-16). A plain `<= :to` coerces it
        // to midnight and drops everything that happened during that day, so the
        // selected end date appeared to be excluded. Compare against the start of
        // the *next* day to make the range inclusive of the whole `to` date.
        conditions.push(`${columnName} < (:to::date + 1)`);
        replacements.to = to;
    }

    return {
        whereSql: conditions.length ? ` AND ${conditions.join(' AND ')}` : '',
        replacements
    };
};

// Resolve the data scope for an export request. Talent Manager / Administrator
// get the full (global) dataset; Service Line Leader is scoped to their own
// Service Line so no cross-Service-Line data is ever exported.
const resolveExportScope = async (req) => {
    const role = req.user?.role;
    const userId = req.user?.sub;
    if (role !== 'Service Line Leader') {
        return { role, userId, serviceLineId: null };
    }
    const rows = await sequelize.query(
        'SELECT service_line_id FROM service_line_leaders WHERE user_id = :userId',
        { replacements: { userId }, type: QueryTypes.SELECT }
    );
    return { role, userId, serviceLineId: rows[0]?.service_line_id ?? null };
};

// Subquery (as SQL string) selecting the user_ids of consultants that belong to
// a Service Line, via their assigned areas. Used to scope consultant/points data.
const CONSULTANTS_IN_SL_SUBQUERY =
    '(SELECT ca.user_id FROM consultant_areas ca JOIN areas a ON a.area_id = ca.area_id WHERE a.service_line_id = :serviceLineId)';

const fetchConsultantRows = async ({ from, to, serviceLineId = null }) => {
    const { whereSql, replacements } = getDateFilter({ from, to, columnName: 'ph.created_at' });
    if (serviceLineId) replacements.serviceLineId = serviceLineId;
    const scopeSql = serviceLineId ? ` AND c.user_id IN ${CONSULTANTS_IN_SL_SUBQUERY}` : '';
    const sql = `
        SELECT
            u.user_guid,
            u.full_name,
            COALESCE(SUM(ph.points_delta), 0) AS total_points
        FROM consultants c
        INNER JOIN users u ON u.user_id = c.user_id
        LEFT JOIN points_history ph ON ph.user_id = c.user_id${whereSql}
        WHERE 1=1${scopeSql}
        GROUP BY u.user_guid, u.full_name
        ORDER BY total_points DESC, u.full_name ASC
    `;

    return sequelize.query(sql, {
        replacements,
        type: QueryTypes.SELECT
    });
};

const fetchApplicationLogRows = async ({ from, to, serviceLineId = null }) => {
    const { whereSql, replacements } = getDateFilter({ from, to, columnName: 'validated_at' });
    if (serviceLineId) replacements.serviceLineId = serviceLineId;
    const scopeSql = serviceLineId
        ? ` AND application_id IN (SELECT ba.application_id FROM badge_applications ba JOIN badges b ON b.badge_id = ba.badge_id WHERE b.service_line_id = :serviceLineId)`
        : '';
    const sql = `
        SELECT
            validation_log_id AS application_validation_log_id,
            application_id,
            validator_function,
            validator_action,
            validations_comments AS comments,
            validated_at AS created_at,
            user_id
        FROM application_validation_logs
        WHERE 1=1${whereSql}${scopeSql}
        ORDER BY validated_at DESC, validation_log_id DESC
    `;

    return sequelize.query(sql, {
        replacements,
        type: QueryTypes.SELECT
    });
};

const fetchApplicationRows = async ({ from, to, state, userId, role }) => {
    const { whereSql, replacements } = getDateFilter({ from, to, columnName: 'ba.opened_at' });
    const stateFilters = [];

    if (state && state.length > 0) {
        stateFilters.push('ba.application_state = ANY(:state)');
        replacements.state = state;
    }

    if (role === 'Consultant') {
        stateFilters.push('ba.user_id = :userId');
        replacements.userId = userId;
    } else if (role === 'Service Line Leader') {
        stateFilters.push(`ba.badge_id IN (
            SELECT b.badge_id
            FROM badges b
            INNER JOIN service_line_leaders sll ON sll.service_line_id = b.service_line_id
            WHERE sll.user_id = :userId
        )`);
        replacements.userId = userId;
    }

    const sql = `
        SELECT
            ba.application_id,
            ba.application_guid,
            ba.application_state,
            ba.opened_at,
            ba.submitted_at,
            ba.closed_at,
            ba.consultant_notes,
            u.user_guid,
            u.full_name,
            u.email_address,
            b.badge_title,
            b.badge_slug
        FROM badge_applications ba
        INNER JOIN consultants c ON c.user_id = ba.user_id
        INNER JOIN users u ON u.user_id = c.user_id
        INNER JOIN badges b ON b.badge_id = ba.badge_id
        WHERE 1=1${whereSql}${stateFilters.length ? ` AND ${stateFilters.join(' AND ')}` : ''}
        ORDER BY ba.opened_at DESC, ba.application_id DESC
    `;

    return sequelize.query(sql, {
        replacements,
        type: QueryTypes.SELECT
    });
};

const fetchPointsHistoryRows = async ({ from, to, serviceLineId = null }) => {
    const { whereSql, replacements } = getDateFilter({ from, to, columnName: 'ph.created_at' });
    if (serviceLineId) replacements.serviceLineId = serviceLineId;
    const scopeSql = serviceLineId ? ` AND ph.user_id IN ${CONSULTANTS_IN_SL_SUBQUERY}` : '';
    const sql = `
        SELECT
            ph.points_history_id,
            ph.user_id,
            u.full_name,
            ph.points_delta,
            ph.justification,
            ph.created_at
        FROM points_history ph
        INNER JOIN consultants c ON c.user_id = ph.user_id
        INNER JOIN users u ON u.user_id = c.user_id
        WHERE 1=1${whereSql}${scopeSql}
        ORDER BY ph.created_at DESC, ph.points_history_id DESC
    `;

    return sequelize.query(sql, {
        replacements,
        type: QueryTypes.SELECT
    });
};

const fetchBadgeRows = async ({ from, to, q, active, serviceLineId = null }) => {
    const { whereSql, replacements } = getDateFilter({ from, to, columnName: 'b.created_at' });
    const searchFilters = [];

    if (serviceLineId) {
        searchFilters.push('b.service_line_id = :serviceLineId');
        replacements.serviceLineId = serviceLineId;
    }

    if (typeof active === 'boolean') {
        searchFilters.push('b.is_active = :active');
        replacements.active = active;
    }

    if (q) {
        searchFilters.push('(b.badge_title ILIKE :q OR b.badge_slug ILIKE :q OR b.badge_type ILIKE :q)');
        replacements.q = `%${q}%`;
    }

    const sql = `
        SELECT
            b.badge_id,
            b.badge_title,
            b.badge_slug,
            b.badge_type,
            b.badge_points,
            b.is_active,
            b.created_at,
            b.updated_at,
            sl.service_line_name AS service_line_title,
            a.area_name AS area_title
        FROM badges b
        INNER JOIN service_lines sl ON sl.service_line_id = b.service_line_id
        INNER JOIN areas a ON a.area_id = b.area_id
        WHERE 1=1${whereSql}${searchFilters.length ? ` AND ${searchFilters.join(' AND ')}` : ''}
        ORDER BY b.badge_points DESC, b.badge_title ASC
    `;

    return sequelize.query(sql, {
        replacements,
        type: QueryTypes.SELECT
    });
};

const consultantColumns = [
    { key: 'user_guid', header: 'user_guid', accessor: (row) => row.user_guid, width: 38 },
    { key: 'full_name', header: 'full_name', accessor: (row) => row.full_name, width: 38 },
    { key: 'total_points', header: 'total_points', accessor: (row) => row.total_points, width: 18 }
];

const applicationLogColumns = [
    { key: 'application_validation_log_id', header: 'application_validation_log_id', accessor: (row) => row.application_validation_log_id, width: 18 },
    { key: 'application_id', header: 'application_id', accessor: (row) => row.application_id, width: 16 },
    { key: 'validator_function', header: 'validator_function', accessor: (row) => row.validator_function, width: 28 },
    { key: 'validator_action', header: 'validator_action', accessor: (row) => row.validator_action, width: 20 },
    { key: 'comments', header: 'comments', accessor: (row) => row.comments, width: 45 },
    { key: 'created_at', header: 'created_at', accessor: (row) => row.created_at, width: 24 },
    { key: 'user_id', header: 'user_id', accessor: (row) => row.user_id, width: 12 }
];

const applicationColumns = [
    { key: 'application_id', header: 'application_id', accessor: (row) => row.application_id, width: 14 },
    { key: 'application_guid', header: 'application_guid', accessor: (row) => row.application_guid, width: 38 },
    { key: 'application_state', header: 'application_state', accessor: (row) => row.application_state, width: 18 },
    { key: 'opened_at', header: 'opened_at', accessor: (row) => row.opened_at, width: 24 },
    { key: 'submitted_at', header: 'submitted_at', accessor: (row) => row.submitted_at, width: 24 },
    { key: 'closed_at', header: 'closed_at', accessor: (row) => row.closed_at, width: 24 },
    { key: 'user_guid', header: 'user_guid', accessor: (row) => row.user_guid, width: 38 },
    { key: 'full_name', header: 'full_name', accessor: (row) => row.full_name, width: 34 },
    { key: 'email_address', header: 'email_address', accessor: (row) => row.email_address, width: 34 },
    { key: 'badge_title', header: 'badge_title', accessor: (row) => row.badge_title, width: 34 },
    { key: 'badge_slug', header: 'badge_slug', accessor: (row) => row.badge_slug, width: 28 },
    { key: 'consultant_notes', header: 'consultant_notes', accessor: (row) => row.consultant_notes, width: 44 }
];

const pointsHistoryColumns = [
    { key: 'points_history_id', header: 'points_history_id', accessor: (row) => row.points_history_id, width: 18 },
    { key: 'user_id', header: 'user_id', accessor: (row) => row.user_id, width: 12 },
    { key: 'full_name', header: 'full_name', accessor: (row) => row.full_name, width: 34 },
    { key: 'points_delta', header: 'points_delta', accessor: (row) => row.points_delta, width: 14 },
    { key: 'justification', header: 'justification', accessor: (row) => row.justification, width: 48 },
    { key: 'created_at', header: 'created_at', accessor: (row) => row.created_at, width: 24 }
];

const badgeColumns = [
    { key: 'badge_id', header: 'badge_id', accessor: (row) => row.badge_id, width: 12 },
    { key: 'badge_title', header: 'badge_title', accessor: (row) => row.badge_title, width: 34 },
    { key: 'badge_slug', header: 'badge_slug', accessor: (row) => row.badge_slug, width: 28 },
    { key: 'badge_type', header: 'badge_type', accessor: (row) => row.badge_type, width: 22 },
    { key: 'badge_points', header: 'badge_points', accessor: (row) => row.badge_points, width: 14 },
    { key: 'is_active', header: 'is_active', accessor: (row) => row.is_active, width: 12 },
    { key: 'service_line_title', header: 'service_line_title', accessor: (row) => row.service_line_title, width: 28 },
    { key: 'area_title', header: 'area_title', accessor: (row) => row.area_title, width: 28 },
    { key: 'created_at', header: 'created_at', accessor: (row) => row.created_at, width: 24 },
    { key: 'updated_at', header: 'updated_at', accessor: (row) => row.updated_at, width: 24 }
];

const exportDataset = async ({ req, res, title, fileStem, columns, fetchRows, schema }) => {
    const { format, from, to, state } = getExportArgs(req, schema);
    const rows = await fetchRows({ from, to, state });
    const dateSuffix = new Date().toISOString().slice(0, 10);

    if (format === 'csv') {
        const csv = buildCsv(columns, rows);
        sendAttachment(res, `${fileStem}_${dateSuffix}.csv`, 'text/csv; charset=utf-8', csv);
        return;
    }

    if (format === 'xlsx') {
        const buffer = await buildXlsx(title, columns, rows);
        sendAttachment(res, `${fileStem}_${dateSuffix}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer);
        return;
    }

    const pdfBuffer = await buildPdf(title, columns, rows);
    sendAttachment(res, `${fileStem}_${dateSuffix}.pdf`, 'application/pdf', pdfBuffer);
};

const exportConsultants = async (req, res) => {
    try {
        const { serviceLineId } = await resolveExportScope(req);
        await exportDataset({
            req,
            res,
            title: 'Consultants export',
            fileStem: 'consultants_export',
            columns: consultantColumns,
            fetchRows: ({ from, to }) => fetchConsultantRows({ from, to, serviceLineId })
        });
    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_DATA_ERROR');

        logger.error('Error exporting consultants', { error });
        return res.status(500).json({ success: false, error: 'EXPORT_FAILED' });
    }
};

const exportApplicationLogs = async (req, res) => {
    try {
        const { serviceLineId } = await resolveExportScope(req);
        await exportDataset({
            req,
            res,
            title: 'Application validation logs export',
            fileStem: 'application_validation_logs',
            columns: applicationLogColumns,
            fetchRows: ({ from, to }) => fetchApplicationLogRows({ from, to, serviceLineId })
        });
    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_DATA_ERROR');

        logger.error('Error exporting application logs', { error });
        return res.status(500).json({ success: false, error: 'EXPORT_FAILED' });
    }
};

const exportApplications = async (req, res) => {
    try {
        const userId = req.user?.sub;
        const role = req.user?.role;

        await exportDataset({
            req,
            res,
            title: 'Applications export',
            fileStem: 'applications',
            columns: applicationColumns,
            fetchRows: ({ from, to, state }) => fetchApplicationRows({ from, to, state, userId, role }),
            schema: exportApplicationsQuerySchema
        });
    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_DATA_ERROR');

        logger.error('Error exporting applications', { error });
        return res.status(500).json({ success: false, error: 'EXPORT_FAILED' });
    }
};

const exportPointsHistory = async (req, res) => {
    try {
        const { serviceLineId } = await resolveExportScope(req);
        await exportDataset({
            req,
            res,
            title: 'Points history export',
            fileStem: 'points_history',
            columns: pointsHistoryColumns,
            fetchRows: ({ from, to }) => fetchPointsHistoryRows({ from, to, serviceLineId })
        });
    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_DATA_ERROR');

        logger.error('Error exporting points history', { error });
        return res.status(500).json({ success: false, error: 'EXPORT_FAILED' });
    }
};

const exportBadges = async (req, res) => {
    try {
        const { serviceLineId } = await resolveExportScope(req);
        await exportDataset({
            req,
            res,
            title: 'Badges export',
            fileStem: 'badges',
            columns: badgeColumns,
            fetchRows: ({ from, to }) => fetchBadgeRows({ from, to, serviceLineId }),
            schema: exportBadgesQuerySchema
        });
    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_DATA_ERROR');

        logger.error('Error exporting badges', { error });
        return res.status(500).json({ success: false, error: 'EXPORT_FAILED' });
    }
};

// ─── Per-structure summary export (Learning Path / Service Line / Area) ──────
const STRUCTURE_TYPES = new Set(['learning-path', 'service-line', 'area']);

const countOne = async (sql, replacements) => {
    const rows = await sequelize.query(sql, { replacements, type: QueryTypes.SELECT });
    return Number(rows[0]?.c ?? 0);
};

// Builds a { title, rows:[{metric,value}] } summary for one structure entity.
const fetchStructureSummary = async ({ type, identifier, from, to }) => {
    const awarded = getDateFilter({ from, to, columnName: 'ab.awarded_at' });
    const repl = { id: identifier, ...awarded.replacements };
    const awardedSql = awarded.whereSql;
    const rows = [];

    if (type === 'learning-path') {
        const lp = (await sequelize.query('SELECT learning_path_id, path_title FROM learning_paths WHERE path_slug = :id', { replacements: repl, type: QueryTypes.SELECT }))[0];
        if (!lp) return null;
        repl.lpId = lp.learning_path_id;
        rows.push({ metric: 'Service Lines', value: await countOne('SELECT COUNT(*) c FROM service_lines WHERE learning_path_id = :lpId', repl) });
        rows.push({ metric: 'Áreas', value: await countOne('SELECT COUNT(*) c FROM areas a JOIN service_lines sl ON sl.service_line_id = a.service_line_id WHERE sl.learning_path_id = :lpId', repl) });
        rows.push({ metric: 'Níveis', value: await countOne('SELECT COUNT(*) c FROM progression_stages ps JOIN areas a ON a.area_id = ps.area_id JOIN service_lines sl ON sl.service_line_id = a.service_line_id WHERE sl.learning_path_id = :lpId', repl) });
        rows.push({ metric: 'Badges', value: await countOne('SELECT COUNT(*) c FROM badges WHERE learning_path_id = :lpId', repl) });
        rows.push({ metric: 'Badges atribuídos', value: await countOne(`SELECT COUNT(*) c FROM awarded_badges ab JOIN badge_applications ba ON ba.application_id = ab.application_id JOIN badges b ON b.badge_id = ba.badge_id WHERE b.learning_path_id = :lpId${awardedSql}`, repl) });
        rows.push({ metric: 'Consultores inscritos', value: await countOne('SELECT COUNT(DISTINCT ca.user_id) c FROM consultant_areas ca JOIN areas a ON a.area_id = ca.area_id JOIN service_lines sl ON sl.service_line_id = a.service_line_id WHERE sl.learning_path_id = :lpId', repl) });
        return { title: `Resumo Learning Path: ${lp.path_title}`, rows };
    }

    if (type === 'service-line') {
        const sl = (await sequelize.query('SELECT service_line_id, service_line_name FROM service_lines WHERE sl_slug = :id', { replacements: repl, type: QueryTypes.SELECT }))[0];
        if (!sl) return null;
        repl.slId = sl.service_line_id;
        rows.push({ metric: 'Áreas', value: await countOne('SELECT COUNT(*) c FROM areas WHERE service_line_id = :slId', repl) });
        rows.push({ metric: 'Níveis', value: await countOne('SELECT COUNT(*) c FROM progression_stages ps JOIN areas a ON a.area_id = ps.area_id WHERE a.service_line_id = :slId', repl) });
        rows.push({ metric: 'Badges', value: await countOne('SELECT COUNT(*) c FROM badges WHERE service_line_id = :slId', repl) });
        rows.push({ metric: 'Badges atribuídos', value: await countOne(`SELECT COUNT(*) c FROM awarded_badges ab JOIN badge_applications ba ON ba.application_id = ab.application_id JOIN badges b ON b.badge_id = ba.badge_id WHERE b.service_line_id = :slId${awardedSql}`, repl) });
        rows.push({ metric: 'Consultores inscritos', value: await countOne('SELECT COUNT(DISTINCT ca.user_id) c FROM consultant_areas ca JOIN areas a ON a.area_id = ca.area_id WHERE a.service_line_id = :slId', repl) });
        return { title: `Resumo Service Line: ${sl.service_line_name}`, rows };
    }

    // area
    const area = (await sequelize.query('SELECT area_id, area_name FROM areas WHERE area_slug = :id', { replacements: repl, type: QueryTypes.SELECT }))[0];
    if (!area) return null;
    repl.areaId = area.area_id;
    rows.push({ metric: 'Níveis', value: await countOne('SELECT COUNT(*) c FROM progression_stages WHERE area_id = :areaId', repl) });
    rows.push({ metric: 'Badges', value: await countOne('SELECT COUNT(*) c FROM badges WHERE area_id = :areaId', repl) });
    rows.push({ metric: 'Badges atribuídos', value: await countOne(`SELECT COUNT(*) c FROM awarded_badges ab JOIN badge_applications ba ON ba.application_id = ab.application_id JOIN badges b ON b.badge_id = ba.badge_id WHERE b.area_id = :areaId${awardedSql}`, repl) });
    rows.push({ metric: 'Consultores inscritos', value: await countOne('SELECT COUNT(DISTINCT user_id) c FROM consultant_areas WHERE area_id = :areaId', repl) });
    return { title: `Resumo Área: ${area.area_name}`, rows };
};

const structureSummaryColumns = [
    { key: 'metric', header: 'Métrica', accessor: (r) => r.metric, width: 36 },
    { key: 'value', header: 'Valor', accessor: (r) => r.value, width: 18 }
];

const exportStructureSummary = async (req, res) => {
    try {
        const { type, identifier } = req.params;
        if (!STRUCTURE_TYPES.has(type)) {
            return res.status(400).json({ success: false, error: 'EXPORT_INVALID_STRUCTURE_TYPE' });
        }
        const { format, from, to } = getExportArgs(req);
        const summary = await fetchStructureSummary({ type, identifier, from, to });
        if (!summary) {
            return res.status(404).json({ success: false, error: 'STRUCTURE_NOT_FOUND' });
        }

        const dateSuffix = new Date().toISOString().slice(0, 10);
        const fileStem = `resumo_${type}_${identifier}`;
        if (format === 'csv') {
            return sendAttachment(res, `${fileStem}_${dateSuffix}.csv`, 'text/csv; charset=utf-8', buildCsv(structureSummaryColumns, summary.rows));
        }
        if (format === 'xlsx') {
            const buffer = await buildXlsx(summary.title, structureSummaryColumns, summary.rows);
            return sendAttachment(res, `${fileStem}_${dateSuffix}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer);
        }
        const pdfBuffer = await buildPdf(summary.title, structureSummaryColumns, summary.rows);
        return sendAttachment(res, `${fileStem}_${dateSuffix}.pdf`, 'application/pdf', pdfBuffer);
    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_DATA_ERROR');
        logger.error('Error exporting structure summary', { error });
        return res.status(500).json({ success: false, error: 'EXPORT_FAILED' });
    }
};

module.exports = {
    exportConsultants,
    exportApplicationLogs,
    exportApplications,
    exportBadges,
    exportPointsHistory,
    exportStructureSummary
};
