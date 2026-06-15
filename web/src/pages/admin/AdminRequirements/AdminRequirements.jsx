import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getBadges } from '../../../features/badges/api/badgesApi';
import { getRequirements, deleteRequirement } from '../../../features/badges/api/requirementsApi';
import Button from '../../../components/Button/Button';
import Icon from '../../../components/Icons/Icons';
import Tooltip from '../../../components/Tooltip/Tooltip';
import TableSkeleton from '../../../components/Skeleton/TableSkeleton';
import CreateRequirementModal from '../../../components/CreateRequirementModal/CreateRequirementModal';

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
			<h1 className="h3 mb-4">{t('adminRequirements.title')}</h1>

			<div className="card border-0 shadow-sm mb-4">
				<div className="card-body">
					<label htmlFor="badge_select" className="form-label">{t('adminRequirements.selectBadge')}</label>
					{loadingBadges ? (
						<div className="placeholder-glow"><span className="placeholder col-6" /></div>
					) : (
						<select
							id="badge_select"
							className="form-select"
							value={selectedBadge}
							onChange={(e) => setSelectedBadge(e.target.value)}
						>
							<option value="">{t('adminRequirements.chooseBadge')}</option>
							{badges.map((b) => (
								<option key={b.badge_slug || b.badgeSlug} value={b.badge_slug || b.badgeSlug}>
									{b.badge_title || b.badgeTitle}
								</option>
							))}
						</select>
					)}
				</div>
			</div>

			{selectedBadge && (
				<div className="card border-0 shadow-sm">
					<div className="card-body">
						<div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
							<h5 className="fw-semibold mb-0">
								{t('adminRequirements.requirements', { name: activeBadge?.badge_title || activeBadge?.badgeTitle })}
							</h5>
							<Button size="sm" onClick={openCreate}>
								<Icon name="add" size={14} aria-hidden="true" className="me-1" />
								{t('adminRequirements.newRequirement')}
							</Button>
						</div>

						{loadingReqs ? (
							<TableSkeleton rows={4} columns={5} />
						) : requirements.length === 0 ? (
							<p className="text-muted small mb-0">{t('adminRequirements.noRequirements')}</p>
						) : (
							<div className="table-responsive">
								<table className="table table-hover align-middle mb-0">
									<thead className="table-light">
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
												<td>{req.requirement_sequence ?? req.requirementSequence ?? idx + 1}</td>
												<td>{req.requirement_title || req.requirementTitle || '—'}</td>
												<td>
													<span className="badge bg-warning text-dark">
														{req.badge_points ?? req.badgePoints ?? 0} pts
													</span>
												</td>
												<td>
													<span className={`badge ${req.is_active ? 'bg-success' : 'bg-secondary'}`}>
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
