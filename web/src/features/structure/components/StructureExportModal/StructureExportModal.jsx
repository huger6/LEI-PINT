import { useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { downloadStructureSummary } from '../../../statistics/api/exportsApi';
import Modal from '../../../../components/Modal/Modal';
import Button from '../../../../components/Button/Button';
import DatePicker from '../../../../components/DatePicker/DatePicker';

const FORMATS = ['csv', 'xlsx', 'pdf'];

/** Modal for exporting structure entity data in CSV/XLSX/PDF format. */
export default function StructureExportModal({ structureType, identifier, title, onClose }) {
	const { t } = useTranslation();
	const [format, setFormat] = useState('csv');
	const [from, setFrom] = useState('');
	const [to, setTo] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	async function handleDownload() {
		setLoading(true);
		setError('');
		try {
			await downloadStructureSummary(structureType, identifier, {
				format,
				...(from ? { from } : {}),
				...(to ? { to } : {}),
			});
			onClose();
		} catch (err) {
			console.error(err);
			setError(t('structureExport.failed'));
		} finally {
			setLoading(false);
		}
	}

	return (
		<Modal
			title={t('structureExport.title', { name: title })}
			onClose={onClose}
			footer={
				<>
					<Button variant="outlined" onClick={onClose}>{t('shared.cancel')}</Button>
					<Button loading={loading} onClick={handleDownload}>{t('structureExport.download')}</Button>
				</>
			}
		>
			<div className="d-flex flex-column gap-3">
				<p className="text-muted small mb-0">{t('structureExport.description')}</p>

				<div>
					<label className="form-label">{t('structureExport.format')}</label>
					<div className="d-flex gap-3">
						{FORMATS.map((f) => (
							<div className="form-check" key={f}>
								<input
									className="form-check-input"
									type="radio"
									name="export-format"
									id={`fmt-${f}`}
									checked={format === f}
									onChange={() => setFormat(f)}
								/>
								<label className="form-check-label text-uppercase" htmlFor={`fmt-${f}`}>{f}</label>
							</div>
						))}
					</div>
				</div>

				<div className="row g-3">
					<div className="col-12 col-sm-6">
						<label className="form-label">{t('structureExport.from')}</label>
						<DatePicker name="from" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} ariaLabel={t('structureExport.from')} />
					</div>
					<div className="col-12 col-sm-6">
						<label className="form-label">{t('structureExport.to')}</label>
						<DatePicker name="to" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} ariaLabel={t('structureExport.to')} />
					</div>
				</div>

				{error && <p className="small text-danger mb-0">{error}</p>}
			</div>
		</Modal>
	);
}

StructureExportModal.propTypes = {
	structureType: PropTypes.oneOf(['learning-path', 'service-line', 'area']).isRequired,
	identifier: PropTypes.string.isRequired,
	title: PropTypes.string,
	onClose: PropTypes.func.isRequired,
};
