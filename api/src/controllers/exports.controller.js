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
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).text(title, { align: 'center' });
    doc.moveDown(1);

    const columnWidth = 515 / columns.length;
    const startY = doc.y;

    doc.fontSize(9).font('Helvetica-Bold');
    columns.forEach((column, index) => {
        doc.text(column.header, 40 + (index * columnWidth), startY, { width: columnWidth - 6 });
    });

    doc.moveDown(0.5);
    doc.font('Helvetica');
    let rowY = doc.y;

    rows.forEach((row) => {
        columns.forEach((column, index) => {
            doc.text(String(column.accessor(row) ?? ''), 40 + (index * columnWidth), rowY, { width: columnWidth - 6 });
        });
        rowY += 18;
        if (rowY > doc.page.height - 70) {
            doc.addPage();
            rowY = 40;
        }
    });

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
        conditions.push(`${columnName} <= :to`);
        replacements.to = to;
    }

    return {
        whereSql: conditions.length ? ` AND ${conditions.join(' AND ')}` : '',
        replacements
    };
};

const fetchConsultantRows = async ({ from, to }) => {
    const { whereSql, replacements } = getDateFilter({ from, to, columnName: 'ph.created_at' });
    const sql = `
        SELECT
            u.user_guid,
            u.full_name,
            COALESCE(SUM(ph.points_delta), 0) AS total_points
        FROM consultants c
        INNER JOIN users u ON u.user_id = c.user_id
        LEFT JOIN points_history ph ON ph.user_id = c.user_id${whereSql}
        GROUP BY u.user_guid, u.full_name
        ORDER BY total_points DESC, u.full_name ASC
    `;

    return sequelize.query(sql, {
        replacements,
        type: QueryTypes.SELECT
    });
};

const fetchApplicationLogRows = async ({ from, to }) => {
    const { whereSql, replacements } = getDateFilter({ from, to, columnName: 'created_at' });
    const sql = `
        SELECT
            application_validation_log_id,
            application_id,
            validator_function,
            validator_action,
            comments,
            created_at,
            user_id
        FROM application_validation_logs
        WHERE 1=1${whereSql}
        ORDER BY created_at DESC, application_validation_log_id DESC
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

const fetchPointsHistoryRows = async ({ from, to }) => {
    const { whereSql, replacements } = getDateFilter({ from, to, columnName: 'ph.created_at' });
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
        WHERE 1=1${whereSql}
        ORDER BY ph.created_at DESC, ph.points_history_id DESC
    `;

    return sequelize.query(sql, {
        replacements,
        type: QueryTypes.SELECT
    });
};

const fetchBadgeRows = async ({ from, to, q, active }) => {
    const { whereSql, replacements } = getDateFilter({ from, to, columnName: 'b.created_at' });
    const searchFilters = [];

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
            sl.service_line_title,
            a.area_title
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
        await exportDataset({
            req,
            res,
            title: 'Consultants export',
            fileStem: 'consultants_export',
            columns: consultantColumns,
            fetchRows: fetchConsultantRows
        });
    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_DATA_ERROR');

        logger.error('Error exporting consultants', { error });
        return res.status(500).json({ success: false, error: 'EXPORT_FAILED' });
    }
};

const exportApplicationLogs = async (req, res) => {
    try {
        await exportDataset({
            req,
            res,
            title: 'Application validation logs export',
            fileStem: 'application_validation_logs',
            columns: applicationLogColumns,
            fetchRows: fetchApplicationLogRows
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
        await exportDataset({
            req,
            res,
            title: 'Points history export',
            fileStem: 'points_history',
            columns: pointsHistoryColumns,
            fetchRows: fetchPointsHistoryRows
        });
    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_DATA_ERROR');

        logger.error('Error exporting points history', { error });
        return res.status(500).json({ success: false, error: 'EXPORT_FAILED' });
    }
};

const exportBadges = async (req, res) => {
    try {
        await exportDataset({
            req,
            res,
            title: 'Badges export',
            fileStem: 'badges',
            columns: badgeColumns,
            fetchRows: fetchBadgeRows,
            schema: exportBadgesQuerySchema
        });
    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_DATA_ERROR');

        logger.error('Error exporting badges', { error });
        return res.status(500).json({ success: false, error: 'EXPORT_FAILED' });
    }
};

module.exports = {
    exportConsultants,
    exportApplicationLogs,
    exportApplications,
    exportBadges,
    exportPointsHistory
};
