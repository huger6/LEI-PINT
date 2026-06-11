import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getApplicationsPaged } from '../../../features/applications/api/applicationsApi';
import { useUser } from '../../../hooks/userContext';
import { resolveErrorMessage } from '../../../validations/apiErrors';
import Tabs from '../../../components/Tabs/Tabs';
import Button from '../../../components/Button/Button';
import CustomSelect from '../../../components/CustomSelect/CustomSelect';
import FilterSearchInput from '../../../components/FilterSearchInput/FilterSearchInput';
import Pagination from '../../../components/Pagination/Pagination';
import Avatar from '../../../components/Avatar/Avatar';
import Icon from '../../../components/Icons/Icons';
import CardGridSkeleton from '../../../components/Skeleton/CardGridSkeleton';
import styles from './ValidationsBoard.module.css';

const PAGE_SIZE = 12;

const STATE_COLOR_MAP = {
	Submitted: 'var(--color-purple-on-soft, #6b21a8)',
	'In validation': 'var(--color-orange-on-soft, #f39c12)',
	Accepted: 'var(--color-green-on-soft, #007a55)',
	Rejected: 'var(--color-red-on-soft, #dc2626)',
};

// Talent Manager acts on Submitted; Service Line Leader acts on In validation.
const TM_TABS = ['Submitted', 'In validation', 'Accepted', 'Rejected'];
const SLL_TABS = ['In validation', 'Accepted', 'Rejected'];

export default function ValidationsBoard() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { user } = useUser();

	const isSll = user?.role === 'Service Line Leader';
	const tabStates = isSll ? SLL_TABS : TM_TABS;

	const [activeTab, setActiveTab] = useState(tabStates[0]);
	const [page, setPage] = useState(1);
	const [items, setItems] = useState([]);
	const [pagination, setPagination] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [search, setSearch] = useState('');
	const [sortDir, setSortDir] = useState('desc'); // 'desc' = newest first

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const { data, pagination: pag } = await getApplicationsPaged({
				state: activeTab,
				page,
				limit: PAGE_SIZE,
			});
			setItems(data);
			setPagination(pag);
		} catch (err) {
			setError(resolveErrorMessage(err));
		} finally {
			setLoading(false);
		}
	}, [activeTab, page]);

	useEffect(() => {
		load();
	}, [load]);

	// Near real-time: refresh when the tab regains focus.
	useEffect(() => {
		function onVisible() {
			if (document.visibilityState === 'visible') load();
		}
		document.addEventListener('visibilitychange', onVisible);
		window.addEventListener('focus', onVisible);
		return () => {
			document.removeEventListener('visibilitychange', onVisible);
			window.removeEventListener('focus', onVisible);
		};
	}, [load]);

	const tabs = useMemo(
		() => tabStates.map((s) => ({
			key: s,
			label: t(`tmValidations.tabs.${s === 'In validation' ? 'inValidation' : s.toLowerCase()}`),
		})),
		[t, tabStates]
	);

	function handleTabChange(key) {
		if (key === activeTab) return;
		setActiveTab(key);
		setPage(1);
		setSearch('');
	}

	const filtered = useMemo(() => {
		const term = search.trim().toLowerCase();
		const base = !term ? items : items.filter((app) => {
			const badgeName = (app.badge?.badge_title || '').toLowerCase();
			const consultant = (app.user?.user?.full_name || '').toLowerCase();
			return badgeName.includes(term) || consultant.includes(term);
		});
		const dateOf = (app) => new Date(app.submitted_at || app.opened_at || 0).getTime();
		return [...base].sort((a, b) => (sortDir === 'asc' ? dateOf(a) - dateOf(b) : dateOf(b) - dateOf(a)));
	}, [items, search, sortDir]);

	const sortOptions = useMemo(() => [
		{ value: 'desc', label: t('tmValidations.sortNewest') },
		{ value: 'asc', label: t('tmValidations.sortOldest') },
	], [t]);

	function formatDate(app) {
		const dateStr = app.submitted_at || app.opened_at;
		if (!dateStr) return '—';
		return new Date(dateStr).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' });
	}

	function getStateLabel(state) {
		const key = state === 'In validation' ? 'inValidation' : state.toLowerCase();
		return t(`tmValidations.tabs.${key}`, { defaultValue: state });
	}

	return (
		<div className={styles.page}>
			<div className={styles.headerRow}>
				<h1 className={styles.pageTitle}>{t('tmValidations.title')}</h1>
				<p className={styles.subtitle}>{t(isSll ? 'tmValidations.subtitleSll' : 'tmValidations.subtitle')}</p>
			</div>

			<Tabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />

			<div className={styles.toolbar}>
				<div className={styles.searchWrap}>
					<FilterSearchInput
						name="search"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder={t('tmValidations.searchPlaceholder')}
						ariaLabel={t('tmValidations.searchPlaceholder')}
					/>
				</div>
				<CustomSelect
					name="sortDir"
					value={sortDir}
					onChange={(e) => setSortDir(e.target.value)}
					options={sortOptions}
					ariaLabel={t('tmValidations.sortBy')}
					compact
				/>
				<Button
					variant="outlined"
					color="primary"
					size="sm"
					loading={loading}
					onClick={load}
				>
					{t('tmValidations.refresh')}
				</Button>
			</div>

			{loading ? (
				<CardGridSkeleton count={6} />
			) : error ? (
				<div className={styles.errorCard}>{error}</div>
			) : filtered.length === 0 ? (
				<div className={styles.emptyCard}>
					<Icon name="check_circle" size={32} color="var(--color-outline)" />
					<h5 className={styles.emptyTitle}>{t('tmValidations.empty')}</h5>
					<p className={styles.emptyDesc}>{t('tmValidations.emptyDesc')}</p>
				</div>
			) : (
				<>
					<div className={styles.cardsGrid}>
						{filtered.map((app) => {
							const guid = app.application_guid;
							const state = app.application_state;
							const badgeName = app.badge?.badge_title || `Badge #${app.badge_id}`;
							const badgeImg = app.badge?.badge_img_url;
							const consultantName = app.user?.user?.full_name || '—';
							const consultantImg = app.user?.user?.profile_img_url;

							return (
								<button
									key={guid}
									type="button"
									className={styles.appCard}
									onClick={() => navigate(`/applications/${guid}`)}
								>
									<div className={styles.cardHeader}>
										<div className={styles.cardBadgeIcon}>
											{badgeImg ? (
												<img src={badgeImg} alt={badgeName} className={styles.cardBadgeImg} />
											) : (
												<Icon name="badge" size={24} color="var(--color-secondary, #39639c)" />
											)}
										</div>
										<div className={styles.cardInfo}>
											<h3 className={styles.cardTitle}>{badgeName}</h3>
											<div className={styles.consultantRow}>
												<Avatar src={consultantImg} name={consultantName} size={22} />
												<span className={styles.consultantName}>{consultantName}</span>
											</div>
										</div>
									</div>

									<div className={styles.cardFooter}>
										<span className={styles.footerDate}>
											<Icon name="clock" size={14} color="var(--color-outline)" />
											{formatDate(app)}
										</span>
										<span className={styles.footerState} style={{ color: STATE_COLOR_MAP[state] }}>
											{getStateLabel(state)}
										</span>
									</div>
								</button>
							);
						})}
					</div>

					{pagination && pagination.totalPages > 1 && (
						<Pagination
							currentPage={pagination.page}
							totalPages={pagination.totalPages}
							totalItems={pagination.total}
							itemCount={items.length}
							onPageChange={setPage}
						/>
					)}
				</>
			)}
		</div>
	);
}
