import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import Modal from '../../../../components/Modal/Modal';
import Avatar from '../../../../components/Avatar/Avatar';
import FilterSearchInput from '../../../../components/FilterSearchInput/FilterSearchInput';
import Pagination from '../../../../components/Pagination/Pagination';
import Icon from '../../../../components/Icons/Icons';
import styles from './PeerPickerModal.module.css';

const PAGE_SIZE = 8;

/**
 * Searchable, paginated picker for choosing which peer to compare against.
 * Operates over the already-loaded team/area consultants (client-side).
 */
export default function PeerPickerModal({ consultants, excludeGuid, currentGuid, onSelect, onClose }) {
	const { t } = useTranslation();
	const [search, setSearch] = useState('');
	const [page, setPage] = useState(1);

	const filtered = useMemo(() => {
		const term = search.trim().toLowerCase();
		return consultants
			.filter((c) => c.user_guid !== excludeGuid)
			.filter((c) => !term || (c.full_name || '').toLowerCase().includes(term));
	}, [consultants, excludeGuid, search]);

	const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
	const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

	function choose(guid) {
		onSelect(guid);
		onClose();
	}

	return (
		<Modal title={t('consultantDetail.pickPeerTitle')} onClose={onClose}>
			<div className="mb-3">
				<FilterSearchInput
					name="peerSearch"
					value={search}
					onChange={(e) => { setSearch(e.target.value); setPage(1); }}
					placeholder={t('consultantDetail.searchConsultant')}
					ariaLabel={t('consultantDetail.searchConsultant')}
				/>
			</div>

			<ul className={styles.list}>
				<li>
					<button type="button" className={`${styles.row} ${!currentGuid ? styles.active : ''}`} onClick={() => choose('')}>
						<span className={styles.avgIcon}><Icon name="ranking" size={16} aria-hidden="true" /></span>
						<span className={styles.name}>{t('consultantDetail.peerAverage')}</span>
						{!currentGuid && <Icon name="check" size={16} color="var(--color-success)" aria-hidden="true" />}
					</button>
				</li>
				{pageItems.map((c) => (
					<li key={c.user_guid}>
						<button type="button" className={`${styles.row} ${currentGuid === c.user_guid ? styles.active : ''}`} onClick={() => choose(c.user_guid)}>
							<Avatar src={c.profile_img_url} name={c.full_name} size={28} />
							<span className={styles.name}>{c.full_name}</span>
							<span className={styles.stat}>{Number(c.total_points || 0).toLocaleString('pt-PT')} pts</span>
							{currentGuid === c.user_guid && <Icon name="check" size={16} color="var(--color-success)" aria-hidden="true" />}
						</button>
					</li>
				))}
				{pageItems.length === 0 && <li className={styles.empty}>{t('consultantDetail.noConsultants')}</li>}
			</ul>

			{totalPages > 1 && (
				<Pagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} itemCount={pageItems.length} onPageChange={setPage} />
			)}
		</Modal>
	);
}

PeerPickerModal.propTypes = {
	consultants: PropTypes.array.isRequired,
	excludeGuid: PropTypes.string,
	currentGuid: PropTypes.string,
	onSelect: PropTypes.func.isRequired,
	onClose: PropTypes.func.isRequired,
};
