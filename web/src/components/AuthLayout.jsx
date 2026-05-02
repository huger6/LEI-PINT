import ParticlesBackground from './ParticlesBackground';
import Logo from './Logo';
import styles from './AuthLayout.module.css';

export default function AuthLayout({ children }) {
  return (
    <div className={styles.layout}>
      <ParticlesBackground />
      <div className={styles.content}>
        <Logo />
        {children}
      </div>
    </div>
  );
}
