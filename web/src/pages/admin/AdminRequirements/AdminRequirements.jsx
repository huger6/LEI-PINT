import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getBadges } from '../../../features/badges/api/badgesApi';
import { getRequirements, deleteRequirement } from '../../../features/badges/api/requirementsApi';
import Button from '../../../components/Button/Button';
import Icon from '../../../components/Icons/Icons';
import Tooltip from '../../../components/Tooltip/Tooltip';
import CustomSelect from '../../../components/CustomSelect/CustomSelect';
import TableSkeleton from '../../../components/Skeleton/TableSkeleton';
import CreateRequirementModal from '../../../components/CreateRequirementModal/CreateRequirementModal';
import styles from './AdminRequirements.module.css';

export default function AdminRequirements() {
	const { t } = useTranslation();
	const [badges, setBadges] = useState([]);
	const [selectedBadge, setSelectedBadge] = useState('');
	const [requirements, setRequirements] = useState([]);
	const [loadingBadges, setLoadingBadges] = useState(true);
	const [loadingReqs, setLoadingReqs] = useState(false);
	const [modalOpen, setModalOpen] = useState(false);
	const [editItem, setEditItem] = useState(null);

	useEffect(() => {
		(async () => {
			try {
				const data = await getBadges();
				setBadges(data || []);
			} catch (err) {
				console.error(err);
			} finally {
				setLoadingBadges(false);
			}
		})();
	}, []);

	const loadRequirements = useCallback(async (slug) => {
		if (!slug) {
			setRequirements([]);
			return;
		}
		setLoadingReqs(true);
		try {
			const data = await getRequirements(slug);
			setRequirements(data || []);
		} catch (err) {
			console.error(err);
			setRequirements([]);
		} finally {
			setLoadingReqs(false);
		}
	}, []);

	useEffect(() => {
		loadRequirements(selectedBadge);
	}, [selectedBadge, loadRequirements]);

	const activeBadge = badges.find((b) => (b.badge_slug || b.badgeSlug) === selectedBadge);

	function openCreate() {
		setEditItem(null);
		setModalOpen(true);
	}

	function openEdit(req) {
		setEditItem(req);
		setModalOpen(true);
	}

	async function handleDelete(req) {
		const title = req.requirement_title || req.requirementTitle;
		if (!window.confirm(t('shared.confirmDelete', { name: title }))) return;
		try {
			await deleteRequirement(selectedBadge, req.requirement_id || req.requirementId);
			loadRequirements(selectedBadge);
		} catch (err) {
			console.error(err);
		}
	}

	return (
		<div>
			<div className={styles.header}>
				<div className={styles.headerIcon}><Icon name="check_circle" size={24} aria-hidden="true" /></div>
				<div className={styles.headerText}>
					<h1 className={styles.title}>{t('adminRequirements.title')}</h1>
					<p className={styles.subtitle}>{t('adminRequirements.subtitle')}</p>
				</div>
			</div>

			<div className={styles.card}>
				<label htmlFor="badge_select" className={styles.selectLabel}>{t('adminRequirements.selectBadge')}</label>
				{loadingBadges ? (
					<div className="placeholder-glow"><span className="placeholder col-6" /></div>
				) : (
					<div className={styles.selectWrap}>
						<CustomSelect
							name="badge_select"
							value={selectedBadge}
							onChange={(e) => setSelectedBadge(e.target.value)}
							ariaLabel={t('adminRequirements.selectBadge')}
							options={[
								{ value: '', label: t('adminRequirements.chooseBadge') },
								...badges.map((b) => ({ value: b.badge_slug || b.badgeSlug, label: b.badge_title || b.badgeTitle })),
							]}
						/>
					</div>
				)}
			</div>

			{selectedBadge && (
				<div className={styles.card}>
					<div className={styles.reqHeaderRow}>
						<h2 className={styles.reqTitle}>
							{t('adminRequirements.requirements', { name: activeBadge?.badge_title || activeBadge?.badgeTitle })}
						</h2>
						<Button size="sm" onClick={openCreate}>
							<Icon name="add" size={14} aria-hidden="true" className="me-1" />
							{t('adminRequirements.newRequirement')}
						</Button>
					</div>

					{loadingReqs ? (
						<TableSkeleton rows={4} columns={5} />
					) : requirements.length === 0 ? (
						<div className={styles.empty}>
							<Icon name="check_circle" size={36} aria-hidden="true" className={styles.emptyIcon} />
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
											<td>{req.requirement_title || req.requirementTitle || '—'}</td>
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
				</div>
			)}

			{modalOpen && (
				<CreateRequirementModal
					badgeSlug={selectedBadge}
					initialData={editItem}
					onClose={() => setModalOpen(false)}
					onSuccess={() => loadRequirements(selectedBadge)}
				/>
			)}
		</div>
	);
}
