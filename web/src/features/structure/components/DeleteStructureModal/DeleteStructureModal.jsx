import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../../../components/Modal/Modal';
import Button from '../../../../components/Button/Button';
import Icon from '../../../../components/Icons/Icons';
import styles from './DeleteStructureModal.module.css';

/**
 * Confirmation modal for deleting a structure entity (learning path, service line, area, or level).
 * @param {string} entityName - Name of the entity being deleted (shown in the confirmation message).
 * @param {Function} onConfirm - Called when deletion is confirmed.
 * @param {Function} onClose - Called when the modal is dismissed.
 */
export default function DeleteStructureModal({ entityName, onConfirm, onSuccess, onClose }) {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(false);
	const [dependencies, setDependencies] = useState(null);
	const [genericError, setGenericError] = useState(false);

	const hasDeps = dependencies !== null;

	async function handleConfirm() {
		setLoading(true);
		setDependencies(null);
		setGenericError(false);
		try {
			await onConfirm();
			await onSuccess();
		} catch (err) {
			if (err?.response?.status === 409) {
				setDependencies(err.response.data?.data || {});
			} else {
				setGenericError(true);
			}
		} finally {
			setLoading(false);
		}
	}

	const footer = hasDeps ? (
		<Button variant="outlined" onClick={onClose}>
			{t('shared.close', { defaultValue: 'Close' })}
		</Button>
	) : (
		<>
			<Button variant="outlined" onClick={onClose} disabled={loading}>
				{t('shared.cancel', { defaultValue: 'Cancel' })}
			</Button>
			<Button color="danger" onClick={handleConfirm} loading={loading}>
				{t('shared.delete', { defaultValue: 'Delete' })}
			</Button>
		</>
	);

	return (
		<Modal
			title={hasDeps
				? t('deleteModal.cannotDelete', { defaultValue: 'Cannot Delete' })
				: t('deleteModal.confirmTitle', { defaultValue: 'Confirm Deletion' })
			}
			onClose={onClose}
			size="sm"
			footer={footer}
		>
			{!hasDeps && !genericError && (
				<div className={styles.content}>
					<div className={styles.iconWrap}>
						<Icon name="trash" size={28} />
					</div>
					<p className={styles.message}>
						{t('deleteModal.confirmText', {
							name: entityName,
							defaultValue: `Are you sure you want to deactivate "{{name}}"?`,
						}).replace('{{name}}', entityName)}
					</p>
					<p className={styles.subtext}>
						{t('deleteModal.subtext', {
							defaultValue: 'This will deactivate the entity and all its substructures. Historical data (awarded badges, applications) is preserved.',
						})}
					</p>
				</div>
			)}

			{hasDeps && (
				<div className={styles.content}>
					<div className={`${styles.iconWrap} ${styles.warningIcon}`}>
						<Icon name="danger" size={28} />
					</div>
					<p className={styles.message}>
						{t('deleteModal.blockedText', {
							name: entityName,
							defaultValue: `"{{name}}" cannot be deleted — active dependencies must be resolved first:`,
						}).replace('{{name}}', entityName)}
					</p>
					<ul className={styles.depList}>
						{(dependencies.assignedLeaders || 0) > 0 && (
							<li>
								<Icon name="tabler_users" size={14} className={styles.depIcon} />
								{t('deleteModal.dep.leaders', {
									count: dependencies.assignedLeaders,
									defaultValue: `${dependencies.assignedLeaders} assigned Service Line Leader(s)`,
								}).replace('{{count}}', dependencies.assignedLeaders)}
							</li>
						)}
						{(dependencies.consultantsEnrolled || 0) > 0 && (
							<li>
								<Icon name="tabler_users" size={14} className={styles.depIcon} />
								{t('deleteModal.dep.consultants', {
									count: dependencies.consultantsEnrolled,
									defaultValue: `${dependencies.consultantsEnrolled} enrolled consultant(s)`,
								}).replace('{{count}}', dependencies.consultantsEnrolled)}
							</li>
						)}
						{(dependencies.activeApplications || 0) > 0 && (
							<li>
								<Icon name="badge" size={14} className={styles.depIcon} />
								{t('deleteModal.dep.applications', {
									count: dependencies.activeApplications,
									defaultValue: `${dependencies.activeApplications} in-progress badge application(s)`,
								}).replace('{{count}}', dependencies.activeApplications)}
							</li>
						)}
					</ul>
					<p className={styles.subtext}>
						{t('deleteModal.resolveFirst', {
							defaultValue: 'Resolve these dependencies before attempting to delete.',
						})}
					</p>
				</div>
			)}

			{genericError && (
				<div className={styles.content}>
					<div className={`${styles.iconWrap} ${styles.warningIcon}`}>
						<Icon name="danger" size={28} />
					</div>
					<p className={styles.message}>
						{t('shared.errorOccurred', { defaultValue: 'An unexpected error occurred. Please try again.' })}
					</p>
				</div>
			)}
		</Modal>
	);
}
