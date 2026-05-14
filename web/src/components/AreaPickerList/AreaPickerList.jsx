import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../Icons/Icons';
import styles from './AreaPickerList.module.css';

const ITEMS_PER_PAGE = 5;

export default function AreaPickerList({
	areas = [],
	selected = [],
	onChange,
	maxSelections = 5,
	error,
}) {
	const { t } = useTranslation();
	const [search, setSearch] = useState('');
	const [page, setPage] = useState(1);

	const filtered = useMemo(() => {
		if (!search.trim()) return areas;
		const q = search.toLowerCase();
		return areas.filter((a) => {
			const name = a.area_name ?? a.name ?? '';
			return name.toLowerCase().includes(q);
		});
	}, [areas, search]);

	const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
	const safePage = Math.min(page, totalPages);
	const pageItems = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

	const isSelected = (areaId) => selected.some((s) => s.area_id === areaId);
	const isPrimary = (areaId) => selected.some((s) => s.area_id === areaId && s.is_primary);

	const toggle = (areaId) => {
		if (isSelected(areaId)) {
			const next = selected.filter((s) => s.area_id !== areaId);
			if (next.length > 0 && !next.some((s) => s.is_primary)) {
				next[0] = { ...next[0], is_primary: true };
			}
			onChange(next);
		} else {
			if (selected.length >= maxSelections) return;
			onChange([...selected, { area_id: areaId, is_primary: selected.length === 0 }]);
		}
	};

	const setPrimary = (areaId) => {
		onChange(selected.map((s) => ({ ...s, is_primary: s.area_id === areaId })));
	};

	const getAreaName = (areaId) => {
		const area = areas.find((a) => (a.area_id ?? a.id) === areaId);
		return area?.area_name ?? area?.name ?? '';
	};

	return (
		<div className={styles.wrapper}>
			<div className={styles.searchRow}>
				<div className={styles.searchInputWrapper}>
					<Icon name="search" size={14} className={styles.searchIcon} aria-hidden="true" />
					<input
						type="text"
						className={styles.searchInput}
						placeholder={t('adminUsers.searchAreas')}
						value={search}
						onChange={(e) => { setSearch(e.target.value); setPage(1); }}
					/>
				</div>
			</div>

			{selected.length > 0 && (
				<div className={styles.selectedChips}>
					{selected.map((s) => (
						<span key={s.area_id} className={styles.chip}>
							{getAreaName(s.area_id)}
							{s.is_primary && <Icon name="star" size={12} color="var(--color-warning)" fill="currentColor" stroke="none" aria-hidden="true" />}
							<button type="button" className={styles.chipRemove} onClick={() => toggle(s.area_id)} aria-label={t('shared.delete')}>
								<Icon name="close" size={10} aria-hidden="true" />
							</button>
						</span>
					))}
					<span className={styles.countHint}>{t('adminUsers.selectedCount', { count: selected.length, max: maxSelections })}</span>
				</div>
			)}

			<div className={styles.list}>
				{pageItems.length === 0 ? (
					<div className={styles.emptyRow}>{t('adminUsers.noAreasFound')}</div>
				) : (
					pageItems.map((area) => {
						const areaId = area.area_id ?? area.id;
						const areaName = area.area_name ?? area.name ?? '';
						const sel = isSelected(areaId);
						const pri = isPrimary(areaId);
						const disabledAdd = !sel && selected.length >= maxSelections;

						return (
							<div
								key={areaId}
								className={`${styles.row} ${sel ? styles.rowSelected : ''} ${disabledAdd ? styles.rowDisabled : ''}`}
								onClick={() => !disabledAdd && toggle(areaId)}
								role="option"
								aria-selected={sel}
								tabIndex={0}
								onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!disabledAdd) toggle(areaId); } }}
							>
								<div className={`${styles.checkbox} ${sel ? styles.checkboxChecked : ''}`}>
									{sel && <Icon name="check" size={12} color="var(--color-on-primary)" aria-hidden="true" />}
								</div>
								<span className={styles.rowName}>{areaName}</span>
								{sel && (
									<button
										type="button"
										className={`${styles.starBtn} ${pri ? styles.starBtnActive : ''}`}
										onClick={(e) => { e.stopPropagation(); setPrimary(areaId); }}
										title={t('adminUsers.setPrimary')}
										aria-label={t('adminUsers.setPrimary')}
									>
										<Icon name="star" size={14} color="currentColor" fill={pri ? 'currentColor' : 'none'} aria-hidden="true" />
									</button>
								)}
							</div>
						);
					})
				)}
			</div>

			{totalPages > 1 && (
				<div className={styles.pager}>
					<button type="button" className={styles.pageBtn} disabled={safePage <= 1} onClick={() => setPage((p) => p - 1)}>
						<Icon name="chevron_backward" size={14} aria-hidden="true" />
					</button>
					<span className={styles.pageInfo}>{safePage} / {totalPages}</span>
					<button type="button" className={styles.pageBtn} disabled={safePage >= totalPages} onClick={() => setPage((p) => p + 1)}>
						<Icon name="chevron_forward" size={14} aria-hidden="true" />
					</button>
				</div>
			)}

			{error && <div className={styles.error}>{error}</div>}
		</div>
	);
}
