import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../Modal/Modal';
import FormInput from '../FormInput/FormInput';
import CustomSelect from '../CustomSelect/CustomSelect';
import DateTimePicker from '../DateTimePicker/DateTimePicker';
import Button from '../Button/Button';
import styles from './AnnouncementFormModal.module.css';

const TYPE_OPTIONS = ['Information', 'Warning', 'New Content', 'Other'];
const ROLE_OPTIONS = ['Consultant', 'Talent Manager', 'Service Line Leader', 'Administrator'];

const EMPTY_FORM = {
	announcementTitle: '',
	announcementMessage: '',
	announcementType: '',
	startsAt: '',
	endsAt: '',
	isGlobal: true,
	roleNames: [],
	serviceLineIds: [],
};

/**
 * Modal form for creating or editing a platform announcement.
 * @param {Object} [announcement] - Existing announcement to edit (null for create).
 * @param {Function} onClose - Called when the modal is dismissed.
 * @param {Function} onSaved - Called after successful save.
 */
export default function AnnouncementFormModal({ onClose, onSave, editItem, serviceLines = [] }) {
	const { t, i18n } = useTranslation();
	const isEdit = !!editItem;

	const [form, setForm] = useState(EMPTY_FORM);
	const [errors, setErrors] = useState({});
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (editItem) {
			setForm({
				announcementTitle: editItem.announcement_title || '',
				announcementMessage: editItem.announcement_message || '',
				announcementType: editItem.announcement_type || '',
				startsAt: editItem.starts_at || '',
				endsAt: editItem.ends_at || '',
				isGlobal: editItem.is_global ?? true,
				roleNames: editItem.announc_roles?.map(r => r.role_name) || [],
				serviceLineIds: editItem.announc_sls?.map(s => s.service_line_id) || [],
			});
		}
	}, [editItem]);

	function handleChange(e) {
		const { name, value, type, checked } = e.target;
		setErrors(prev => ({ ...prev, [name]: undefined }));

		if (type === 'checkbox' && name === 'isGlobal') {
			setForm(prev => ({ ...prev, isGlobal: checked }));
			return;
		}

		setForm(prev => ({ ...prev, [name]: value }));
	}

	function handleRoleToggle(role) {
		setErrors(prev => ({ ...prev, target: undefined }));
		setForm(prev => ({
			...prev,
			roleNames: prev.roleNames.includes(role)
				? prev.roleNames.filter(r => r !== role)
				: [...prev.roleNames, role],
		}));
	}

	function handleSlToggle(slId) {
		setErrors(prev => ({ ...prev, target: undefined }));
		setForm(prev => ({
			...prev,
			serviceLineIds: prev.serviceLineIds.includes(slId)
				? prev.serviceLineIds.filter(id => id !== slId)
				: [...prev.serviceLineIds, slId],
		}));
	}

	function handleSelectAllSl() {
		setErrors(prev => ({ ...prev, target: undefined }));
		const allIds = serviceLines.map(sl => sl.service_line_id);
		const allSelected = allIds.length > 0 && allIds.every(id => form.serviceLineIds.includes(id));
		setForm(prev => ({
			...prev,
			serviceLineIds: allSelected ? [] : allIds,
		}));
	}

	function validate() {
		const errs = {};
		if (!form.announcementTitle.trim()) errs.announcementTitle = t('announcements.form.validation.titleRequired');
		else if (form.announcementTitle.length > 150) errs.announcementTitle = t('announcements.form.validation.titleMax');
		if (!form.announcementMessage.trim()) errs.announcementMessage = t('announcements.form.validation.messageRequired');
		if (form.startsAt && form.endsAt && new Date(form.endsAt) <= new Date(form.startsAt)) {
			errs.endsAt = t('announcements.form.validation.endDateAfterStart');
		}
		if (!form.isGlobal && form.roleNames.length === 0 && form.serviceLineIds.length === 0) {
			errs.target = t('announcements.form.validation.targetRequired');
		}
		return errs;
	}

	async function handleSubmit(e) {
		e.preventDefault();
		const errs = validate();
		if (Object.keys(errs).length > 0) {
			setErrors(errs);
			return;
		}

		setSaving(true);
		try {
			const payload = {
				announcementTitle: form.announcementTitle.trim(),
				announcementMessage: form.announcementMessage.trim(),
				announcementType: form.announcementType || undefined,
				startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
				endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
				isGlobal: form.isGlobal,
				roleNames: form.isGlobal ? [] : form.roleNames,
				serviceLineIds: form.isGlobal ? [] : form.serviceLineIds,
			};
			await onSave(payload, editItem);
			onClose();
		} catch {
			setSaving(false);
		}
	}

	const typeSelectOptions = TYPE_OPTIONS.map(tp => ({
		value: tp,
		label: t(`announcements.types.${tp}`),
	}));

	const allSlSelected = serviceLines.length > 0 &&
		serviceLines.every(sl => form.serviceLineIds.includes(sl.service_line_id));

	return (
		<Modal
			title={isEdit ? t('announcements.editAnnouncement') : t('announcements.createAnnouncement')}
			onClose={onClose}
			size="lg"
			footer={
				<div className="d-flex justify-content-end gap-2">
					<Button variant="outlined" onClick={onClose}>{t('shared.cancel')}</Button>
					<Button variant="filled" onClick={handleSubmit} loading={saving}>{t('shared.save')}</Button>
				</div>
			}
		>
			<form onSubmit={handleSubmit} className={styles.form}>
				<FormInput
					id="announcementTitle"
					label={t('announcements.form.title')}
					name="announcementTitle"
					value={form.announcementTitle}
					onChange={handleChange}
					placeholder={t('announcements.form.titlePlaceholder')}
					maxLength={150}
					required
					error={errors.announcementTitle}
				/>

				<div>
					<label htmlFor="announcementMessage" className={`form-label ${styles.label}`}>
						{t('announcements.form.message')}
						<span className={styles.required}> *</span>
					</label>
					<textarea
						id="announcementMessage"
						name="announcementMessage"
						className={`form-control ${styles.textarea} ${errors.announcementMessage ? `is-invalid ${styles.hasError}` : ''}`}
						rows={4}
						value={form.announcementMessage}
						onChange={handleChange}
						placeholder={t('announcements.form.messagePlaceholder')}
						maxLength={10000}
						required
					/>
					{errors.announcementMessage && (
						<div className={`invalid-feedback d-block ${styles.errorText}`}>{errors.announcementMessage}</div>
					)}
				</div>

				<CustomSelect
					id="announcementType"
					name="announcementType"
					value={form.announcementType}
					onChange={(e) => handleChange({ target: { name: 'announcementType', value: e.target.value } })}
					options={typeSelectOptions}
					placeholder={t('announcements.form.typePlaceholder')}
					ariaLabel={t('announcements.form.type')}
				/>

				<div className={styles.dateRow}>
					<div>
						<label className={`form-label ${styles.label}`}>{t('announcements.form.startDate')}</label>
						<DateTimePicker
							id="startsAt"
							name="startsAt"
							value={form.startsAt}
							onChange={handleChange}
							ariaLabel={t('announcements.form.startDate')}
							locale={i18n.language}
						/>
					</div>
					<div>
						<label className={`form-label ${styles.label}`}>{t('announcements.form.endDate')}</label>
						<DateTimePicker
							id="endsAt"
							name="endsAt"
							value={form.endsAt}
							onChange={handleChange}
							error={!!errors.endsAt}
							ariaLabel={t('announcements.form.endDate')}
							locale={i18n.language}
						/>
						{errors.endsAt && (
							<div className={`invalid-feedback d-block ${styles.errorText}`}>{errors.endsAt}</div>
						)}
					</div>
				</div>

				<div className="form-check">
					<input
						id="isGlobal"
						name="isGlobal"
						type="checkbox"
						className="form-check-input"
						checked={form.isGlobal}
						onChange={handleChange}
					/>
					<label htmlFor="isGlobal" className="form-check-label">
						{t('announcements.form.global')}
					</label>
				</div>

				{!form.isGlobal && (
					<div className={styles.targetSection}>
						<div>
							<label className={styles.label}>{t('announcements.form.targetRoles')}</label>
							<div className={styles.checkboxGroup}>
								{ROLE_OPTIONS.map(role => (
									<label key={role} className={styles.checkboxItem}>
										<input
											type="checkbox"
											checked={form.roleNames.includes(role)}
											onChange={() => handleRoleToggle(role)}
										/>
										{role}
									</label>
								))}
							</div>
						</div>

						{serviceLines.length > 0 && (
							<div>
								<div className={styles.slHeader}>
									<label className={styles.label}>{t('announcements.form.targetServiceLines')}</label>
									<button
										type="button"
										className={styles.selectAllBtn}
										onClick={handleSelectAllSl}
									>
										{allSlSelected ? t('announcements.form.deselectAll') : t('announcements.form.selectAll')}
									</button>
								</div>
								<div className={styles.checkboxGroup}>
									{serviceLines.map(sl => (
										<label key={sl.service_line_id} className={styles.checkboxItem}>
											<input
												type="checkbox"
												checked={form.serviceLineIds.includes(sl.service_line_id)}
												onChange={() => handleSlToggle(sl.service_line_id)}
											/>
											{sl.service_line_name}
										</label>
									))}
								</div>
							</div>
						)}

						{errors.target && (
							<div className={styles.errorText}>{errors.target}</div>
						)}
					</div>
				)}
			</form>
		</Modal>
	);
}
