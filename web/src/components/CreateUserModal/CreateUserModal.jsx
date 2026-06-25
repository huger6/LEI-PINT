/**
 * Admin modal form for creating a new platform user with role selection.
 * @param {Function} onClose - Called when the modal is dismissed.
 * @param {Function} onCreated - Called after successful user creation.
 */
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { useLanguageContext } from '../../context/LanguageContext';
import { createUser } from '../../features/users/api/usersApi';
import { extractCollection } from '../../utils/collections';
import { FALLBACK_PHONE_PREFIXES, normalizePhoneDigits, groupByThree } from '../../utils/phone';
import { getMinBirthdate } from '../../utils/date';
import { usePhoneMetadata } from '../../services/libphonenumber';
import { uploadProfileImageToTemp, PROFILE_IMAGE_MAX_FILE_SIZE_BYTES } from '../../services/storage';
import {
	validateCreateUserForm,
	validateUsername,
	validateEmail,
	hasErrors,
	resolveErrorMessage,
	extractFieldErrors,
	useFormValidation,
	useAvailability,
	AVAILABILITY_STATUS,
	isCheckPending,
	isCheckBlocking,
	fetchUsernameAvailability,
	fetchEmailAvailability,
	mergeError,
} from '../../validations';
import Modal from '../Modal/Modal';
import ConfirmToast from '../ConfirmToast/ConfirmToast';
import Button from '../Button/Button';
import FormInput from '../FormInput/FormInput';
import FormAlert from '../FormAlert/FormAlert';
import PasswordRules from '../PasswordRules/PasswordRules';
import PasswordToggle from '../PasswordToggle/PasswordToggle';
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

const STATUS_HINT_CLASS = 'small mt-1 mb-0';
const HINT_COLORS = {
	ok: { color: 'var(--color-success)' },
	muted: { color: 'var(--color-outline)' },
};

