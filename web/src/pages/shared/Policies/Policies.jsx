import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getLatestPolicy } from '../../../features/gdpr/api/gdprApi';
import ContentCard, { CardHeader } from '../../../components/ContentCard/ContentCard';
import TranslatedText from '../../../components/TranslatedText/TranslatedText';
import Spinner from '../../../components/Spinner/Spinner';
import styles from './Policies.module.css';

// Policy types to display, in order, each mapped to an icon for its card header.
const POLICY_TYPES = [
	{ type: 'Privacy', icon: 'privacy' },
	{ type: 'Terms', icon: 'paper' },
	{ type: 'Cookies', icon: 'bookmark' },
];

// Public, read-only page listing the current active GDPR policies
// (Privacy / Terms / Cookies) with title, version and full text.
export default function Policies() {
	// Translation helper for static UI strings.
	const { t } = useTranslation();
	// Active policies keyed by policy_type (null when none exists for a type).
	const [policies, setPolicies] = useState({});
	// Loading state for the initial fetch.
	const [loading, setLoading] = useState(true);

	// Fetch the latest active policy for every configured type on mount.
	useEffect(() => {
		let cancelled = false;

		async function load() {
			setLoading(true);
			const results = await Promise.all(
				POLICY_TYPES.map(({ type }) =>
					getLatestPolicy(type).catch(() => null)
				)
			);
			if (cancelled) return;
			const next = {};
			POLICY_TYPES.forEach(({ type }, i) => { next[type] = results[i]; });
			setPolicies(next);
			setLoading(false);
		}

		load();
		return () => { cancelled = true; };
	}, []);

	// Whether at least one policy was returned by the API.
	const hasAny = POLICY_TYPES.some(({ type }) => policies[type]);

	return (
		<div className={styles.page}>
			<header className={styles.intro}>
				<h1 className={styles.title}>{t('policies.title')}</h1>
				<p className={styles.subtitle}>{t('policies.subtitle')}</p>
			</header>

			{loading ? (
				<Spinner />
			) : !hasAny ? (
				<ContentCard className={styles.section}>
					<p className={styles.empty}>{t('policies.empty')}</p>
				</ContentCard>
			) : (
				POLICY_TYPES.map(({ type, icon }) => {
					const policy = policies[type];
					if (!policy) return null;
					return (
						<ContentCard key={type} className={styles.section}>
							<CardHeader
								icon={icon}
								iconBg="var(--color-secondary-container)"
								iconColor="var(--color-secondary)"
								title={t(`policies.types.${type}`, { defaultValue: type })}
							/>
							{policy.version && (
								<span className={styles.version}>
									{t('policies.version', { version: policy.version })}
								</span>
							)}
							<TranslatedText
								as="div"
								className={styles.policyText}
								text={policy.policy_text}
							/>
						</ContentCard>
					);
				})
			)}
		</div>
	);
}
