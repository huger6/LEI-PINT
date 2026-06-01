const PDFDocument = require('pdfkit');

const SUPPORTED_LANGS = ['pt', 'en', 'es'];

const i18n = {
    pt: {
        heading: 'CERTIFICADO DE CONCLUSÃO',
        certifies: 'Certifica-se que',
        completed: 'concluiu com sucesso o badge',
        startDate: 'Data de início',
        conclusionDate: 'Data de conclusão',
        approvedByTM: 'Aprovado pelo Talent Manager',
        approvedBySLL: 'Aprovado pelo Service Line Leader',
        issuedBy: 'Emitido por',
        locale: 'pt-PT'
    },
    en: {
        heading: 'CERTIFICATE OF COMPLETION',
        certifies: 'This certifies that',
        completed: 'has successfully completed the badge',
        startDate: 'Start date',
        conclusionDate: 'Conclusion date',
        approvedByTM: 'Approved by Talent Manager',
        approvedBySLL: 'Approved by Service Line Leader',
        issuedBy: 'Issued by',
        locale: 'en-GB'
    },
    es: {
        heading: 'CERTIFICADO DE FINALIZACIÓN',
        certifies: 'Se certifica que',
        completed: 'ha completado con éxito el badge',
        startDate: 'Fecha de inicio',
        conclusionDate: 'Fecha de conclusión',
        approvedByTM: 'Aprobado por el Talent Manager',
        approvedBySLL: 'Aprobado por el Service Line Leader',
        issuedBy: 'Emitido por',
        locale: 'es-ES'
    }
};

const formatDate = (date, locale) =>
    new Date(date).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });

const drawBorder = (doc) => {
    const { width, height } = doc.page;
    doc.rect(20, 20, width - 40, height - 40).lineWidth(3).strokeColor('#2C3E50').stroke();
    doc.rect(28, 28, width - 56, height - 56).lineWidth(0.5).strokeColor('#2C3E50').stroke();
};

const hLine = (doc, y, cx) => {
    doc.moveTo(cx - 120, y).lineTo(cx + 120, y).lineWidth(0.5).strokeColor('#BDC3C7').stroke();
};

/**
 * Generates a PDF certificate as a Buffer.
 *
 * @param {object} data
 * @param {'pt'|'en'|'es'} data.lang
 * @param {{ title: string, description?: string }} data.badge
 * @param {{ fullName: string }} data.consultant
 * @param {{ fullName: string }|null} data.tmReviewer
 * @param {{ fullName: string }|null} data.sllReviewer
 * @param {{ startDate: Date, conclusionDate: Date }} data.dates
 * @param {string} data.issuingEntity
 * @returns {Promise<Buffer>}
 */
const https = require('https');

const fetchImageBuffer = (url) => new Promise((resolve, reject) => {
    try {
        https.get(url, (res) => {
            const chunks = [];
            res.on('data', (c) => chunks.push(c));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        }).on('error', reject);
    } catch (err) {
        reject(err);
    }
});

/**
 * data.verificationUrl (optional) - public URL to verify the certificate/badge
 */
