import { useTranslation } from 'react-i18next';
import Icon from '../Icons/Icons';
import styles from './MobileAppPromo.module.css';

const APP_DOWNLOAD_URL =
	'https://drive.google.com/file/d/1ltwdz9XW633C-vd_6uQiDISIxUN9QR2l/view?usp=sharing';

const ADVANTAGES = ['adv1', 'adv2', 'adv3', 'adv4'];

// Promotional banner advertising the mobile app. Used only on the consultant
// dashboard (the mobile app targets the consultant experience).
export default function MobileAppPromo() {
	const { t } = useTranslation();

	return (
		<section className={styles.promo}>
			<div className={styles.iconWrap}>
				<Icon name="phone" size={40} color="#fff" aria-hidden="true" />
			</div>

			<div className={styles.body}>
				<h2 className={styles.title}>{t('mobileAppPromo.title')}</h2>
				<p className={styles.subtitle}>{t('mobileAppPromo.subtitle')}</p>
				<ul className={styles.advantages}>
					{ADVANTAGES.map((k) => (
						<li key={k} className={styles.advantage}>
							<Icon name="check_circle" size={16} color="#fff" aria-hidden="true" />
							<span>{t(`mobileAppPromo.${k}`)}</span>
						</li>
					))}
				</ul>
			</div>

			<div className={styles.action}>
				<a
					className={styles.downloadBtn}
					href={APP_DOWNLOAD_URL}
					target="_blank"
					rel="noopener noreferrer"
				>
					<Icon name="download" size={18} aria-hidden="true" />
					{t('mobileAppPromo.downloadButton')}
				</a>
			</div>
		</section>
	);
}
