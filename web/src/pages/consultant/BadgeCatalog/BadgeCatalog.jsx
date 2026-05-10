import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getBadges } from '../../../services/badgeService';
import { getAreas } from '../../../services/hierarchyService';
import LoadingScreen from '../../../components/LoadingScreen/LoadingScreen';
import styles from './BadgeCatalog.module.css';

export default function BadgeCatalog() {
	const { t } = useTranslation();
	const [badges, setBadges] = useState([]);
	const [areas, setAreas] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [search, setSearch] = useState('');
	const [selectedAreas, setSelectedAreas] = useState([]);
	const [sortBy, setSortBy] = useState('recent');

	const SORT_OPTIONS = [
		{ value: 'recent', label: t('badgeCatalog.sortRecent') },
		{ value: 'az', label: t('badgeCatalog.sortAZ') },
		{ value: 'za', label: t('badgeCatalog.sortZA') },
	];

	useEffect(() => {
		loadData();
	}, []);

	async function loadData() {
		try {
			const [badgesData, areasData] = await Promise.all([getBadges(), getAreas()]);
			setBadges(badgesData.data || badgesData || []);
			setAreas(areasData.data || areasData || []);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}

	function toggleArea(areaId) {
		setSelectedAreas((prev) =>
			prev.includes(areaId) ? prev.filter((id) => id !== areaId) : [...prev, areaId]
		);
	}

	const filtered = useMemo(() => {
		let result = [...badges];

		if (search.trim()) {
			const q = search.toLowerCase();
			result = result.filter(
				(b) =>
					(b.badge_title || b.badgeTitle || '').toLowerCase().includes(q) ||
					(b.badge_description || b.badgeDescription || '').toLowerCase().includes(q)
			);
		}

		if (selectedAreas.length > 0) {
			result = result.filter((b) => selectedAreas.includes(b.area_id || b.areaId));
		}

		if (sortBy === 'az') {
			result.sort((a, b) => (a.badge_title || a.badgeTitle || '').localeCompare(b.badge_title || b.badgeTitle || ''));
		} else if (sortBy === 'za') {
			result.sort((a, b) => (b.badge_title || b.badgeTitle || '').localeCompare(a.badge_title || a.badgeTitle || ''));
		} else {
			result.sort((a, b) => (b.badge_id || b.badgeId || 0) - (a.badge_id || a.badgeId || 0));
		}

		return result;
	}, [badges, search, selectedAreas, sortBy]);

	if (loading) return <LoadingScreen />;

	if (error) {
		return (
			<div className="alert alert-danger m-4" role="alert">
				{t('badgeCatalog.errorLoading', { error })}
			</div>
		);
	}

	return (
		<>
			<div className="d-flex align-items-center justify-content-between mb-4">
				<h1 className="h3 mb-0">{t('badgeCatalog.title')}</h1>
			</div>

			<div className="mb-4">
				<input
					type="text"
					className="form-control"
					placeholder={t('badgeCatalog.searchPlaceholder')}
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
			</div>

			<div className="row">
				<div className="col-md-3">
					<div className="card border-0 shadow-sm mb-3">
						<div className="card-body">
							<h6 className="fw-semibold mb-3">{t('shared.area')}</h6>
							{areas.map((area) => {
								const areaId = area.area_id || area.areaId;
								return (
									<div className="form-check mb-2" key={areaId}>
										<input
											className="form-check-input"
											type="checkbox"
											id={`area-${areaId}`}
											checked={selectedAreas.includes(areaId)}
											onChange={() => toggleArea(areaId)}
										/>
										<label className="form-check-label small" htmlFor={`area-${areaId}`}>
											{area.area_name || area.areaName}
										</label>
									</div>
								);
							})}
						</div>
					</div>

					<div className="card border-0 shadow-sm">
						<div className="card-body">
							<h6 className="fw-semibold mb-3">{t('shared.sort')}</h6>
							<select
								className="form-select"
								value={sortBy}
								onChange={(e) => setSortBy(e.target.value)}
							>
								{SORT_OPTIONS.map((opt) => (
									<option key={opt.value} value={opt.value}>{opt.label}</option>
								))}
							</select>
						</div>
					</div>
				</div>

				<div className="col-md-9">
					{filtered.length === 0 ? (
						<div className="text-center py-5">
							<h5 className="text-muted">{t('badgeCatalog.noBadges')}</h5>
							<p className="text-muted small">{t('badgeCatalog.noBadgesDesc')}</p>
						</div>
					) : (
						<div className="row g-3">
							{filtered.map((badge) => (
								<div className="col-md-6 col-lg-4" key={badge.badge_slug || badge.badgeSlug}>
									<Link
										to={`/badges/${badge.badge_slug || badge.badgeSlug}`}
										className={`text-decoration-none ${styles.badgeLink}`}
									>
										<div className={`card h-100 border-0 shadow-sm ${styles.badgeCard}`}>
											<div className="card-body">
												<div
													className={`d-flex align-items-center justify-content-center rounded mb-3 ${styles.badgeImageContainer}`}
												>
													{badge.badge_img_url || badge.badgeImgUrl ? (
														<img
															src={badge.badge_img_url || badge.badgeImgUrl}
															alt={badge.badge_title || badge.badgeTitle}
															className={styles.badgeImage}
														/>
													) : (
														<i className="bi bi-award fs-1 text-muted" />
													)}
												</div>
												<h6 className="fw-semibold mb-2">{badge.badge_title || badge.badgeTitle}</h6>
												<p className={`text-muted small mb-3 ${styles.badgeDescription}`}>
													{badge.badge_description || badge.badgeDescription || t('badgeCatalog.noDescription')}
												</p>
												<div className="d-flex flex-wrap gap-1">
													{badge.area?.area_name && (
														<span className="badge bg-info">{badge.area.area_name}</span>
													)}
													{(badge.badge_points || badge.badgePoints) != null && (
														<span className="badge bg-warning text-dark">{badge.badge_points || badge.badgePoints} pts</span>
													)}
												</div>
											</div>
										</div>
									</Link>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</>
	);
}
