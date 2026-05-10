import { memo, useEffect, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import styles from './ParticlesBackground.module.css';

const particlesConfig = {
	background: { color: { value: 'transparent' } },
	fpsLimit: 60,
	interactivity: { events: { onHover: { enable: false }, onClick: { enable: false } } },
	particles: {
		color: { value: ['#00B8E0', '#39639C', '#B9EBF6', '#CEE8F1'] },
		links: { enable: false },
		move: {
			direction: 'top',
			enable: true,
			outModes: { default: 'out' },
			random: true,
			speed: { min: 0.3, max: 1.1 },
			straight: false,
		},
		number: { density: { enable: true, area: 800 }, value: 60 },
		opacity: { value: { min: 0.2, max: 0.6 } },
		shape: { type: 'circle' },
		size: { value: { min: 3, max: 9 } },
		shadow: {
			enable: true,
			blur: 30,
			color: { value: '#00B8E0' },
		},
	},
	detectRetina: true,
};

let engineInitPromise = null;
function getEngine() {
	if (!engineInitPromise) {
		engineInitPromise = initParticlesEngine(async (engine) => {
			await loadSlim(engine);
		});
	}
	return engineInitPromise;
}

const ParticlesBackground = memo(function ParticlesBackground() {
	const [engineReady, setEngineReady] = useState(false);

	useEffect(() => {
		getEngine().then(() => setEngineReady(true));
	}, []);

	if (!engineReady) return null;

	return (
		<Particles
			className={styles.particles}
			id="auth-particles"
			options={particlesConfig}
		/>
	);
});

export default ParticlesBackground;