const generateCertificatePDF = async (data) => {
    return new Promise((resolve, reject) => {
        const lang = SUPPORTED_LANGS.includes(data.lang) ? data.lang : 'en';
        const t = i18n[lang];

        const doc = new PDFDocument({
            size: 'A4',
            layout: 'landscape',
            margins: { top: 60, bottom: 60, left: 72, right: 72 }
        });

        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const { width: W, height: H } = doc.page;
        const margin = 72;
        const contentW = W - margin * 2;
        const cx = W / 2;

        drawBorder(doc);

        let y = 62;

        // Issuing entity (top label)
        doc.fontSize(11).font('Helvetica').fillColor('#95A5A6')
            .text(data.issuingEntity.toUpperCase(), margin, y, { width: contentW, align: 'center' });
        y += 20;

        // Heading
        doc.fontSize(26).font('Helvetica-Bold').fillColor('#2C3E50')
            .text(t.heading, margin, y, { width: contentW, align: 'center' });
        y += 38;

        hLine(doc, y, cx);
        y += 22;

        // "This certifies that"
        doc.fontSize(12).font('Helvetica').fillColor('#7F8C8D')
            .text(t.certifies, margin, y, { width: contentW, align: 'center' });
        y += 20;

        // Consultant name
        doc.fontSize(24).font('Helvetica-Bold').fillColor('#1A252F')
            .text(data.consultant.fullName, margin, y, { width: contentW, align: 'center' });
        y += 34;

        // "has successfully completed the badge"
        doc.fontSize(12).font('Helvetica').fillColor('#7F8C8D')
            .text(t.completed, margin, y, { width: contentW, align: 'center' });
        y += 20;

        // Badge title
        doc.fontSize(20).font('Helvetica-Bold').fillColor('#2980B9')
            .text(data.badge.title, margin, y, { width: contentW, align: 'center' });
        y += 30;

        // Badge description (trimmed to 200 chars)
        if (data.badge.description) {
            const desc = data.badge.description.length > 200
                ? `${data.badge.description.slice(0, 197)}…`
                : data.badge.description;
            doc.fontSize(9).font('Helvetica').fillColor('#95A5A6')
                .text(desc, margin + 60, y, { width: contentW - 120, align: 'center' });
            y += doc.heightOfString(desc, { width: contentW - 120 }) + 8;
        }

        y += 6;
        hLine(doc, y, cx);
        y += 18;

        // Dates row
        const startStr = `${t.startDate}: ${formatDate(data.dates.startDate, t.locale)}`;
        const endStr = `${t.conclusionDate}: ${formatDate(data.dates.conclusionDate, t.locale)}`;
        doc.fontSize(10).font('Helvetica').fillColor('#5D6D7E');
        doc.text(startStr, margin + 30, y, { width: contentW / 2 - 30, align: 'left' });
        doc.text(endStr, cx, y, { width: contentW / 2 - 30, align: 'right' });
        y += 18;

        // Reviewers row
        const hasTM = !!data.tmReviewer;
        const hasSLL = !!data.sllReviewer;
        if (hasTM || hasSLL) {
            doc.fontSize(10).font('Helvetica').fillColor('#5D6D7E');
            if (hasTM) {
                doc.text(`${t.approvedByTM}: ${data.tmReviewer.fullName}`, margin + 30, y, {
                    width: contentW / 2 - 30, align: 'left'
                });
            }
            if (hasSLL) {
                doc.text(`${t.approvedBySLL}: ${data.sllReviewer.fullName}`, cx, y, {
                    width: contentW / 2 - 30, align: 'right'
                });
            }
        }

        // Optionally draw QR code (fetch remote PNG)
        (async () => {
            try {
                if (data.verificationUrl) {
                    const qrUrl = `https://chart.googleapis.com/chart?chs=180x180&cht=qr&chl=${encodeURIComponent(data.verificationUrl)}`;
                    try {
                        const qrBuf = await fetchImageBuffer(qrUrl);
                        const qrSize = 110;
                        const qrX = W - margin - qrSize;
                        const qrY = H - margin - qrSize - 12; // leave space for footer
                        doc.image(qrBuf, qrX, qrY, { width: qrSize, height: qrSize });
                    } catch (err) {
                        // ignore QR failures and continue
                    }
                }

                // Footer
                doc.fontSize(8).font('Helvetica').fillColor('#BDC3C7')
                    .text(`${t.issuedBy}: ${data.issuingEntity}`, margin, H - 46, {
                        width: contentW, align: 'center'
                    });

                doc.end();
            } catch (err) {
                reject(err);
            }
        })();
    });
};

module.exports = { generateCertificatePDF, SUPPORTED_LANGS };
