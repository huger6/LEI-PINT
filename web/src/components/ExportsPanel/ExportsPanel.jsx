import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { downloadExport } from '../../features/statistics/api/exportsApi';
import { resolveErrorMessage } from '../../validations/apiErrors';
import ContentCard, { CardHeader } from '../ContentCard/ContentCard';
import CustomSelect from '../CustomSelect/CustomSelect';
import DatePicker from '../DatePicker/DatePicker';
import FormAlert from '../FormAlert/FormAlert';
import Icon from '../Icons/Icons';
import styles from './ExportsPanel.module.css';

const FORMAT_OPTIONS = [
	{ value: 'csv', label: 'CSV' },
	{ value: 'xlsx', label: 'XLSX' },
	{ value: 'pdf', label: 'PDF' },
];

const EXPORT_BUTTONS = [
	{ key: 'consultants', type: 'consultants', icon: 'tabler_users', labelKey: 'tmStats.exports.consultants' },
	{ key: 'applications', type: 'applications', icon: 'paper', labelKey: 'tmStats.exports.applications' },
	{ key: 'accepted', type: 'applications', params: { state: 'Accepted' }, icon: 'check_circle', labelKey: 'tmStats.exports.accepted' },
	{ key: 'rejected', type: 'applications', params: { state: 'Rejected' }, icon: 'close_circle', labelKey: 'tmStats.exports.rejected' },
	{ key: 'badges', type: 'badges', icon: 'badge', labelKey: 'tmStats.exports.badges' },
	{ key: 'pointsHistory', type: 'pointsHistory', icon: 'star-points', labelKey: 'tmStats.exports.pointsHistory' },
	{ key: 'applicationLogs', type: 'applicationLogs', icon: 'time', labelKey: 'tmStats.exports.applicationLogs' },
];

/**
 * Export panel for management roles. The backend scopes the data by role
 * (Talent Manager / Administrator: global; Service Line Leader: own Service Line),
 * so this component is role-agnostic.
 */
export default function ExportsPanel() {
	const { t } = useTranslation();
	const [format, setFormat] = useState('xlsx');
	const [from, setFrom] = useState('');
	const [to, setTo] = useState('');
	const [busy, setBusy] = useState(null);
	const [error, setError] = useState(null);

	async function handleExport(btn) {
		setError(null);
		setBusy(btn.key);
		try {
			await downloadExport(btn.type, {
				format,
				...(from ? { from } : {}),
				...(to ? { to } : {}),
				...(btn.params || {}),
			});
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
				<div className={styles.controls}>
					<label className={styles.inlineSelect}>
						<span className={styles.inlineSelectLabel}>{t('tmStats.exports.from')}</span>
						<DatePicker name="exportFrom" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} ariaLabel={t('tmStats.exports.from')} />
					</label>
					<label className={styles.inlineSelect}>
						<span className={styles.inlineSelectLabel}>{t('tmStats.exports.to')}</span>
						<DatePicker name="exportTo" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} ariaLabel={t('tmStats.exports.to')} />
					</label>
					<label className={styles.inlineSelect}>
						<span className={styles.inlineSelectLabel}>{t('tmStats.exports.format')}</span>
						<CustomSelect
							name="exportFormat"
							value={format}
							onChange={(e) => setFormat(e.target.value)}
							options={FORMAT_OPTIONS}
							ariaLabel={t('tmStats.exports.format')}
							compact
						/>
					</label>
					{(from || to) && (
						<button
							type="button"
							className={styles.clearDatesBtn}
							onClick={() => { setFrom(''); setTo(''); }}
						>
							<Icon name="close" size={14} aria-hidden="true" /> {t('tmStats.exports.clearDates', { defaultValue: 'Limpar datas' })}
						</button>
					)}
				</div>
			</div>

			<div className={styles.buttons}>
				{EXPORT_BUTTONS.map((btn) => (
					<button
						key={btn.key}
						type="button"
						className={styles.exportBtn}
						disabled={Boolean(busy)}
						onClick={() => handleExport(btn)}
					>
						<span className={styles.exportIcon}><Icon name={btn.icon} size={16} color="var(--color-secondary)" /></span>
						<span className={styles.exportLabel}>{t(btn.labelKey)}</span>
						{busy === btn.key && <span className={styles.exportSpinner} aria-hidden="true" />}
					</button>
				))}
			</div>

			<FormAlert message={error} variant="danger" className="mt-2" />
		</ContentCard>
	);
}
