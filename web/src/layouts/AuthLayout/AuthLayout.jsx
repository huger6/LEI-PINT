import ParticlesBackground from '../../features/auth/components/ParticlesBackground/ParticlesBackground';
import Logo from '../../components/Logo/Logo';
import styles from './AuthLayout.module.css';

export default function AuthLayout({ children }) {
	return (
		<div className={styles.layout}>
			<ParticlesBackground />
			<div className="d-flex flex-column align-items-center justify-content-center min-vh-100 py-4 px-3 position-relative" style={{ zIndex: 1 }}>
				{children}
			</div>
		</div>
	);
}
