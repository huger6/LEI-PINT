import { useTranslation } from 'react-i18next';
import Icon from '../../../../components/Icons/Icons';
import Tooltip from '../../../../components/Tooltip/Tooltip';
import Button from '../../../../components/Button/Button';
import Pagination from '../../../../components/Pagination/Pagination';
import StructureStatCard from '../../components/StructureStatCard/StructureStatCard';
import SubStructureCard from '../../components/SubStructureCard/SubStructureCard';
import StructureBreadcrumb from '../../components/StructureBreadcrumb/StructureBreadcrumb';
import styles from './StructureDetailLayout.module.css';

export default function StructureDetailLayout({
	breadcrumbItems,
	title,
	description,
	icon,
	imageUrl,
	tone,
	isActive,
	stats,
	enrollmentMessage,
	extraContent,
	subStructures,
	subStructureLabel,
	subStructureIcon,
	subStructureTone,
	onEdit,
	onAddSub,
	onDelete,
	onActivate,
	isActivating,
	onExport,
	addSubLabel,
	pagination,
	onPageChange,
}) {
	const { t } = useTranslation();
	const toneClass = tone ? styles[tone] : '';

	return (
		<div className={styles.page}>
			<StructureBreadcrumb items={breadcrumbItems} />
			<div className={styles.titleRow}>
				<h1 className={styles.pageTitle}>{title}</h1>
				{isActive !== undefined && (
					<span className={`${styles.statusBadge} ${isActive ? styles.statusActive : styles.statusInactive}`}>
						{isActive
							? t('shared.active', { defaultValue: 'Active' })
							: t('shared.inactive', { defaultValue: 'Inactive' })}
					</span>
				)}
			</div>

			<div className={styles.mainGrid}>
				{/* Left panel - image + actions */}
				<aside className={`${styles.leftPanel} ${toneClass}`}>
					<div className={styles.imageSection}>
						{imageUrl ? (
							<img src={imageUrl} alt={title} className={styles.image} />
						) : (
							<div className={styles.iconPlaceholder}>
								<Icon name={icon} size={64} />
							</div>
						)}
					</div>

					<div className={styles.toolbar}>
						<Tooltip text={t('shared.edit')}>
							<button
								type="button"
								className={styles.toolbarBtn}
								onClick={onEdit}
							>
								<Icon name="pencil" size={16} aria-hidden="true" />
							</button>
						</Tooltip>
						<Tooltip text={t('structureDetail.export', { defaultValue: 'Export' })}>
							<button
								type="button"
								className={styles.toolbarBtn}
								onClick={onExport}
							>
								<Icon name="download" size={16} aria-hidden="true" />
							</button>
						</Tooltip>
						{onActivate ? (
							<Tooltip text={t('shared.activate', { defaultValue: 'Activate' })}>
								<button
									type="button"
									className={`${styles.toolbarBtn} ${styles.toolbarBtnSuccess}`}
									onClick={onActivate}
									disabled={isActivating}
								>
									<Icon
										name="activate"
										size={16}
										className={isActivating ? styles.spinning : ''}
										aria-hidden="true"
									/>
								</button>
							</Tooltip>
						) : (
							<Tooltip text={t('shared.delete')}>
								<button
									type="button"
									className={`${styles.toolbarBtn} ${styles.toolbarBtnDanger}`}
									onClick={onDelete}
									disabled={!onDelete}
								>
									<Icon name="trash" size={16} aria-hidden="true" />
								</button>
							</Tooltip>
						)}
					</div>
				</aside>

				{/* Right panel - content */}
				<section className={styles.rightPanel}>
					{description && (
						<div className={styles.descriptionSection}>
							<h2 className={styles.sectionTitle}>
								{t('structureDetail.description', { defaultValue: 'Description' })}
							</h2>
							<p className={styles.description}>{description}</p>
						</div>
					)}

					{extraContent}

					<div className={styles.statsGrid}>
						{stats.map((stat) => (
							<StructureStatCard key={stat.label} {...stat} />
						))}
					</div>

					{enrollmentMessage && (
						<div className={styles.enrollmentBanner}>
							<Icon name="check_circle" size={18} color="#0f7f69" />
							<span>{enrollmentMessage}</span>
						</div>
					)}
				</section>
			</div>

			{/* Sub-structures section */}
			<section className={styles.subSection}>
				<div className={styles.subSectionHeader}>
					<h2 className={styles.sectionTitle}>{subStructureLabel}</h2>
					<Tooltip text={isActive === false ? t('structureDetail.inactiveCannotAdd', { defaultValue: 'Cannot add substructures to an inactive structure' }) : null}>
						<Button
							variant="outlined"
							size="sm"
							className={styles.addSubBtn}
							onClick={onAddSub}
							disabled={isActive === false}
						>
							<Icon name="add" size={15} aria-hidden="true" />
							<span>{addSubLabel}</span>
						</Button>
					</Tooltip>
				</div>
				{subStructures && subStructures.length > 0 && (
					<div className={styles.subGrid}>
						{subStructures.map((sub) => (
							<SubStructureCard
								key={sub.id}
								icon={subStructureIcon}
								title={sub.title}
								description={sub.description}
								count={sub.count}
								isActive={sub.isActive}
								tone={subStructureTone}
								to={sub.to}
								infoItems={sub.infoItems}
							/>
						))}
					</div>
				)}
				{pagination && onPageChange && (
					<Pagination
						currentPage={pagination.currentPage}
						totalPages={pagination.totalPages}
						totalItems={pagination.totalItems}
						itemCount={subStructures?.length || 0}
						onPageChange={onPageChange}
					/>
				)}
			</section>
		</div>
	);
}
