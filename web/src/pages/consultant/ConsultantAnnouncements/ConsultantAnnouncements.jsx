import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getAnnouncements } from '../../../features/announcements/api/announcementsApi';
import FilterSearchInput from '../../../components/FilterSearchInput/FilterSearchInput';
import Pagination from '../../../components/Pagination/Pagination';
import Modal from '../../../components/Modal/Modal';
import Icon from '../../../components/Icons/Icons';
import TranslatedText from '../../../components/TranslatedText/TranslatedText';
import styles from './ConsultantAnnouncements.module.css';

const TYPE_CLASS_MAP = {
	'Information': 'typeInformation',
	'Warning': 'typeWarning',
	'New Content': 'typeNewContent',
	'Other': 'typeOther',
};

// Format an ISO date string into a short human-readable locale date
function formatDate(iso) {
	if (!iso) return null;
	return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

// Render a single announcement card that opens a detail modal on click
function AnnouncementCard({ announcement, t, onOpen }) {
	const message = announcement.announcement_message || '';

	return (
		<article
			className={styles.card}
			role="button"
			tabIndex={0}
			onClick={() => onOpen(announcement)}
			onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(announcement); } }}
			title={t('announcements.readMore')}
		>
			{announcement.announcement_type && (
				<span className={`${styles.typeBadge} ${styles[TYPE_CLASS_MAP[announcement.announcement_type]] || ''}`}>
					{t(`announcements.types.${announcement.announcement_type}`)}
				</span>
			)}

			<h3 className={styles.cardTitle}><TranslatedText text={announcement.announcement_title} /></h3>

			<p className={`${styles.cardMessage} ${styles.cardMessageClamped}`}>
				<TranslatedText text={message} />
			</p>

			<div className={styles.cardFooter}>
				<span className={styles.cardDate}>
					{t('announcements.postedOn')} {formatDate(announcement.created_at)}
				</span>
				<span className={styles.cardExpiry}>
					{announcement.ends_at ? `→ ${formatDate(announcement.ends_at)}` : t('announcements.noExpiry')}
				</span>
			</div>
		</article>
	);
}

// Render a grid of placeholder skeleton cards while data is loading
function SkeletonCards() {
	return Array.from({ length: 6 }).map((_, i) => (
		<div key={i} className={styles.skeletonCard}>
			<div className={styles.skeletonLine} style={{ width: '35%', height: 20 }} />
			<div className={styles.skeletonLine} style={{ width: '80%' }} />
			<div className={styles.skeletonLine} style={{ width: '100%' }} />
			<div className={styles.skeletonLine} style={{ width: '90%' }} />
			<div className={styles.skeletonLine} style={{ width: '60%', marginTop: 'auto' }} />
		</div>
	));
}

export default function ConsultantAnnouncements() {
	// Initialize translation utility
	const { t } = useTranslation();

	// Store the current page of announcement results
	const [announcements, setAnnouncements] = useState([]);
	// Store pagination metadata from the API response
	const [pagination, setPagination] = useState({ totalItems: 0, totalPages: 0, currentPage: 1 });
	// Track whether a fetch is in progress
	const [loading, setLoading] = useState(true);
	// Track the currently active page number
	const [page, setPage] = useState(1);
	// Store the current search text filter
	const [search, setSearch] = useState('');
	// Store the announcement currently open in the detail modal, or null
	const [active, setActive] = useState(null);

	// Fetch announcements from the API with current page and search params
	const load = useCallback(async () => {
		setLoading(true);
		try {
			const params = { page, limit: 12 };
			if (search) params.search = search;
			const result = await getAnnouncements(params);
			setAnnouncements(result.data);
			setPagination(result.pagination);
		} catch {
			setAnnouncements([]);
		} finally {
			setLoading(false);
		}
	}, [page, search]);

	// Re-fetch announcements whenever the load callback changes (page or search)
	useEffect(() => {
		load();
	}, [load]);

	// Update the search text and reset to page 1 when the user types
	function handleSearchChange(e) {
		setSearch(e.target.value);
		setPage(1);
	}

	return (
		<div className="container-fluid py-4">
			<div className="d-flex align-items-center gap-2 mb-4">
				<Icon name="megaphone" size={24} color="var(--color-primary)" />
				<h4 className="fw-bold mb-0">{t('announcements.title')}</h4>
			</div>

			<div className="mb-3" style={{ maxWidth: 400 }}>
				<FilterSearchInput
					id="announcement-search"
					name="search"
					value={search}
					onChange={handleSearchChange}
					placeholder={t('shared.search')}
					ariaLabel={t('shared.search')}
				/>
			</div>

			{loading ? (
				<div className={styles.grid}>
					<SkeletonCards />
				</div>
			) : announcements.length === 0 ? (
				<div className={styles.emptyState}>
					<div className={styles.emptyIcon}>
						<Icon name="megaphone" size={28} />
					</div>
					<p className={styles.emptyTitle}>{t('announcements.consultantEmpty')}</p>
				</div>
			) : (
				<div className={styles.grid}>
					{announcements.map(a => (
						<AnnouncementCard key={a.announcement_id} announcement={a} t={t} onOpen={setActive} />
					))}
				</div>
			)}

			<div className="mt-3">
				<Pagination
					currentPage={page}
					totalPages={pagination.totalPages}
					totalItems={pagination.totalItems}
					itemCount={announcements.length}
					onPageChange={setPage}
				/>
			</div>

			{active && (
				<Modal title={active.announcement_title} onClose={() => setActive(null)}>
					<div className={styles.modalBody}>
						{active.announcement_type && (
							<span className={`${styles.typeBadge} ${styles[TYPE_CLASS_MAP[active.announcement_type]] || ''}`}>
								{t(`announcements.types.${active.announcement_type}`)}
							</span>
						)}
						<p className={styles.modalMessage}><TranslatedText text={active.announcement_message} /></p>
						<div className={styles.cardFooter}>
							<span className={styles.cardDate}>{t('announcements.postedOn')} {formatDate(active.created_at)}</span>
							<span className={styles.cardExpiry}>
								{active.ends_at ? `→ ${formatDate(active.ends_at)}` : t('announcements.noExpiry')}
							</span>
						</div>
					</div>
				</Modal>
			)}
		</div>
	);
}