export default function CreateUserModal({ onClose, onCreated, serviceLines = [], allAreas = [] }) {
	const { t, i18n } = useTranslation();
	// Provides the list of available languages from context.
	const { languages } = useLanguageContext();

	// Tracks whether the form submission is in progress.
	const [saving, setSaving] = useState(false);
	// Holds the top-level API error message shown after a failed submission.
	const [apiError, setApiError] = useState('');
	// Holds field-specific error messages returned by the server.
	const [serverFieldErrors, setServerFieldErrors] = useState({});
	// Controls whether the password is visible as plain text.
	const [showPassword, setShowPassword] = useState(false);
	// Controls whether the advanced configuration section is expanded.
	const [showAdvanced, setShowAdvanced] = useState(false);
	// Controls whether the discard-changes confirmation toast is shown.
	const [showCloseConfirm, setShowCloseConfirm] = useState(false);
	// Ref that tracks whether any form field has been modified.
	const isDirty = useRef(false);

	// Holds the list of available location options fetched from the API.
	const [locations, setLocations] = useState([]);

	// Holds the selected phone country prefix (e.g. "+351").
	const [phonePrefix, setPhonePrefix] = useState('+351');
	// Holds the formatted local part of the phone number for display.
	const [phoneLocalDisplay, setPhoneLocalDisplay] = useState('');
	// Custom hook providing phone metadata and formatted prefix options.
	const { metadata: phoneMetadata, prefixOptions: phonePrefixOptions } = usePhoneMetadata();
	const phonePrefixes = phonePrefixOptions.length > 0 ? phonePrefixOptions : FALLBACK_PHONE_PREFIXES;

	// Holds the URL of the profile image preview (local blob or uploaded URL).
	const [profilePreviewUrl, setProfilePreviewUrl] = useState('');
	// Tracks whether a profile image upload is in progress.
	const [profileUploading, setProfileUploading] = useState(false);
	// Holds any profile image upload error message.
	const [profileError, setProfileError] = useState('');
	// Ref to the hidden profile image file input.
	const profileFileRef = useRef(null);

	// Memoized validator that incorporates phone metadata for phone validation.
	const validate = useCallback(
		(vals) => validateCreateUserForm(vals, vals.userRole, { phoneMetadata }),
		[phoneMetadata],
	);

	// Custom hook providing live field validation, touched tracking, and field setters.
	const form = useFormValidation({ initialValues: EMPTY_FORM, validate });
	const {
		values,
		setFieldValue,
		setFieldTouched,
		handleBlur,
		errors: liveErrors,
		isErrorVisible,
		markAllTouched,
		touched,
	} = form;

	const usernameSyncValid = !validateUsername(values.username);
	const emailSyncValid = !validateEmail(values.emailAddress);

	// Custom hook that debounces username availability checks against the API.
	const usernameCheck = useAvailability({
		value: values.username.trim(),
		isValid: usernameSyncValid,
		fetcher: fetchUsernameAvailability,
	});
	// Custom hook that debounces email availability checks against the API.
	const emailCheck = useAvailability({
		value: values.emailAddress.trim(),
		isValid: emailSyncValid,
		fetcher: fetchEmailAvailability,
	});

	const usernameAsyncError =
		usernameCheck.status === AVAILABILITY_STATUS.UNAVAILABLE
			? t('register.usernameInUse')
			: null;
	const emailAsyncError =
		emailCheck.status === AVAILABILITY_STATUS.UNAVAILABLE
			? t('register.emailInUse')
			: null;

	// Returns the merged error message for a field, preferring server errors over client ones.
	const fieldError = useCallback(
		(name, asyncError) => {
			if (serverFieldErrors[name]) return serverFieldErrors[name];
			const visible = isErrorVisible(name);
			const sync = visible ? liveErrors[name] : undefined;
			const async_ = (visible || touched[name]) ? asyncError : undefined;
			return mergeError(sync, async_);
		},
		[serverFieldErrors, isErrorVisible, liveErrors, touched],
	);

	// Handles any input change by delegating to the form handler and marking the form dirty.
	const onChange = (e) => {
		form.handleChange(e);
		isDirty.current = true;
		setServerFieldErrors((prev) => ({ ...prev, [e.target.name]: '' }));
		setApiError('');
	};

	// Fetches the list of available locations from the API on mount.
	useEffect(() => {
		api.get('/locations')
			.then((res) => setLocations(extractCollection(res)))
			.catch(() => setLocations([]));
	}, []);

	// Pre-selects the Portuguese language option when languages load and none is chosen.
	useEffect(() => {
		if (languages.length === 0 || values.languageId) return;
		const ptLang = languages.find((l) => {
			const name = (l.language_name ?? l.preferred_lang ?? l.name ?? '').toLowerCase();
			return name.includes('portugu') || name === 'pt';
		});
		if (ptLang) {
			const id = ptLang.language_id ?? ptLang.preferred_lang_id ?? ptLang.id;
			setFieldValue('languageId', String(id));
		}
	}, [languages]);

	// Derives the sorted list of language options for the select dropdown.
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

	// Derives the sorted list of location options for the select dropdown.
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

	// Derives the list of service line options for the SLL role select.
	const serviceLineOptions = useMemo(
		() => serviceLines.map((sl) => ({
			value: sl.service_line_id ?? sl.id,
			label: sl.service_line_name ?? sl.name ?? sl.label,
		})),
		[serviceLines],
	);

	// Normalizes the allAreas array into the shape expected by AreaPickerList.
	const areaOptions = useMemo(
		() => allAreas.map((a) => ({
			area_id: a.area_id ?? a.id,
			area_name: a.area_name ?? a.name ?? a.label,
			...a,
		})),
		[allAreas],
	);

	// Formats and stores the combined phone number from prefix and local digits.
	const applyPhoneValue = useCallback((prefix, rawLocalValue) => {
		const prefixDigitsCount = normalizePhoneDigits(prefix).length;
		const maxLocalDigits = Math.max(0, 15 - prefixDigitsCount);
		const localDigits = normalizePhoneDigits(rawLocalValue).slice(0, maxLocalDigits);
		setPhoneLocalDisplay(groupByThree(localDigits));
		isDirty.current = true;
		setFieldValue('phoneNumber', localDigits ? `${prefix}${localDigits}` : '');
	}, [setFieldValue]);

	// Uploads the selected profile image to temporary storage and updates the preview.
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
			setFieldValue('profileImgUrl', publicUrl);
		} catch {
			setProfileError(t('register.profilePictureUploadFailed'));
		} finally {
			setProfileUploading(false);
		}
	}, [t, setFieldValue]);

	// Clears the profile image preview and resets the file input.
	const clearProfileImage = () => {
		setProfilePreviewUrl('');
		setProfileError('');
		setFieldValue('profileImgUrl', '');
		if (profileFileRef.current) profileFileRef.current.value = '';
	};

	// Validates the form and submits the new user payload to the API.
	const handleSubmit = async (e) => {
		e.preventDefault();
		markAllTouched();

		if (hasErrors(liveErrors)) return;
		if (usernameAsyncError || emailAsyncError) return;
		if (
			isCheckBlocking(usernameCheck.status) ||
			isCheckBlocking(emailCheck.status)
		) return;
		if (profileUploading) {
			setApiError(t('register.profilePictureUploadInProgress'));
			return;
		}

		setApiError('');
		setSaving(true);

		try {
			const payload = {
				fullName: values.fullName,
				username: values.username.trim(),
				emailAddress: values.emailAddress.trim(),
				password: values.password,
				userRole: values.userRole,
				isActive: values.isActive,
				emailConfirmed: values.emailConfirmed,
			};

			if (values.languageId) payload.languageId = Number(values.languageId);
			if (values.userRole === 'Service Line Leader' && values.serviceLine)
				payload.serviceLineId = Number(values.serviceLine);
			if (values.userRole === 'Consultant' && values.areas.length > 0)
				payload.areas = values.areas;
			if (values.phoneNumber) payload.phoneNumber = values.phoneNumber.replace(/\s+/g, '');
			if (values.birthdate) payload.birthdate = values.birthdate;
			if (values.biography) payload.biography = values.biography.trim();
			if (values.locationId) payload.locationId = Number(values.locationId);
			if (values.profileImgUrl) payload.profileImgUrl = values.profileImgUrl;

			const created = await createUser(payload);
			onCreated(created);
			onClose();
		} catch (err) {
			const backendFields = extractFieldErrors(err);
			if (Object.keys(backendFields).length) {
				setServerFieldErrors((prev) => ({ ...prev, ...backendFields }));
			}
			setApiError(resolveErrorMessage(err));
		} finally {
			setSaving(false);
		}
	};

	// Shows a discard-changes confirmation if the form is dirty, otherwise closes immediately.
	const handleClose = () => {
		if (isDirty.current) {
			setShowCloseConfirm(true);
		} else {
			onClose();
		}
	};

	const usernameError = fieldError('username', usernameAsyncError);
	const emailError = fieldError('emailAddress', emailAsyncError);
	const phoneError = fieldError('phone_number');
	const birthdateError = fieldError('birthdate');

	// Renders an availability hint below the username field when no error is shown.
	const renderUsernameHint = () => {
		if (usernameError) return null;
		if (!values.username || !usernameSyncValid) return null;
		if (usernameCheck.status === AVAILABILITY_STATUS.CHECKING)
			return <p className={STATUS_HINT_CLASS} style={HINT_COLORS.muted}>{t('register.checkingAvailability')}</p>;
		if (usernameCheck.status === AVAILABILITY_STATUS.AVAILABLE)
			return <p className={STATUS_HINT_CLASS} style={HINT_COLORS.ok}>{t('register.usernameAvailable')}</p>;
		return null;
	};

	// Renders an availability hint below the email field when no error is shown.
	const renderEmailHint = () => {
		if (emailError) return null;
		if (!values.emailAddress || !emailSyncValid) return null;
		if (emailCheck.status === AVAILABILITY_STATUS.CHECKING)
			return <p className={STATUS_HINT_CLASS} style={HINT_COLORS.muted}>{t('register.checkingAvailability')}</p>;
		if (emailCheck.status === AVAILABILITY_STATUS.AVAILABLE)
			return <p className={STATUS_HINT_CLASS} style={HINT_COLORS.ok}>{t('register.emailAvailable')}</p>;
		return null;
	};

	const submitDisabled = saving ||
		isCheckPending(usernameCheck.status) ||
		isCheckPending(emailCheck.status) ||
		profileUploading;

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
					<Button loading={saving} disabled={submitDisabled} onClick={handleSubmit}>
						{t('shared.create')}
					</Button>
				</>
			}
		>
			<form id="create-user-form" onSubmit={handleSubmit} className={styles.form} noValidate>
				{/* ── Primary fields ──────────────────────────────────────── */}
				<div className={styles.grid}>
					<FormInput
						label={t('adminUsers.fullName')}
						name="fullName"
						value={values.fullName}
						onChange={onChange}
						onBlur={handleBlur}
						error={fieldError('fullName')}
						required
					/>
					<div>
						<FormInput
							label={t('shared.username')}
							name="username"
							value={values.username}
							onChange={onChange}
							onBlur={handleBlur}
							error={usernameError}
							required
						/>
						{renderUsernameHint()}
					</div>
				</div>

				<div className={styles.grid}>
					<div>
						<FormInput
							label={t('shared.email')}
							name="emailAddress"
							type="email"
							value={values.emailAddress}
							onChange={onChange}
							onBlur={handleBlur}
							error={emailError}
							required
						/>
						{renderEmailHint()}
					</div>
					<FormInput
						label={t('shared.password')}
						name="password"
						type={showPassword ? 'text' : 'password'}
						value={values.password}
						onChange={onChange}
						onBlur={handleBlur}
						error={fieldError('password')}
						required
						trailing={<PasswordToggle show={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
					/>
				</div>

				<PasswordRules password={values.password} />

				<div className={styles.grid}>
					<div>
						<label htmlFor="cu_role" className={styles.fieldLabel}>{t('shared.role')}<span className={styles.required}> *</span></label>
						<CustomSelect
							id="cu_role"
							name="userRole"
							value={values.userRole}
							onChange={onChange}
							options={ROLES.map((r) => ({ value: r, label: t(`roles.${r}`) }))}
						/>
					</div>

					<div>
						<label htmlFor="cu_lang" className={styles.fieldLabel}>{t('register.preferredLanguage')}</label>
						<CustomSelect
							id="cu_lang"
							name="languageId"
							value={values.languageId}
							onChange={onChange}
							options={languageOptions}
							placeholder={languageOptions.length === 0 ? t('register.noLanguagesAvailable') : t('register.selectLanguage')}
							disabled={languageOptions.length === 0}
						/>
					</div>
				</div>

				{/* ── Role-specific fields ────────────────────────────────── */}
				{values.userRole === 'Service Line Leader' && (
					<div>
						<label htmlFor="cu_sl" className={styles.fieldLabel}>{t('shared.serviceLine')}</label>
						<CustomSelect
							id="cu_sl"
							name="serviceLine"
							value={values.serviceLine}
							onChange={onChange}
							options={serviceLineOptions}
							placeholder={t('adminUsers.selectServiceLine')}
						/>
					</div>
				)}

				{values.userRole === 'Consultant' && (
					<div>
						<label className={styles.fieldLabel}>{t('register.areasOfExpertise')}</label>
						<AreaPickerList
							areas={areaOptions}
							selected={values.areas}
							onChange={(areas) => {
								isDirty.current = true;
								setFieldTouched('areas', true);
								setFieldValue('areas', areas);
							}}
							error={fieldError('areas')}
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
						aria-checked={values.isActive}
						className={`${styles.toggle} ${values.isActive ? styles.toggleOn : ''}`}
						onClick={() => { isDirty.current = true; setFieldValue('isActive', !values.isActive); }}
					>
						<span className={styles.toggleKnob} />
					</button>
					<span className={styles.toggleState}>
						{values.isActive ? t('shared.active') : t('shared.inactive')}
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
								aria-checked={values.emailConfirmed}
								className={`${styles.toggle} ${values.emailConfirmed ? styles.toggleOn : ''}`}
								onClick={() => { isDirty.current = true; setFieldValue('emailConfirmed', !values.emailConfirmed); }}
							>
								<span className={styles.toggleKnob} />
							</button>
							<span className={styles.toggleState}>
								{values.emailConfirmed ? t('shared.yes') : t('shared.no')}
							</span>
						</div>

						<div>
							<label htmlFor="cu_phone_local" className={styles.fieldLabel}>{t('register.phoneNumber')}</label>
							<div className={styles.phoneRow}>
								<CustomSelect
									id="cu_phone_prefix"
									value={phonePrefix}
									onChange={(e) => {
										const nextPrefix = e.target.value;
										setPhonePrefix(nextPrefix);
										applyPhoneValue(nextPrefix, phoneLocalDisplay);
									}}
									onBlur={() => setFieldTouched('phone_number', true)}
									options={phonePrefixes}
									error={!!phoneError}
									ariaLabel={t('register.countryPhonePrefix')}
								/>
								<input
									id="cu_phone_local"
									type="tel"
									inputMode="numeric"
									value={phoneLocalDisplay}
									onChange={(e) => applyPhoneValue(phonePrefix, e.target.value)}
									onBlur={() => setFieldTouched('phone_number', true)}
									className={`form-control ${styles.phoneInput} ${phoneError ? 'is-invalid' : ''}`}
									placeholder={t('register.phoneNumberPlaceholder')}
								/>
							</div>
							{phoneError && (
								<div className="invalid-feedback d-block">{phoneError}</div>
							)}
						</div>

						<div>
							<label htmlFor="cu_birthdate" className={styles.fieldLabel}>{t('register.dateOfBirth')}</label>
							<DatePicker
								id="cu_birthdate"
								name="birthdate"
								value={values.birthdate}
								onChange={onChange}
								onBlur={handleBlur}
								max={getMinBirthdate()}
								error={!!birthdateError}
								ariaLabel={t('register.dateOfBirth')}
								locale={i18n.language}
								placeholder="DD-MM-YYYY"
							/>
							{birthdateError && (
								<div className="invalid-feedback d-block">{birthdateError}</div>
							)}
						</div>

						<div>
							<label htmlFor="cu_location" className={styles.fieldLabel}>{t('register.location')}</label>
							<CustomSelect
								id="cu_location"
								name="locationId"
								value={values.locationId}
								onChange={onChange}
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
								value={values.biography}
								onChange={onChange}
								onBlur={handleBlur}
								rows={3}
								placeholder={t('register.biographyPlaceholder')}
								className={`form-control ${styles.textarea} ${fieldError('biography') ? 'is-invalid' : ''}`}
								maxLength={5000}
							/>
							{fieldError('biography') && (
								<div className="invalid-feedback d-block">{fieldError('biography')}</div>
							)}
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

				<FormAlert message={apiError} />
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
