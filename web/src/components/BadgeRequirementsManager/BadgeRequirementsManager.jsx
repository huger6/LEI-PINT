import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { getRequirements, deleteRequirement } from '../../features/badges/api/requirementsApi';
import Button from '../Button/Button';
import Icon from '../Icons/Icons';
import Tooltip from '../Tooltip/Tooltip';
import TableSkeleton from '../Skeleton/TableSkeleton';
import CreateRequirementModal from '../CreateRequirementModal/CreateRequirementModal';
import TranslatedText from '../TranslatedText/TranslatedText';
import styles from './BadgeRequirementsManager.module.css';

/**
 * Manages the list of requirements for a badge (add, edit, reorder, delete).
 * @param {Array} requirements - Current requirement list.
 * @param {Function} onChange - Called with the updated requirements array.
 */
export default function BadgeRequirementsManager({ badgeSlug }) {
	const { t } = useTranslation();
	const [requirements, setRequirements] = useState([]);
	const [loading, setLoading] = useState(true);
	const [modalOpen, setModalOpen] = useState(false);
	const [editItem, setEditItem] = useState(null);

	const load = useCallback(async () => {
		if (!badgeSlug) { setRequirements([]); setLoading(false); return; }
		setLoading(true);
		try {
			setRequirements(await getRequirements(badgeSlug) || []);
		} catch {
			setRequirements([]);
		} finally {
			setLoading(false);
		}
	}, [badgeSlug]);

	useEffect(() => { load(); }, [load]);

	function openCreate() { setEditItem(null); setModalOpen(true); }
	function openEdit(req) { setEditItem(req); setModalOpen(true); }

	async function handleDelete(req) {
		const title = req.requirement_title || req.requirementTitle;
		if (!window.confirm(t('shared.confirmDelete', { name: title }))) return;
		try {
			await deleteRequirement(badgeSlug, req.requirement_id || req.requirementId);
			load();
		} catch (err) {
			console.error(err);
		}
	}

	return (
		<div className={styles.wrap}>
			<div className={styles.headerRow}>
				<h2 className={styles.title}>{t('adminRequirements.title')}</h2>
				<Button size="sm" onClick={openCreate}>
					<Icon name="add" size={14} aria-hidden="true" className="me-1" />
					{t('adminRequirements.newRequirement')}
				</Button>
			</div>

			{loading ? (
				<TableSkeleton rows={3} columns={5} />
			) : requirements.length === 0 ? (
				<div className={styles.empty}>
					<Icon name="check_circle" size={32} aria-hidden="true" className={styles.emptyIcon} />
					<p className="mb-0">{t('adminRequirements.noRequirements')}</p>
				</div>
			) : (
				<div className="table-responsive">
					<table className={`table align-middle ${styles.table}`}>
						<thead>
							<tr>
								<th>{t('adminRequirements.sequence')}</th>
								<th>{t('shared.title')}</th>
								<th>{t('shared.points')}</th>
								<th>{t('shared.active')}</th>
								<th className="text-end">{t('shared.actions')}</th>
							</tr>
						</thead>
						<tbody>
							{requirements.map((req, idx) => (
								<tr key={req.requirement_id || req.requirementId || idx}>
									<td><span className={styles.seqBadge}>{req.requirement_sequence ?? req.requirementSequence ?? idx + 1}</span></td>
									<td><TranslatedText text={req.requirement_title || req.requirementTitle || '—'} /></td>
									<td><span className={styles.pointsChip}>{req.badge_points ?? req.badgePoints ?? 0} pts</span></td>
									<td>
										<span className={`${styles.statusChip} ${req.is_active ? styles.statusOn : styles.statusOff}`}>
											{req.is_active ? t('shared.yes') : t('shared.no')}
										</span>
									</td>
									<td className="text-end">
										<Tooltip text={t('shared.edit')}>
											<Button size="sm" variant="outlined" className="me-2" aria-label={t('shared.edit')} onClick={() => openEdit(req)}>
												<Icon name="pencil" size={14} aria-hidden="true" />
											</Button>
										</Tooltip>
										{req.is_active && (
											<Tooltip text={t('shared.delete')}>
												<Button size="sm" variant="outlined" color="danger" aria-label={t('shared.delete')} onClick={() => handleDelete(req)}>
													<Icon name="trash" size={14} aria-hidden="true" />
												</Button>
											</Tooltip>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{modalOpen && (
				<CreateRequirementModal
					badgeSlug={badgeSlug}
					initialData={editItem}
					onClose={() => setModalOpen(false)}
					onSuccess={load}
				/>
			)}
		</div>
	);
}

BadgeRequirementsManager.propTypes = {
	badgeSlug: PropTypes.string.isRequired,
};
