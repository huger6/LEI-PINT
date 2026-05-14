import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { createUser } from '../../features/users/api/usersApi';
import { extractCollection } from '../../utils/collections';
import { FALLBACK_PHONE_PREFIXES, normalizePhoneDigits, groupByThree } from '../../utils/phone';
import { getMinBirthdate } from '../../utils/date';
import { usePhoneMetadata } from '../../services/libphonenumber';
import { uploadProfileImageToTemp, PROFILE_IMAGE_MAX_FILE_SIZE_BYTES } from '../../services/storage';
import Modal from '../Modal/Modal';
import ConfirmToast from '../ConfirmToast/ConfirmToast';
import Button from '../Button/Button';
import FormInput from '../FormInput/FormInput';
import CustomSelect from '../CustomSelect/CustomSelect';
import DatePicker from '../DatePicker/DatePicker';
import AreaPickerList from '../AreaPickerList/AreaPickerList';
import Icon from '../Icons/Icons';
import styles from './CreateUserModal.module.css';

const ROLES = ['Administrator', 'Consultant', 'Talent Manager', 'Service Line Leader'];

const EMPTY_FORM = {
	fullName: '',
	username: '',
	emailAddress: '',
	password: '',
	userRole: 'Consultant',
	isActive: true,
	emailConfirmed: false,
	languageId: '',
	serviceLine: '',
	areas: [],
	phoneNumber: '',
	birthdate: '',
	biography: '',
	locationId: '',
	profileImgUrl: '',
};

