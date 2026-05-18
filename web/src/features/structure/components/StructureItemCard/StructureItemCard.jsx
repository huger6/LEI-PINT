import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Icon from '../../../../components/Icons/Icons';
import styles from './StructureItemCard.module.css';

export default function StructureItemCard({ to, icon, title, description, imageUrl, isActive, meta, tone, infoItems }) {
	const { t } = useTranslation();
	const toneClass = tone ? styles[tone] : '';

	return (
		<Link to={to} className={styles.cardLink}>
			<article className={`${styles.card} ${toneClass}`}>
				<div className={styles.visual}>
					{imageUrl ? (
						<img src={imageUrl} alt={title} className={styles.image} />
					) : (
						<div className={styles.iconWrap}>
							<Icon name={icon} size={32} />
						</div>
					)}
				</div>

				<div className={styles.body}>
					<div className={styles.header}>
						<h3 className={styles.title}>{title}</h3>
						{isActive !== undefined && (
							<span className={`${styles.badge} ${isActive ? styles.active : styles.inactive}`}>
								{isActive
									? t('shared.active', { defaultValue: 'Active' })
									: t('shared.inactive', { defaultValue: 'Inactive' })}
							</span>
						)}
					</div>
					{description && <p className={styles.description}>{description}</p>}
					{meta && <span className={styles.meta}>{meta}</span>}
					{infoItems && infoItems.length > 0 && (
						<div className={styles.infoStrip}>
							{infoItems.map((info) => (
								<span key={info.label} className={styles.infoItem} title={info.label}>
									<Icon name={info.icon} size={16} />
									<span className={styles.infoValue}>{info.value ?? 0}</span>
								</span>
							))}
						</div>
					)}
				</div>

				<div className={styles.arrow} aria-hidden="true">
					<Icon name="chevron_forward" size={20} />
				</div>
			</article>
		</Link>
	);
}
