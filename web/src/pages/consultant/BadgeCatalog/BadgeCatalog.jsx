import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getBadges } from '../../../services/badgeService';
import { getAreas } from '../../../services/hierarchyService';
import LoadingScreen from '../../../components/LoadingScreen/LoadingScreen';
import Icon from '../../../components/Icons/Icons';
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

	function removeAreaFilter(areaId) {
		setSelectedAreas((prev) => prev.filter((id) => id !== areaId));
	}

	function clearFilters() {
		setSelectedAreas([]);
		setSearch('');
	}

	// Count badges per area for filter sidebar
	const badgeCountByArea = useMemo(() => {
		const counts = {};
		badges.forEach((b) => {
			const aId = b.area_id || b.areaId;
			if (aId) counts[aId] = (counts[aId] || 0) + 1;
		});
		return counts;
	}, [badges]);

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
		} else if (sortBy === 'points-desc') {
			result.sort((a, b) => (b.badge_points || b.badgePoints || 0) - (a.badge_points || a.badgePoints || 0));
		} else if (sortBy === 'points-asc') {
			result.sort((a, b) => (a.badge_points || a.badgePoints || 0) - (b.badge_points || b.badgePoints || 0));
		} else {
			result.sort((a, b) => (b.badge_id || b.badgeId || 0) - (a.badge_id || a.badgeId || 0));
		}

		return result;
	}, [badges, search, selectedAreas, sortBy]);

	// Get area name by id for active filter chips
	function getAreaName(areaId) {
		const area = areas.find((a) => (a.area_id || a.areaId) === areaId);
		return area ? (area.area_name || area.areaName) : areaId;
	}

	if (loading) return <LoadingScreen />;

	if (error) {
		return (
			<div className="alert alert-danger m-4" role="alert">
				{t('badgeCatalog.errorLoading', { error })}
			</div>
		);
	}

	const hasActiveFilters = selectedAreas.length > 0 || search.trim();

	return (
		<>
			<div className="d-flex align-items-center justify-content-between mb-4">
				<h1 className="h3 mb-0">{t('badgeCatalog.title')}</h1>
			</div>

			{/* Search Bar */}
			<div className={styles.searchWrapper}>
				<Icon name="search" size={16} className={styles.searchIcon} aria-hidden="true" />
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
								const areaName = area.area_name || area.areaName;
								const count = badgeCountByArea[areaId] || 0;
								return (
									<label className={styles.filterItem} key={areaId}>
										<input
											className={styles.filterCheckbox}
											type="checkbox"
											checked={selectedAreas.includes(areaId)}
											onChange={() => toggleArea(areaId)}
										/>
										<span className={styles.filterLabel}>{areaName}</span>
										<span className={styles.filterCount}>{count}</span>
									</label>
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

				{filtered.length === 0 ? (
					<div className="text-center py-5">
						<h5 className="text-muted">{t('badgeCatalog.noBadges')}</h5>
						<p className="text-muted small">{t('badgeCatalog.noBadgesDesc')}</p>
					</div>
				) : (
					<div className={styles.badgeGrid}>
						{filtered.map((badge, index) => {
							const title = badge.badge_title || badge.badgeTitle;
							const description = badge.badge_description || badge.badgeDescription || 'Sem descrição';
							const imgUrl = badge.badge_img_url || badge.badgeImgUrl;
							const points = badge.badge_points || badge.badgePoints;
							const areaName = badge.area?.area_name || badge.area?.areaName;
							const slug = badge.badge_slug || badge.badgeSlug;

							return (
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
													<Icon name="badge" size={48} className="text-muted" aria-hidden="true" />
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
												{points != null && (
													<span className={styles.tagPoints}>
														<Icon name="star" size={14} aria-hidden="true" />
														{points} pts
													</span>
												)}
											</div>
										</div>
									</div>
								</Link>
							);
						})}
					</div>
				)}
			</div>
		</>
	);
}