export default function CreateUserModal({ onClose, onCreated, serviceLines = [], allAreas = [] }) {
	const { t, i18n } = useTranslation();

	const [form, setForm] = useState(EMPTY_FORM);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');
	const [showAdvanced, setShowAdvanced] = useState(false);
	const [showCloseConfirm, setShowCloseConfirm] = useState(false);
	const isDirty = useRef(false);

	const [languages, setLanguages] = useState([]);
	const [locations, setLocations] = useState([]);

	const [phonePrefix, setPhonePrefix] = useState('+351');
	const [phoneLocalDisplay, setPhoneLocalDisplay] = useState('');
	const { prefixOptions: phonePrefixOptions } = usePhoneMetadata();
	const phonePrefixes = phonePrefixOptions.length > 0 ? phonePrefixOptions : FALLBACK_PHONE_PREFIXES;

	const [profilePreviewUrl, setProfilePreviewUrl] = useState('');
	const [profileUploading, setProfileUploading] = useState(false);
	const [profileError, setProfileError] = useState('');
	const profileFileRef = useRef(null);

	useEffect(() => {
		Promise.all([
			api.get('/languages').catch(() => ({ data: { data: [] } })),
			api.get('/locations').catch(() => ({ data: { data: [] } })),
		]).then(([langRes, locRes]) => {
			const langs = extractCollection(langRes);
			setLanguages(langs);
			setLocations(extractCollection(locRes));

			if (!form.languageId && langs.length > 0) {
				const ptLang = langs.find((l) => {
					const name = (l.language_name ?? l.preferred_lang ?? l.name ?? '').toLowerCase();
					return name.includes('portugu') || name === 'pt';
				});
				if (ptLang) {
					const id = ptLang.language_id ?? ptLang.preferred_lang_id ?? ptLang.id;
					setForm((prev) => ({ ...prev, languageId: String(id) }));
				}
			}
		});
	}, []);

	const languageOptions = useMemo(
		() => languages
			.map((l) => {
				const id = Number(l.language_id ?? l.preferred_lang_id ?? l.id);
				const name = l.language_name ?? l.preferred_lang ?? l.name ?? l.label;
				return Number.isInteger(id) && id > 0 && name ? { value: id, label: String(name) } : null;
			})
			.filter(Boolean),
		[languages],
	);

	const locationOptions = useMemo(
		() => locations
			.map((l) => {
				const id = Number(l.location_id ?? l.id);
				const name = l.location_name ?? l.name ?? l.label;
				return Number.isInteger(id) && id > 0 && name ? { value: id, label: String(name) } : null;
			})
			.filter(Boolean),
		[locations],
	);

	const serviceLineOptions = useMemo(
		() => serviceLines.map((sl) => ({
			value: sl.service_line_id ?? sl.id,
			label: sl.service_line_name ?? sl.name ?? sl.label,
		})),
		[serviceLines],
	);

	const areaOptions = useMemo(
		() => allAreas.map((a) => ({
			area_id: a.area_id ?? a.id,
			area_name: a.area_name ?? a.name ?? a.label,
			...a,
		})),
		[allAreas],
	);

	const handleChange = (e) => {
		const { name, value, type, checked } = e.target;
		isDirty.current = true;
		setError('');
		setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
	};

	const applyPhoneValue = useCallback((prefix, rawLocalValue) => {
		const prefixDigitsCount = normalizePhoneDigits(prefix).length;
		const maxLocalDigits = Math.max(0, 15 - prefixDigitsCount);
		const localDigits = normalizePhoneDigits(rawLocalValue).slice(0, maxLocalDigits);
		setPhoneLocalDisplay(groupByThree(localDigits));
		isDirty.current = true;
		setForm((prev) => ({ ...prev, phoneNumber: localDigits ? `${prefix}${localDigits}` : '' }));
	}, []);

	const onProfileImageChange = useCallback(async (event) => {
		const file = event.target.files?.[0];
		event.target.value = '';
		if (!file) return;

		setProfileError('');
		setProfileUploading(true);
		isDirty.current = true;

		const localUrl = URL.createObjectURL(file);
		setProfilePreviewUrl(localUrl);

		try {
			const { publicUrl } = await uploadProfileImageToTemp(file);
			URL.revokeObjectURL(localUrl);
			setProfilePreviewUrl(publicUrl);
			setForm((prev) => ({ ...prev, profileImgUrl: publicUrl }));
		} catch {
			setProfileError(t('register.profilePictureUploadFailed'));
		} finally {
			setProfileUploading(false);
		}
	}, [t]);

	const clearProfileImage = () => {
		setProfilePreviewUrl('');
		setProfileError('');
		setForm((prev) => ({ ...prev, profileImgUrl: '' }));
		if (profileFileRef.current) profileFileRef.current.value = '';
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		setSaving(true);

		try {
			const payload = {
				fullName: form.fullName,
				username: form.username,
				emailAddress: form.emailAddress,
				password: form.password,
				userRole: form.userRole,
				isActive: form.isActive,
				emailConfirmed: form.emailConfirmed,
			};

			if (form.languageId) payload.languageId = Number(form.languageId);
			if (form.userRole === 'Service Line Leader' && form.serviceLine)
				payload.serviceLineId = Number(form.serviceLine);
			if (form.userRole === 'Consultant' && form.areas.length > 0)
				payload.areas = form.areas;
			if (form.phoneNumber) payload.phoneNumber = form.phoneNumber.replace(/\s+/g, '');
			if (form.birthdate) payload.birthdate = form.birthdate;
			if (form.biography) payload.biography = form.biography.trim();
			if (form.locationId) payload.locationId = Number(form.locationId);
			if (form.profileImgUrl) payload.profileImgUrl = form.profileImgUrl;

			const created = await createUser(payload);
			onCreated(created);
			onClose();
		} catch (err) {
			const msg = err?.response?.data?.message || err?.message || t('shared.error');
			setError(msg);
		} finally {
			setSaving(false);
		}
	};

	const handleClose = () => {
		if (isDirty.current) {
			setShowCloseConfirm(true);
		} else {
			onClose();
		}
	};

	return (
		<Modal
			title={t('adminUsers.createUser')}
			onClose={handleClose}
			size="lg"
			footer={
				<>
					<Button variant="outlined" onClick={handleClose}>
						{t('shared.cancel')}
					</Button>
					<Button loading={saving} onClick={handleSubmit}>
						{t('shared.create')}
					</Button>
				</>
			}
		>
			<form id="create-user-form" onSubmit={handleSubmit} className={styles.form}>
				{/* ── Primary fields ──────────────────────────────────────── */}
				<div className={styles.grid}>
					<FormInput
						label={t('adminUsers.fullName')}
						name="fullName"
						value={form.fullName}
						onChange={handleChange}
						required
					/>
					<FormInput
						label={t('shared.username')}
						name="username"
						value={form.username}
						onChange={handleChange}
						required
					/>
				</div>

				<div className={styles.grid}>
					<FormInput
						label={t('shared.email')}
						name="emailAddress"
						type="email"
						value={form.emailAddress}
						onChange={handleChange}
						required
					/>
					<FormInput
						label={t('shared.password')}
						name="password"
						type="password"
						value={form.password}
						onChange={handleChange}
						required
					/>
				</div>

				<div className={styles.grid}>
					<div>
						<label htmlFor="cu_role" className={styles.fieldLabel}>{t('shared.role')}</label>
						<CustomSelect
							id="cu_role"
							name="userRole"
							value={form.userRole}
							onChange={handleChange}
							options={ROLES.map((r) => ({ value: r, label: t(`roles.${r}`) }))}
						/>
					</div>

					<div>
						<label htmlFor="cu_lang" className={styles.fieldLabel}>{t('register.preferredLanguage')}</label>
						<CustomSelect
							id="cu_lang"
							name="languageId"
							value={form.languageId}
							onChange={handleChange}
							options={languageOptions}
							placeholder={languageOptions.length === 0 ? t('register.noLanguagesAvailable') : t('register.selectLanguage')}
							disabled={languageOptions.length === 0}
						/>
					</div>
				</div>

				{/* ── Role-specific fields ────────────────────────────────── */}
				{form.userRole === 'Service Line Leader' && (
					<div>
						<label htmlFor="cu_sl" className={styles.fieldLabel}>{t('shared.serviceLine')}</label>
						<CustomSelect
							id="cu_sl"
							name="serviceLine"
							value={form.serviceLine}
							onChange={handleChange}
							options={serviceLineOptions}
							placeholder={t('adminUsers.selectServiceLine')}
						/>
					</div>
				)}

				{form.userRole === 'Consultant' && (
					<div>
						<label className={styles.fieldLabel}>{t('register.areasOfExpertise')}</label>
						<AreaPickerList
							areas={areaOptions}
							selected={form.areas}
							onChange={(areas) => { isDirty.current = true; setForm((prev) => ({ ...prev, areas })); }}
						/>
					</div>
				)}

				{/* ── Active toggle ────────────────────────────────────────── */}
				<div className={styles.toggleRow}>
					<label className={styles.toggleLabel} htmlFor="cu_active">
						{t('shared.active')}
					</label>
					<button
						type="button"
						id="cu_active"
						role="switch"
						aria-checked={form.isActive}
						className={`${styles.toggle} ${form.isActive ? styles.toggleOn : ''}`}
						onClick={() => { isDirty.current = true; setForm((prev) => ({ ...prev, isActive: !prev.isActive })); }}
					>
						<span className={styles.toggleKnob} />
					</button>
					<span className={styles.toggleState}>
						{form.isActive ? t('shared.active') : t('shared.inactive')}
					</span>
				</div>

				{/* ── Advanced config ──────────────────────────────────────── */}
				<button
					type="button"
					className={styles.advancedToggle}
					onClick={() => setShowAdvanced((v) => !v)}
					aria-expanded={showAdvanced}
				>
					<Icon
						name="settings"
						size={14}
						aria-hidden="true"
						className={styles.advancedIcon}
					/>
					{t('adminUsers.advancedConfig')}
					<span className={`${styles.advancedChevron} ${showAdvanced ? styles.advancedChevronOpen : ''}`} />
				</button>

				{showAdvanced && (
					<div className={styles.advancedSection}>
						<div className={styles.toggleRow}>
							<label className={styles.toggleLabel} htmlFor="cu_email_confirmed">
								{t('adminUsers.autoConfirmEmail')}
							</label>
							<button
								type="button"
								id="cu_email_confirmed"
								role="switch"
								aria-checked={form.emailConfirmed}
								className={`${styles.toggle} ${form.emailConfirmed ? styles.toggleOn : ''}`}
								onClick={() => { isDirty.current = true; setForm((prev) => ({ ...prev, emailConfirmed: !prev.emailConfirmed })); }}
							>
								<span className={styles.toggleKnob} />
							</button>
							<span className={styles.toggleState}>
								{form.emailConfirmed ? t('shared.yes') : t('shared.no')}
							</span>
						</div>

						<div>
							<label htmlFor="cu_phone_local" className={styles.fieldLabel}>{t('register.phoneNumber')}</label>
							<div className={styles.phoneRow}>
								<CustomSelect
									id="cu_phone_prefix"
									value={phonePrefix}
									onChange={(e) => { setPhonePrefix(e.target.value); applyPhoneValue(e.target.value, phoneLocalDisplay); }}
									options={phonePrefixes}
									ariaLabel={t('register.countryPhonePrefix')}
								/>
								<input
									id="cu_phone_local"
									type="tel"
									inputMode="numeric"
									value={phoneLocalDisplay}
									onChange={(e) => applyPhoneValue(phonePrefix, e.target.value)}
									className={`form-control ${styles.phoneInput}`}
									placeholder={t('register.phoneNumberPlaceholder')}
								/>
							</div>
						</div>

						<div>
							<label htmlFor="cu_birthdate" className={styles.fieldLabel}>{t('register.dateOfBirth')}</label>
							<DatePicker
								id="cu_birthdate"
								name="birthdate"
								value={form.birthdate}
								onChange={handleChange}
								max={getMinBirthdate()}
								ariaLabel={t('register.dateOfBirth')}
								locale={i18n.language}
								placeholder="DD-MM-YYYY"
							/>
						</div>

						<div>
							<label htmlFor="cu_location" className={styles.fieldLabel}>{t('register.location')}</label>
							<CustomSelect
								id="cu_location"
								name="locationId"
								value={form.locationId}
								onChange={handleChange}
								options={locationOptions}
								placeholder={locationOptions.length === 0 ? t('register.noLocationsAvailable') : t('register.selectLocation')}
								disabled={locationOptions.length === 0}
							/>
						</div>

						<div>
							<label htmlFor="cu_biography" className={styles.fieldLabel}>{t('register.biography')}</label>
							<textarea
								id="cu_biography"
								name="biography"
								value={form.biography}
								onChange={handleChange}
								rows={3}
								placeholder={t('register.biographyPlaceholder')}
								className={`form-control ${styles.textarea}`}
								maxLength={5000}
							/>
						</div>

						<div>
							<label htmlFor="cu_profile_img" className={styles.fieldLabel}>{t('register.profilePicture')}</label>
							<input
								ref={profileFileRef}
								id="cu_profile_img"
								type="file"
								className={styles.hiddenInput}
								accept="image/jpeg,image/png,image/webp,image/gif"
								onChange={onProfileImageChange}
							/>
							{profilePreviewUrl ? (
								<div className={styles.profilePreviewWrapper}>
									<img src={profilePreviewUrl} alt={t('register.profilePicturePreviewAlt')} className={styles.profilePreview} />
									<div className={styles.profileActions}>
										<Button type="button" variant="outlined" size="sm" onClick={() => profileFileRef.current?.click()} disabled={profileUploading}>
											{t('register.profilePictureChange')}
										</Button>
										<Button type="button" variant="outlined" size="sm" color="danger" onClick={clearProfileImage} disabled={profileUploading}>
											<Icon name="trash" size={12} aria-hidden="true" className="me-1" />
											{t('register.profilePictureRemove')}
										</Button>
									</div>
								</div>
							) : (
								<button
									type="button"
									className={styles.profilePicker}
									onClick={() => profileFileRef.current?.click()}
									disabled={profileUploading}
								>
									<Icon name="photo" size={20} color="currentColor" fill="currentColor" stroke="none" aria-hidden="true" />
									<span>{t('register.profilePictureChoose')}</span>
								</button>
							)}
							{profileUploading && <p className={styles.hint}>{t('register.profilePictureUploading')}</p>}
							{profileError && <div className={styles.fieldError}>{profileError}</div>}
							<p className={styles.hint}>
								{t('register.profilePictureHint', { sizeMb: PROFILE_IMAGE_MAX_FILE_SIZE_BYTES / (1024 * 1024) })}
							</p>
						</div>
					</div>
				)}

				{error && <div className={styles.formError}>{error}</div>}
			</form>

			<ConfirmToast
				open={showCloseConfirm}
				message={t('shared.confirmDiscardChanges')}
				confirmLabel={t('shared.yes')}
				cancelLabel={t('shared.no')}
				onConfirm={onClose}
				onCancel={() => setShowCloseConfirm(false)}
			/>
		</Modal>
	);
}
