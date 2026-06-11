import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { downloadExport } from '../../features/statistics/api/exportsApi';
import { resolveErrorMessage } from '../../validations/apiErrors';
import ContentCard, { CardHeader } from '../ContentCard/ContentCard';
import Button from '../Button/Button';
import FormAlert from '../FormAlert/FormAlert';
import Icon from '../Icons/Icons';
import styles from './ExportsPanel.module.css';

const EXPORT_FORMATS = ['csv', 'xlsx', 'pdf'];

const EXPORT_BUTTONS = [
	{ key: 'consultants', type: 'consultants', labelKey: 'tmStats.exports.consultants' },
	{ key: 'applications', type: 'applications', labelKey: 'tmStats.exports.applications' },
	{ key: 'accepted', type: 'applications', params: { state: 'Accepted' }, labelKey: 'tmStats.exports.accepted' },
	{ key: 'rejected', type: 'applications', params: { state: 'Rejected' }, labelKey: 'tmStats.exports.rejected' },
	{ key: 'badges', type: 'badges', labelKey: 'tmStats.exports.badges' },
	{ key: 'pointsHistory', type: 'pointsHistory', labelKey: 'tmStats.exports.pointsHistory' },
	{ key: 'applicationLogs', type: 'applicationLogs', labelKey: 'tmStats.exports.applicationLogs' },
];

/**
 * Export panel for management roles. The backend scopes the data by role
 * (Talent Manager / Administrator: global; Service Line Leader: own Service Line),
 * so this component is role-agnostic.
 */
export default function ExportsPanel() {
	const { t } = useTranslation();
	const [format, setFormat] = useState('xlsx');
	const [busy, setBusy] = useState(null);
	const [error, setError] = useState(null);

	async function handleExport(btn) {
		setError(null);
		setBusy(btn.key);
		try {
			await downloadExport(btn.type, { format, ...(btn.params || {}) });
		} catch (err) {
			setError(resolveErrorMessage(err));
		} finally {
			setBusy(null);
		}
	}

	return (
		<ContentCard className={styles.card}>
			<div className={styles.headerRow}>
				<CardHeader icon="download" iconBg="var(--color-blue-soft)" iconColor="var(--color-blue-on-soft)" title={t('tmStats.exports.title')} />
				<label className={styles.inlineSelect}>
					<span className={styles.inlineSelectLabel}>{t('tmStats.exports.format')}</span>
					<select
						className="form-select form-select-sm"
						value={format}
						onChange={(e) => setFormat(e.target.value)}
						aria-label={t('tmStats.exports.format')}
					>
						{EXPORT_FORMATS.map((f) => (
							<option key={f} value={f}>{f.toUpperCase()}</option>
						))}
					</select>
				</label>
			</div>

			<div className={styles.buttons}>
				{EXPORT_BUTTONS.map((btn) => (
					<Button
						key={btn.key}
						variant="outlined"
						color="primary"
						size="sm"
						loading={busy === btn.key}
						disabled={Boolean(busy)}
						onClick={() => handleExport(btn)}
					>
						<Icon name="download" size={14} /> {t(btn.labelKey)}
					</Button>
				))}
			</div>

			<FormAlert message={error} variant="danger" className="mt-2" />
		</ContentCard>
	);
}
