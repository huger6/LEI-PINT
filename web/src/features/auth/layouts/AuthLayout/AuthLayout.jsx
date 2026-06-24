import ParticlesBackground from '../../../../components/ParticlesBackground/ParticlesBackground';
import PreferencesBar from '../../../../components/PreferencesBar/PreferencesBar';
import Logo from '../../../../components/Logo/Logo';
import styles from './AuthLayout.module.css';

/** Full-page layout wrapper for all authentication screens (centered card with particles background). */
export default function AuthLayout({ children }) {
	return (
		<div className={styles.layout}>
			<ParticlesBackground />
			<PreferencesBar floating />
			<div className="d-flex flex-column align-items-center justify-content-center min-vh-100 py-4 px-3 position-relative" style={{ zIndex: 1 }}>
				{children}
			</div>
		</div>
	);
}

