import { useTranslation } from 'react-i18next';
import Icon from '../../../../components/Icons/Icons';
import Button from '../../../../components/Button/Button';
import FilterSearchInput from '../../../../components/FilterSearchInput/FilterSearchInput';
import Pagination from '../../../../components/Pagination/Pagination';
import Spinner from '../../../../components/Spinner/Spinner';
import styles from './StructureListLayout.module.css';

export default function StructureListLayout({
	title,
	icon,
	tone,
	addLabel,
	onAdd,
	search,
	onSearchChange,
	searchPlaceholder,
	statusFilter,
	onStatusFilterChange,
	loading,
	items,
	pagination,
	page,
	onPageChange,
	renderCard,
	emptyTitle,
	emptyDescription,
	renderFilters,
}) {
	const { t } = useTranslation();
	const toneClass = tone ? styles[tone] : '';

	return (
		<div className={styles.page}>
			<header className={styles.header}>
				<div className={styles.headerLeft}>
					<div className={`${styles.headerIcon} ${toneClass}`}>
						<Icon name={icon} size={28} />
					</div>
					<h1 className={styles.title}>{title}</h1>
				</div>
				<Button onClick={onAdd} className={styles.addBtn}>
					<Icon name="add" size={18} aria-hidden="true" />
					<span>{addLabel}</span>
				</Button>
			</header>

			<div className={styles.toolbar}>
				<FilterSearchInput
					name="search"
					value={search}
					onChange={onSearchChange}
					placeholder={searchPlaceholder || t('shared.search', { defaultValue: 'Search...' })}
					ariaLabel={searchPlaceholder}
					className={styles.searchInput}
				/>
				{renderFilters ? (
					<div className={styles.filters}>{renderFilters()}</div>
				) : (
					<div className={styles.filters}>
						<select
							className={styles.filterSelect}
							value={statusFilter}
							onChange={onStatusFilterChange}
							aria-label={t('shared.status', { defaultValue: 'Status' })}
						>
							<option value="all">{t('shared.allStatuses', { defaultValue: 'All Statuses' })}</option>
							<option value="active">{t('shared.active', { defaultValue: 'Active' })}</option>
							<option value="inactive">{t('shared.inactive', { defaultValue: 'Inactive' })}</option>
						</select>
					</div>
				)}
			</div>

			{loading ? (
				<Spinner />
			) : items.length === 0 ? (
				<div className={styles.empty}>
					<div className={`${styles.emptyIcon} ${toneClass}`}>
						<Icon name={icon} size={48} />
					</div>
					<h3 className={styles.emptyTitle}>{emptyTitle}</h3>
					<p className={styles.emptyDesc}>{emptyDescription}</p>
				</div>
			) : (
				<>
					<Pagination
						currentPage={page}
						totalPages={pagination.totalPages}
						totalItems={pagination.totalItems}
						itemCount={items.length}
						onPageChange={onPageChange}
					/>
					<div className={styles.cardGrid}>
						{items.map(renderCard)}
					</div>
					<Pagination
						currentPage={page}
						totalPages={pagination.totalPages}
						totalItems={pagination.totalItems}
						itemCount={items.length}
						onPageChange={onPageChange}
					/>
				</>
			)}
		</div>
	);
}
