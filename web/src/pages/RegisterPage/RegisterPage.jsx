import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import { AuthCard, register } from '../../features/auth';
import api from '../../services/api.js';
import FormInput from '../../components/FormInput/FormInput';
import FormButton from '../../components/FormButton/FormButton';
import CustomSelect from '../../components/CustomSelect/CustomSelect';
import DatePicker from '../../components/DatePicker/DatePicker';
import PasswordRules from '../../components/PasswordRules/PasswordRules';
import PasswordToggle from '../../components/PasswordToggle/PasswordToggle';
import FormAlert from '../../components/FormAlert/FormAlert';
import { capitalizeName } from '../../utils/utils';
import { FALLBACK_PHONE_PREFIXES, normalizePhoneDigits, groupByThree } from '../../utils/phone';
import { getMinBirthdate } from '../../utils/date';
import { extractCollection } from '../../utils/collections';
import { uploadProfileImageToTemp, PROFILE_IMAGE_MAX_FILE_SIZE_BYTES } from '../../services/storage';
import styles from './RegisterPage.module.css';
import {
	validateRegisterStep2,
	validateRegisterStep3,
	validateUsername,
	validateEmail,
	validateBiography,
	hasErrors,
	resolveErrorMessage,
	extractFieldErrors,
	isCode,
	useFormValidation,
	useAvailability,
	AVAILABILITY_STATUS,
	isCheckPending,
	isCheckBlocking,
	fetchUsernameAvailability,
	fetchEmailAvailability,
	fetchBiographyValidity,
	mergeError,
} from '../../validations';
import { usePhoneMetadata } from '../../services/libphonenumber';

const ROLE_KEYS = ['Consultant', 'Talent Manager', 'Service Line Leader'];

const INITIAL_FORM = {
	full_name: '',
	username: '',
	email_address: '',
	password: '',
	phone_number: '',
	birthdate: '',
	biography: '',
	language_id: '',
	location_id: '',
	areas: [],
	service_line_id: '',
	profile_img_url: '',
};

const PROFILE_UPLOAD_STATUS = {
	IDLE: 'idle',
	UPLOADING: 'uploading',
	UPLOADED: 'uploaded',
	FAILED: 'failed',
};

const STATUS_HINT_CLASS = 'small mt-1 mb-0';
const HINT_COLORS = {
	ok: { color: 'var(--color-success)' },
	bad: { color: 'var(--color-on-error-container)' },
	muted: { color: 'var(--color-outline)' },
};

