import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getAnnouncements } from '../../../features/announcements/api/announcementsApi';
import FilterSearchInput from '../../../components/FilterSearchInput/FilterSearchInput';
import Pagination from '../../../components/Pagination/Pagination';
import Icon from '../../../components/Icons/Icons';
import styles from './ConsultantAnnouncements.module.css';

const TYPE_CLASS_MAP = {
	'Information': 'typeInformation',
	'Warning': 'typeWarning',
	'New Content': 'typeNewContent',
	'Other': 'typeOther',
};

function formatDate(iso) {
	if (!iso) return null;
	return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function AnnouncementCard({ announcement, t }) {
	const [expanded, setExpanded] = useState(false);
	const message = announcement.announcement_message || '';
	const isLong = message.length > 200;

	return (
		<article className={styles.card}>
			{announcement.announcement_type && (
				<span className={`${styles.typeBadge} ${styles[TYPE_CLASS_MAP[announcement.announcement_type]] || ''}`}>
					{t(`announcements.types.${announcement.announcement_type}`)}
				</span>
			)}

			<h3 className={styles.cardTitle}>{announcement.announcement_title}</h3>

			<p className={`${styles.cardMessage} ${!expanded && isLong ? styles.cardMessageClamped : ''}`}>
				{message}
			</p>

			{isLong && (
				<button type="button" className={styles.readMoreBtn} onClick={() => setExpanded(!expanded)}>
					{expanded ? t('announcements.readLess') : t('announcements.readMore')}
				</button>
			)}

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
	const { t } = useTranslation();

	const [announcements, setAnnouncements] = useState([]);
	const [pagination, setPagination] = useState({ totalItems: 0, totalPages: 0, currentPage: 1 });
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState('');

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

	useEffect(() => {
		load();
	}, [load]);

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
						<AnnouncementCard key={a.announcement_id} announcement={a} t={t} />
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
		</div>
	);
}
