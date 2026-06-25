import styles from './Tabs.module.css';

/**
 * Horizontal tab bar with optional badge counts.
 * @param {Array} tabs - Tab definitions: { key, label, badge? }.
 * @param {string} activeTab - Currently selected tab key.
 * @param {Function} onTabChange - Called with the selected tab key.
 */
// Renders a horizontal tab bar where each tab can optionally display a numeric badge.
export default function Tabs({ tabs, activeTab, onTabChange }) {
	return (
		<div className={styles.tabs} role="tablist">
			{tabs.map((tab) => (
				<button
					key={tab.key}
					role="tab"
					aria-selected={activeTab === tab.key}
					className={`${styles.tab} ${activeTab === tab.key ? styles.active : ''}`}
					onClick={() => onTabChange(tab.key)}
					type="button"
				>
					{tab.label}
					{tab.badge != null && tab.badge > 0 && (
						<span className={styles.badge}>{tab.badge}</span>
					)}
				</button>
			))}
		</div>
	);
}
