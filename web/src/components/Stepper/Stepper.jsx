import styles from './Stepper.module.css';

/**
 * Horizontal step progress indicator (e.g. for multi-step forms).
 * @param {Array} steps - Step definitions: { label }.
 * @param {number} [activeStep=0] - Zero-based index of the current step.
 */
export default function Stepper({ steps = [], activeStep = 0 }) {
	return (
		<div className={styles.stepper}>
			{steps.map((step, index) => {
				const isCompleted = index < activeStep;
				const isActive = index === activeStep;
				const circleClass = [
					styles.circle,
					isActive || isCompleted ? styles.active : '',
				].filter(Boolean).join(' ');
				const labelClass = [
					styles.label,
					isActive || isCompleted ? styles.activeLabel : '',
				].filter(Boolean).join(' ');

				return (
					<div
						key={index}
						className={`${styles.stepItem} ${index < steps.length - 1 ? styles.withConnector : ''}`}
					>
						<div className={styles.stepContent}>
							<div className={circleClass}>{index + 1}</div>
							<span className={labelClass}>{step.label}</span>
						</div>
						{index < steps.length - 1 && (
							<div className={`${styles.connector} ${isCompleted ? styles.activeConnector : ''}`} />
						)}
					</div>
				);
			})}
		</div>
	);
}
