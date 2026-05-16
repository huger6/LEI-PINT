import { useTranslation } from 'react-i18next';
import Icon from '../../../../components/Icons/Icons';
import Button from '../../../../components/Button/Button';
import StructureStatCard from '../../components/StructureStatCard/StructureStatCard';
import SubStructureCard from '../../components/SubStructureCard/SubStructureCard';
import styles from './StructureDetailLayout.module.css';

export default function StructureDetailLayout({
	title,
	description,
	icon,
	imageUrl,
	tone,
	isActive,
	stats,
	subStructures,
	subStructureLabel,
	subStructureIcon,
	subStructureTone,
	onEdit,
	onAddSub,
	onDelete,
	onExport,
	addSubLabel,
}) {
	const { t } = useTranslation();
	const toneClass = tone ? styles[tone] : '';

	return (
		<div className={styles.page}>
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

					<div className={styles.actions}>
						<Button
							variant="outlined"
							size="sm"
							className={styles.actionBtn}
							onClick={onEdit}
						>
							<Icon name="pencil" size={15} aria-hidden="true" />
							<span>{t('shared.edit')}</span>
						</Button>
						<Button
							variant="outlined"
							size="sm"
							className={styles.actionBtn}
							onClick={onAddSub}
						>
							<Icon name="add" size={15} aria-hidden="true" />
							<span>{addSubLabel}</span>
						</Button>
						<Button
							variant="outlined"
							size="sm"
							color="danger"
							className={styles.actionBtn}
							onClick={onDelete}
						>
							<Icon name="trash" size={15} aria-hidden="true" />
							<span>{t('shared.delete')}</span>
						</Button>
						<Button
							variant="outlined"
							size="sm"
							className={styles.actionBtn}
							onClick={onExport}
						>
							<Icon name="download" size={15} aria-hidden="true" />
							<span>{t('structureDetail.export', { defaultValue: 'Export' })}</span>
						</Button>
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

					<div className={styles.statsGrid}>
						{stats.map((stat) => (
							<StructureStatCard key={stat.label} {...stat} />
						))}
					</div>
				</section>
			</div>

			{/* Sub-structures section */}
			{subStructures && subStructures.length > 0 && (
				<section className={styles.subSection}>
					<h2 className={styles.sectionTitle}>{subStructureLabel}</h2>
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
							/>
						))}
					</div>
				</section>
			)}
		</div>
	);
}
