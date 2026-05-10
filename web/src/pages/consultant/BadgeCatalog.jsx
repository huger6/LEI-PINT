import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getBadges } from '../../services/badgeService';
import { getAreas } from '../../services/hierarchyService';
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen';
import styles from './BadgeCatalog.module.css';

const SORT_OPTIONS = [
	{ value: 'recent', label: 'Mais recente' },
	{ value: 'az', label: 'A-Z' },
	{ value: 'za', label: 'Z-A' },
	{ value: 'points-desc', label: 'Mais pontos' },
	{ value: 'points-asc', label: 'Menos pontos' },
];

export default function BadgeCatalog() {
	const [badges, setBadges] = useState([]);
	const [areas, setAreas] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [search, setSearch] = useState('');
	const [selectedAreas, setSelectedAreas] = useState([]);
	const [sortBy, setSortBy] = useState('recent');

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
				Erro ao carregar badges: {error}
			</div>
		);
	}

	const hasActiveFilters = selectedAreas.length > 0 || search.trim();

	return (
		<>
			{/* Page Header */}
			<div className={styles.pageHeader}>
				<h1 className={styles.pageTitle}>Catálogo de Badges</h1>
				<span className={styles.badgeCount}>
					<i className="bi bi-award" />
					{badges.length} badges
				</span>
			</div>

			{/* Search Bar */}
			<div className={styles.searchWrapper}>
				<i className={`bi bi-search ${styles.searchIcon}`} />
				<input
					type="text"
					className={styles.searchInput}
					placeholder="Pesquisar por nome, descrição ou competência..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
			</div>

			{/* Active Filter Chips */}
			{hasActiveFilters && (
				<div className={styles.activeFilters}>
					{selectedAreas.map((areaId) => (
						<button
							key={areaId}
							className={styles.filterChip}
							onClick={() => removeAreaFilter(areaId)}
						>
							{getAreaName(areaId)}
							<span className={styles.filterChipClose}>×</span>
						</button>
					))}
					{(selectedAreas.length > 1 || (selectedAreas.length >= 1 && search.trim())) && (
						<button className={styles.clearAll} onClick={clearFilters}>
							<i className="bi bi-x-circle me-1" style={{ fontSize: '0.7rem' }} />
							Limpar tudo
						</button>
					)}
				</div>
			)}

			{/* Main Layout */}
			<div className={styles.catalogLayout}>
				{/* Filter Sidebar */}
				<div className={styles.filterPanel}>
					{/* Area Filters */}
					<div className={styles.filterCard}>
						<div className={styles.filterTitle}>
							<i className="bi bi-funnel me-1" />
							Área
						</div>
						<div className={styles.filterList}>
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

					{/* Sort */}
					<div className={styles.filterCard}>
						<div className={styles.filterTitle}>
							<i className="bi bi-sort-down me-1" />
							Ordenar
						</div>
						<select
							className={styles.filterSelect}
							value={sortBy}
							onChange={(e) => setSortBy(e.target.value)}
						>
							{SORT_OPTIONS.map((opt) => (
								<option key={opt.value} value={opt.value}>{opt.label}</option>
							))}
						</select>
					</div>
				</div>

				{/* Badge Grid */}
				<div>
					{/* Results bar */}
					<div className={styles.resultsBar}>
						<span className={styles.resultsCount}>
							{filtered.length === badges.length ? (
								<>A mostrar <strong>todos os {badges.length}</strong> badges</>
							) : (
								<><strong>{filtered.length}</strong> de {badges.length} badges</>
							)}
						</span>
					</div>

					{filtered.length === 0 ? (
						<div className={styles.emptyState}>
							<div className={styles.emptyIcon}>
								<i className="bi bi-search" />
							</div>
							<h5 className={styles.emptyTitle}>Nenhum badge encontrado</h5>
							<p className={styles.emptySubtitle}>
								Tente ajustar os filtros ou a pesquisa.
							</p>
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
										to={`/badges/${slug}`}
										key={slug}
										className="text-decoration-none"
										style={{ color: 'inherit' }}
									>
										<div
											className={styles.badgeCard}
											style={{ animationDelay: `${Math.min(index * 50, 450)}ms` }}
										>
											{/* Image / Icon Area */}
											<div className={styles.cardImageArea}>
												{imgUrl ? (
													<img
														src={imgUrl}
														alt={title}
														className={styles.badgeImage}
													/>
												) : (
													<i className={`bi bi-award ${styles.badgePlaceholderIcon}`} />
												)}
											</div>

											{/* Card Body */}
											<div className={styles.cardBody}>
												<h6 className={styles.cardTitle}>{title}</h6>
												<p className={styles.cardDescription}>{description}</p>

												{/* Tags */}
												<div className={styles.cardTags}>
													{areaName && (
														<span className={styles.tagArea}>
															{areaName}
														</span>
													)}
													{points != null && (
														<span className={styles.tagPoints}>
															<i className="bi bi-star-fill" />
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
			</div>
		</>
	);
}