export default function RegisterPage() {
	const { t, i18n } = useTranslation();
	const [step, setStep] = useState(1);
	const [role, setRole] = useState('');
	const [serverFieldErrors, setServerFieldErrors] = useState({});
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [apiError, setApiError] = useState('');
	const [apiInfo, setApiInfo] = useState('');
	const [success, setSuccess] = useState(false);

	const [languages, setLanguages] = useState([]);
	const [locations, setLocations] = useState([]);
	const [areasList, setAreasList] = useState([]);
	const [refLoading, setRefLoading] = useState(false);
	const [phonePrefix, setPhonePrefix] = useState('+351');
	const [phoneLocalDisplay, setPhoneLocalDisplay] = useState('');
	const [profileUploadStatus, setProfileUploadStatus] = useState(PROFILE_UPLOAD_STATUS.IDLE);
	const [profileUploadError, setProfileUploadError] = useState('');
	const [profileUploadFileName, setProfileUploadFileName] = useState('');
	const [profilePreviewUrl, setProfilePreviewUrl] = useState('');
	const [profilePreviewObjectUrl, setProfilePreviewObjectUrl] = useState('');
	const profileFileInputRef = useRef(null);

	const { metadata: phoneMetadata, prefixOptions: phonePrefixOptions } = usePhoneMetadata();
	const phonePrefixes = phonePrefixOptions.length > 0 ? phonePrefixOptions : FALLBACK_PHONE_PREFIXES;

	const validate = useCallback(
		(vals) => ({
			...validateRegisterStep2(vals),
			...validateRegisterStep3(vals, role, { phoneMetadata }),
		}),
		[role, phoneMetadata]
	);

	const form = useFormValidation({ initialValues: INITIAL_FORM, validate });
	const {
		values,
		setFieldValue,
		setFieldTouched,
		handleBlur,
		handleChange,
		touched,
		submitAttempted,
		errors: liveErrors,
		isErrorVisible,
		markAllTouched,
	} = form;

	const usernameSyncValid = !validateUsername(values.username);
	const emailSyncValid = !validateEmail(values.email_address);
	const biographySyncValid = !validateBiography(values.biography);

	const usernameCheck = useAvailability({
		value: values.username.trim(),
		isValid: usernameSyncValid,
		fetcher: fetchUsernameAvailability,
	});
	const emailCheck = useAvailability({
		value: values.email_address.trim(),
		isValid: emailSyncValid,
		fetcher: fetchEmailAvailability,
	});
	const biographyCheck = useAvailability({
		value: values.biography,
		isValid: biographySyncValid && Boolean(values.biography),
		enabled: Boolean(values.biography),
		fetcher: fetchBiographyValidity,
	});

	const usernameAsyncError =
		usernameCheck.status === AVAILABILITY_STATUS.UNAVAILABLE
			? t('register.usernameInUse')
			: null;
	const emailAsyncError =
		emailCheck.status === AVAILABILITY_STATUS.UNAVAILABLE
			? t('register.emailInUse')
			: null;
	const biographyAsyncError =
		biographyCheck.status === AVAILABILITY_STATUS.UNAVAILABLE
			? biographyCheck.result?.errors?.[0] || t('register.biographyNotAllowed')
			: null;

	const fieldError = useCallback(
		(name, asyncError) => {
			if (serverFieldErrors[name]) return serverFieldErrors[name];
			const visible = isErrorVisible(name);
			const sync = visible ? liveErrors[name] : undefined;
			const async_ = (visible || touched[name]) ? asyncError : undefined;
			return mergeError(sync, async_);
		},
		[serverFieldErrors, isErrorVisible, liveErrors, touched]
	);

	const onChange = (e) => {
		handleChange(e);
		setServerFieldErrors((prev) => ({ ...prev, [e.target.name]: '' }));
		setApiError('');
		setApiInfo('');
	};

	const clearFeedbackFor = useCallback((field) => {
		setServerFieldErrors((prev) => ({ ...prev, [field]: '' }));
		setApiError('');
		setApiInfo('');
	}, []);

	const resolveProfileUploadError = useCallback((error) => {
		const sizeMb = PROFILE_IMAGE_MAX_FILE_SIZE_BYTES / (1024 * 1024);
		switch (error?.code) {
		case 'PROFILE_IMAGE_INVALID_FORMAT':
			return t('validation.profileImageInvalidFormat');
		case 'PROFILE_IMAGE_TOO_LARGE':
			return t('validation.profileImageTooLarge', { sizeMb });
		case 'SUPABASE_UPLOAD_FAILED':
		case 'SUPABASE_CONFIG_MISSING':
		default:
			return t('register.profilePictureUploadFailed');
		}
	}, [t]);

	useEffect(() => () => {
		if (profilePreviewObjectUrl) {
			URL.revokeObjectURL(profilePreviewObjectUrl);
		}
	}, [profilePreviewObjectUrl]);

	const clearProfileImage = useCallback(() => {
		if (profilePreviewObjectUrl) {
			URL.revokeObjectURL(profilePreviewObjectUrl);
		}
		setProfilePreviewObjectUrl('');
		setProfilePreviewUrl('');
		setProfileUploadError('');
		setProfileUploadFileName('');
		setProfileUploadStatus(PROFILE_UPLOAD_STATUS.IDLE);
		setFieldTouched('profile_img_url', true);
		setFieldValue('profile_img_url', '');
		clearFeedbackFor('profile_img_url');
		if (profileFileInputRef.current) profileFileInputRef.current.value = '';
	}, [clearFeedbackFor, profilePreviewObjectUrl, setFieldTouched, setFieldValue]);

	const openProfileImagePicker = useCallback(() => {
		profileFileInputRef.current?.click();
	}, []);

	const onProfileImageChange = useCallback(async (event) => {
		const file = event.target.files?.[0];
		event.target.value = '';
		if (!file) return;

		if (profilePreviewObjectUrl) {
			URL.revokeObjectURL(profilePreviewObjectUrl);
		}
		const localPreviewUrl = URL.createObjectURL(file);
		setProfilePreviewObjectUrl(localPreviewUrl);
		setProfilePreviewUrl(localPreviewUrl);

		clearFeedbackFor('profile_img_url');
		setFieldTouched('profile_img_url', true);
		setFieldValue('profile_img_url', '');
		setProfileUploadError('');
		setProfileUploadFileName(file.name);
		setProfileUploadStatus(PROFILE_UPLOAD_STATUS.UPLOADING);

		try {
			const { publicUrl } = await uploadProfileImageToTemp(file);
			setFieldValue('profile_img_url', publicUrl);
			setProfilePreviewUrl(publicUrl);
			URL.revokeObjectURL(localPreviewUrl);
			setProfilePreviewObjectUrl('');
			setProfileUploadStatus(PROFILE_UPLOAD_STATUS.UPLOADED);
		} catch (error) {
			setProfileUploadStatus(PROFILE_UPLOAD_STATUS.FAILED);
			setProfileUploadError(resolveProfileUploadError(error));
		}
	}, [clearFeedbackFor, profilePreviewObjectUrl, resolveProfileUploadError, setFieldTouched, setFieldValue]);

	const applyPhoneValue = useCallback((prefix, rawLocalValue) => {
		const prefixDigitsCount = normalizePhoneDigits(prefix).length;
		const maxLocalDigits = Math.max(0, 15 - prefixDigitsCount);
		const localDigits = normalizePhoneDigits(rawLocalValue).slice(0, maxLocalDigits);

		setPhoneLocalDisplay(groupByThree(localDigits));
		setFieldValue('phone_number', localDigits ? `${prefix}${localDigits}` : '');
	}, [setFieldValue]);

	const onPhonePrefixChange = useCallback((e) => {
		const nextPrefix = e.target.value;
		setPhonePrefix(nextPrefix);
		applyPhoneValue(nextPrefix, phoneLocalDisplay);
		clearFeedbackFor('phone_number');
	}, [applyPhoneValue, clearFeedbackFor, phoneLocalDisplay]);

	const onPhoneNumberChange = useCallback((e) => {
		applyPhoneValue(phonePrefix, e.target.value);
		clearFeedbackFor('phone_number');
	}, [applyPhoneValue, clearFeedbackFor, phonePrefix]);

	useEffect(() => {
		if (step !== 3) return;

		Promise.all([
			api.get('/languages').catch(() => ({ data: { data: [] } })),
			api.get('/locations').catch(() => ({ data: { data: [] } })),
			role === 'Consultant'
				? api.get('/areas').catch(() => ({ data: { data: [] } }))
				: Promise.resolve({ data: { data: [] } }),
		])
			.then(([langRes, locRes, areaRes]) => {
				setLanguages(extractCollection(langRes));
				setLocations(extractCollection(locRes));
				setAreasList(extractCollection(areaRes));
			})
			.finally(() => setRefLoading(false));
	}, [step, role]);

	const languageOptions = useMemo(
		() => languages
			.map((language) => {
				const id = Number(language.language_id ?? language.preferred_lang_id ?? language.id);
				const name = language.language_name ?? language.preferred_lang ?? language.name ?? language.label;
				return Number.isInteger(id) && id > 0 && name
					? { id, name: String(name) }
					: null;
			})
			.filter(Boolean),
		[languages]
	);

	const locationOptions = useMemo(
		() => locations
			.map((location) => {
				const id = Number(location.location_id ?? location.id);
				const name = location.location_name ?? location.name ?? location.label;
				return Number.isInteger(id) && id > 0 && name
					? { id, name: String(name) }
					: null;
			})
			.filter(Boolean),
		[locations]
	);

	const areaOptions = useMemo(
		() => areasList
			.map((area) => {
				const id = Number(area.area_id ?? area.id);
				const name = area.area_name ?? area.name ?? area.label;
				return Number.isInteger(id) && id > 0 && name
					? { id, name: String(name) }
					: null;
			})
			.filter(Boolean),
		[areasList]
	);

	const step2Fields = useMemo(() => ['full_name', 'username', 'email_address', 'password'], []);

	const step2HasErrors = step2Fields.some((f) => liveErrors[f]) ||
		Boolean(usernameAsyncError) ||
		Boolean(emailAsyncError);

	const step2HasPending =
		isCheckPending(usernameCheck.status) || isCheckPending(emailCheck.status);

	const handleNext = () => {
		if (step === 2) {
			step2Fields.forEach((f) => setFieldTouched(f, true));
			if (step2HasErrors) return;
			if (step2HasPending) return;
			setRefLoading(true);
		}
		setApiError('');
		setApiInfo('');
		setStep((s) => s + 1);
	};

	const handleBack = () => {
		setApiError('');
		setApiInfo('');
		setStep((s) => s - 1);
	};

	const toggleArea = (areaId) => {
		setFieldTouched('areas', true);
		setFieldValue('areas', (() => {
			const exists = values.areas.find((a) => a.area_id === areaId);
			if (exists) {
				const next = values.areas.filter((a) => a.area_id !== areaId);
				if (next.length > 0 && !next.some((a) => a.is_primary)) {
					next[0] = { ...next[0], is_primary: true };
				}
				return next;
			}
			if (values.areas.length >= 5) return values.areas;
			return [
				...values.areas,
				{ area_id: areaId, is_primary: values.areas.length === 0 },
			];
		})());
	};

	const setPrimary = (areaId) => {
		setFieldValue(
			'areas',
			values.areas.map((a) => ({ ...a, is_primary: a.area_id === areaId }))
		);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		markAllTouched();

		if (hasErrors(liveErrors)) {
			if (step2Fields.some((f) => liveErrors[f])) setStep(2);
			return;
		}
		if (usernameAsyncError || emailAsyncError) {
			setStep(2);
			return;
		}
		if (biographyAsyncError) return;
		if (
			isCheckBlocking(usernameCheck.status) ||
			isCheckBlocking(emailCheck.status) ||
			isCheckPending(biographyCheck.status)
		) {
			return;
		}
		if (profileUploadStatus === PROFILE_UPLOAD_STATUS.UPLOADING) {
			setApiError(t('register.profilePictureUploadInProgress'));
			return;
		}

		setLoading(true);
		setApiError('');
		setApiInfo('');

		try {
			const payload = {
				full_name: capitalizeName(values.full_name),
				username: values.username.trim(),
				email_address: values.email_address.trim(),
				password: values.password,
				user_role: role,
			};

			if (values.phone_number) payload.phone_number = values.phone_number.replace(/\s+/g, '');
			if (values.birthdate) payload.birthdate = values.birthdate;
			if (values.biography) payload.biography = values.biography.trim();
			if (values.language_id) payload.language_id = Number(values.language_id);
			if (values.location_id) payload.location_id = Number(values.location_id);
			if (values.profile_img_url) payload.profile_img_url = values.profile_img_url;
			if (role === 'Consultant') payload.areas = values.areas;
			if (role === 'Service Line Leader' && values.service_line_id)
				payload.service_line_id = Number(values.service_line_id);

			await register(payload);
			setSuccess(true);
		} catch (err) {
			if (isCode(err, 'AUTH_REGISTER_EMAIL_FAILED')) {
				setSuccess(true);
				setApiInfo(resolveErrorMessage(err));
				return;
			}

			const backendFields = extractFieldErrors(err);
			if (Object.keys(backendFields).length) {
				setServerFieldErrors((prev) => ({ ...prev, ...backendFields }));
				if (step2Fields.some((f) => backendFields[f])) setStep(2);
				return;
			}

			setApiError(resolveErrorMessage(err));
		} finally {
			setLoading(false);
		}
	};

	if (success) {
		return (
			<AuthLayout>
				<Helmet>
					<title>{t('register.successTitle')}</title>
					<meta name="description" content={t('register.successMetaDescription')} />
				</Helmet>
				<AuthCard>
					<div className="d-flex flex-column align-items-center gap-3 py-2">
						<div className={styles.successIcon}><i className="bi bi-check-lg" aria-hidden="true" /></div>
						<h2 className={`text-center mb-0 ${styles.title}`}>{t('register.accountCreated')}</h2>
						<p className="text-center mb-0 small" style={{ color: 'var(--color-outline)', lineHeight: 1.5 }}>
							{apiInfo || t('register.checkEmailConfirmation')}
						</p>
						<Link to="/login">
							<FormButton type="button">{t('goToLogin')}</FormButton>
						</Link>
					</div>
				</AuthCard>
			</AuthLayout>
		);
	}

	const usernameError = fieldError('username', usernameAsyncError);
	const emailError = fieldError('email_address', emailAsyncError);
	const biographyError = fieldError('biography', biographyAsyncError);
	const phoneError = fieldError('phone_number');
	const birthdateError = fieldError('birthdate');
	const profileImageError = fieldError('profile_img_url') || profileUploadError;
	const isProfileUploading = profileUploadStatus === PROFILE_UPLOAD_STATUS.UPLOADING;
	const withMandatoryIcon = (label) => (
		<span className={styles.mandatoryLabel}>
			{label}
			<i className={`bi bi-asterisk ${styles.mandatoryIcon}`} aria-hidden="true" />
		</span>
	);

	const renderUsernameHint = () => {
		if (usernameError) return null;
		if (!values.username || !usernameSyncValid) return null;
		if (usernameCheck.status === AVAILABILITY_STATUS.CHECKING)
			return <p className={STATUS_HINT_CLASS} style={HINT_COLORS.muted}>{t('register.checkingAvailability')}</p>;
		if (usernameCheck.status === AVAILABILITY_STATUS.AVAILABLE)
			return <p className={STATUS_HINT_CLASS} style={HINT_COLORS.ok}>{t('register.usernameAvailable')}</p>;
		return null;
	};

	const renderEmailHint = () => {
		if (emailError) return null;
		if (!values.email_address || !emailSyncValid) return null;
		if (emailCheck.status === AVAILABILITY_STATUS.CHECKING)
			return <p className={STATUS_HINT_CLASS} style={HINT_COLORS.muted}>{t('register.checkingAvailability')}</p>;
		if (emailCheck.status === AVAILABILITY_STATUS.AVAILABLE)
			return <p className={STATUS_HINT_CLASS} style={HINT_COLORS.ok}>{t('register.emailAvailable')}</p>;
		return null;
	};

	const renderBiographyHint = () => {
		if (biographyError) return null;
		if (!values.biography) return null;
		if (biographyCheck.status === AVAILABILITY_STATUS.CHECKING)
			return <p className={STATUS_HINT_CLASS} style={HINT_COLORS.muted}>{t('register.reviewingContent')}</p>;
		if (biographyCheck.status === AVAILABILITY_STATUS.AVAILABLE)
			return <p className={STATUS_HINT_CLASS} style={HINT_COLORS.ok}>{t('register.looksGood')}</p>;
		return null;
	};

	const textareaClass = `form-control ${styles.textarea} ${biographyError ? 'is-invalid' : ''}`;

	const continueDisabled = step2HasPending;

	return (
		<AuthLayout>
			<Helmet>
				<title>{t('register.title')}</title>
				<meta name="description" content={t('register.metaDescription')} />
			</Helmet>
			<AuthCard>
				<div className={styles.stepBar}>
					{[1, 2, 3].map((s) => (
						<div
							key={s}
							className={`${styles.step} ${step >= s ? styles.stepActive : ''}`}
							aria-current={step === s ? 'step' : undefined}
						/>
					))}
				</div>

				{step === 1 && (
					<div>
						<h2 className={`text-center mb-1 ${styles.title}`}>{t('register.createAccount')}</h2>
						<p className={`text-center mb-3 small ${styles.subtitle}`}>{t('register.chooseRole')}</p>
						<div className={styles.roleGrid}>
							{ROLE_KEYS.map((r) => (
								<button
									key={r}
									type="button"
									className={`${styles.roleCard} ${role === r ? styles.roleCardActive : ''}`}
									onClick={() => { setRole(r); setStep(2); }}
								>
									<span className={styles.roleLabel}>{t(`register.roles.${r}`)}</span>
									<span className={styles.roleDesc}>{t(`register.roleDescriptions.${r}`)}</span>
								</button>
							))}
						</div>
						<p className="text-center mt-3 mb-0 small" style={{ color: 'var(--color-outline)' }}>
							{t('register.alreadyHaveAccount')} <Link to="/login">{t('register.signIn')}</Link>
						</p>
					</div>
				)}

				{step === 2 && (
					<form onSubmit={(e) => { e.preventDefault(); handleNext(); }} noValidate>
						<h2 className={`text-center mb-1 ${styles.title}`}>{t('register.basicInfo')}</h2>
						<p className={`text-center mb-3 small ${styles.subtitle}`}>
							<Trans i18nKey="register.registeringAs" values={{ role: t(`register.roles.${role}`) }} components={{ strong: <strong /> }} />
						</p>
						<div className="vstack gap-3">
							<FormInput
								{...form.getFieldProps('full_name')}
								onChange={onChange}
								onBlur={handleBlur}
								id="full_name"
								label={withMandatoryIcon(t('register.fullName'))}
								type="text"
								placeholder={t('register.fullNamePlaceholder')}
								error={fieldError('full_name')}
								autoFocus
							/>
							<div>
								<FormInput
									{...form.getFieldProps('username')}
									onChange={onChange}
									onBlur={handleBlur}
									id="username"
									label={withMandatoryIcon(t('register.username'))}
									type="text"
									placeholder={t('register.usernamePlaceholder')}
									error={usernameError}
								/>
								{renderUsernameHint()}
							</div>
							<div>
								<FormInput
									{...form.getFieldProps('email_address')}
									onChange={onChange}
									onBlur={handleBlur}
									id="email_address"
									label={withMandatoryIcon(t('register.email'))}
									type="email"
									placeholder={t('emailPlaceholder')}
									error={emailError}
								/>
								{renderEmailHint()}
							</div>
							<div className="position-relative">
								<FormInput
									{...form.getFieldProps('password')}
									onChange={onChange}
									onBlur={handleBlur}
									id="password"
									label={withMandatoryIcon(t('register.password'))}
									type={showPassword ? 'text' : 'password'}
									placeholder={t('register.enterPasswordPlaceholder')}
									error={fieldError('password')}
								/>
								<PasswordToggle show={showPassword} onToggle={() => setShowPassword((v) => !v)} />
							</div>

							<PasswordRules password={values.password} />

							<div className="row g-2 mt-1">
								<div className="col">
									<FormButton type="button" variant="secondary" onClick={() => setStep(1)}>{t('register.back')}</FormButton>
								</div>
								<div className="col">
									<FormButton type="submit" loading={continueDisabled}>{t('register.continue')}</FormButton>
								</div>
							</div>
						</div>
					</form>
				)}

				{step === 3 && (
					<form onSubmit={handleSubmit} noValidate>
						<h2 className={`text-center mb-1 ${styles.title}`}>{t('register.additionalDetails')}</h2>
						<div className="vstack gap-3">
							{refLoading ? (
								<p className="text-center py-3 mb-0 small" style={{ color: 'var(--color-outline)' }}>{t('register.loadingOptions')}</p>
							) : (
								<>
									<div>
										<label htmlFor="profile_img_upload" className={`form-label ${styles.selectLabel}`}>{t('register.profilePicture')}</label>
										<input
											ref={profileFileInputRef}
											id="profile_img_upload"
											name="profile_img_upload"
											type="file"
											className={styles.hiddenFileInput}
											accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,image/svg+xml,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.gif,.bmp,.svg,.heic,.heif"
											onChange={onProfileImageChange}
											onBlur={() => setFieldTouched('profile_img_url', true)}
										/>
										<div
											role="button"
											tabIndex={0}
											aria-disabled={isProfileUploading}
											className={`${styles.profileImagePicker} ${profileImageError ? styles.profileImagePickerError : ''} ${isProfileUploading ? styles.profileImagePickerDisabled : ''}`}
											onClick={() => {
												if (!isProfileUploading) openProfileImagePicker();
											}}
											onKeyDown={(event) => {
												if (isProfileUploading) return;
												if (event.key === 'Enter' || event.key === ' ') {
													event.preventDefault();
													openProfileImagePicker();
												}
											}}
										>
											{profilePreviewUrl ? (
												<img src={profilePreviewUrl} alt={t('register.profilePicturePreviewAlt')} className={styles.profileImagePreview} />
											) : (
												<div className={styles.profileImagePlaceholder}>
													<i className="bi bi-image" aria-hidden="true" />
													<span>{t('register.profilePictureChoose')}</span>
												</div>
											)}
										</div>
										{profileImageError && (
											<div className="invalid-feedback d-block">{profileImageError}</div>
										)}
										{(profilePreviewUrl || values.profile_img_url) && (
											<div className={styles.profileImageActions}>
												<FormButton
													type="button"
													variant="secondary"
													onClick={openProfileImagePicker}
													disabled={isProfileUploading}
													className={styles.profileImageActionButton}
												>
													{t('register.profilePictureChange')}
												</FormButton>
												<FormButton
													type="button"
													variant="secondary"
													onClick={clearProfileImage}
													disabled={isProfileUploading}
													className={styles.profileImageActionButton}
												>
													<i className="bi bi-trash me-1" aria-hidden="true" />
													{t('register.profilePictureRemove')}
												</FormButton>
											</div>
										)}
										<p className={`small mt-1 mb-0 ${styles.fileHint}`}>
											{t('register.profilePictureHint', { sizeMb: PROFILE_IMAGE_MAX_FILE_SIZE_BYTES / (1024 * 1024) })}
										</p>
										{profileUploadStatus === PROFILE_UPLOAD_STATUS.UPLOADING && (
											<p className={STATUS_HINT_CLASS} style={HINT_COLORS.muted}>
												{t('register.profilePictureUploading')}
											</p>
										)}
										{profileUploadStatus === PROFILE_UPLOAD_STATUS.UPLOADED && !profileImageError && (
											<p className={STATUS_HINT_CLASS} style={HINT_COLORS.ok}>
												{t('register.profilePictureUploaded', { fileName: profileUploadFileName })}
											</p>
										)}
									</div>

									<div>
										<label htmlFor="phone_local_number" className={`form-label ${styles.selectLabel}`}>{t('register.phoneNumber')}</label>
										<div className={styles.phoneRow}>
											<CustomSelect
												id="phone_prefix"
												value={phonePrefix}
												onChange={onPhonePrefixChange}
												onBlur={() => setFieldTouched('phone_number', true)}
												options={phonePrefixes}
												error={!!phoneError}
												ariaLabel={t('register.countryPhonePrefix')}
											/>
											<input
												id="phone_local_number"
												name="phone_local_number"
												type="tel"
												inputMode="numeric"
												autoComplete="tel-national"
												value={phoneLocalDisplay}
												onChange={onPhoneNumberChange}
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
										<label htmlFor="birthdate" className={`form-label ${styles.selectLabel}`}>{t('register.dateOfBirth')}</label>
										<DatePicker
											id="birthdate"
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
										<label htmlFor="language_id" className={`form-label ${styles.selectLabel}`}>{t('register.preferredLanguage')}</label>
										<CustomSelect
											id="language_id"
											name="language_id"
											value={form.values.language_id}
											onChange={onChange}
											onBlur={handleBlur}
											options={languageOptions.map((l) => ({ value: l.id, label: l.name }))}
											placeholder={languageOptions.length === 0 ? t('register.noLanguagesAvailable') : t('register.selectLanguage')}
											disabled={languageOptions.length === 0}
											error={!!fieldError('language_id')}
										/>
										{fieldError('language_id') && (
											<div className="invalid-feedback d-block">{fieldError('language_id')}</div>
										)}
									</div>

									<div>
										<label htmlFor="location_id" className={`form-label ${styles.selectLabel}`}>{t('register.location')}</label>
										<CustomSelect
											id="location_id"
											name="location_id"
											value={form.values.location_id}
											onChange={onChange}
											onBlur={handleBlur}
											options={locationOptions.map((l) => ({ value: l.id, label: l.name }))}
											placeholder={locationOptions.length === 0 ? t('register.noLocationsAvailable') : t('register.selectLocation')}
											disabled={locationOptions.length === 0}
											error={!!fieldError('location_id')}
										/>
										{fieldError('location_id') && (
											<div className="invalid-feedback d-block">{fieldError('location_id')}</div>
										)}
									</div>

									<div>
										<label htmlFor="biography" className={`form-label ${styles.selectLabel}`}>{t('register.biography')}</label>
										<textarea
											{...form.getFieldProps('biography')}
											onChange={onChange}
											onBlur={handleBlur}
											id="biography"
											rows={3}
											placeholder={t('register.biographyPlaceholder')}
											className={textareaClass}
											maxLength={5000}
										/>
										{biographyError && (
											<div className="invalid-feedback d-block">{biographyError}</div>
										)}
										{renderBiographyHint()}
									</div>

									{role === 'Consultant' && (
										<div className={styles.areasSection}>
											<span className={styles.selectLabel}>{withMandatoryIcon(t('register.areasOfExpertise'))}</span>
											{(touched.areas || submitAttempted) && liveErrors.areas && (
												<span className="small" style={{ color: 'var(--color-on-error-container)' }}>
													{t('register.warning', { error: liveErrors.areas })}
												</span>
											)}
											{areaOptions.length === 0 ? (
												<p className={`${styles.noDataMessage} mb-0`}>{t('register.noAreasAvailable')}</p>
											) : (
												<>
													<div className={styles.areaChips}>
														{areaOptions.map((area) => {
															const selected = values.areas.find((selectedArea) => selectedArea.area_id === area.id);
															return (
																<button
																	key={area.id}
																	type="button"
																	onClick={() => toggleArea(area.id)}
																	className={`${styles.areaChip} ${selected ? styles.areaChipActive : ''}`}
																>
																	{area.name}
																	{selected && (
																		<span
																			className={`${styles.primaryBadge} ${selected.is_primary ? styles.primaryBadgeOn : ''}`}
																			onClick={(event) => { event.stopPropagation(); setPrimary(area.id); }}
																			title={t('register.setAsPrimary')}
																		>
																			<i className="bi bi-star" aria-hidden="true" />
																		</span>
																	)}
																</button>
															);
														})}
													</div>
													<p className="small mb-0" style={{ color: 'var(--color-outline)' }}><Trans i18nKey="register.primaryAreaHint" components={{ icon: <i className="bi bi-star" /> }} /></p>
												</>
											)}
										</div>
									)}

									{role === 'Service Line Leader' && (
										<FormInput
											{...form.getFieldProps('service_line_id')}
											onChange={onChange}
											onBlur={handleBlur}
											id="service_line_id"
											label={withMandatoryIcon(t('register.serviceLineId'))}
											type="number"
											placeholder={t('register.serviceLineIdPlaceholder')}
											error={fieldError('service_line_id')}
										/>
									)}
								</>
							)}

							<FormAlert message={apiError} />

							<div className="row g-2 mt-1">
								<div className="col">
									<FormButton type="button" variant="secondary" onClick={handleBack}>{t('register.back')}</FormButton>
								</div>
								<div className="col">
									<FormButton
										type="submit"
										loading={loading}
										disabled={profileUploadStatus === PROFILE_UPLOAD_STATUS.UPLOADING}
									>
										{t('register.createAccountBtn')}
									</FormButton>
								</div>
							</div>
						</div>
					</form>
				)}
			</AuthCard>
		</AuthLayout>
	);
}
