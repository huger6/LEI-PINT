import { useState, useEffect, useCallback, useMemo } from 'react';
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
import styles from './RegisterPage.module.css';
import {
	PASSWORD_RULES,
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

const ROLE_KEYS = ['Consultant', 'Talent Manager', 'Service Line Leader'];

const COUNTRY_PHONE_PREFIXES = [
	{ value: '+1', label: 'US/CA (+1)' },
	{ value: '+44', label: 'UK (+44)' },
	{ value: '+33', label: 'France (+33)' },
	{ value: '+34', label: 'Spain (+34)' },
	{ value: '+39', label: 'Italy (+39)' },
	{ value: '+49', label: 'Germany (+49)' },
	{ value: '+31', label: 'Netherlands (+31)' },
	{ value: '+32', label: 'Belgium (+32)' },
	{ value: '+351', label: 'Portugal (+351)' },
	{ value: '+55', label: 'Brazil (+55)' },
	{ value: '+52', label: 'Mexico (+52)' },
	{ value: '+54', label: 'Argentina (+54)' },
	{ value: '+91', label: 'India (+91)' },
	{ value: '+81', label: 'Japan (+81)' },
	{ value: '+82', label: 'South Korea (+82)' },
	{ value: '+61', label: 'Australia (+61)' },
	{ value: '+64', label: 'New Zealand (+64)' },
	{ value: '+86', label: 'China (+86)' },
	{ value: '+971', label: 'UAE (+971)' },
	{ value: '+27', label: 'South Africa (+27)' },
];

const MIN_AGE = 16;
const DIGITS_ONLY_REGEX = /\D+/g;

function getMinBirthdate() {
	const d = new Date();
	d.setFullYear(d.getFullYear() - MIN_AGE);
	return d.toISOString().split('T')[0];
}

function extractCollection(response) {
	const payload = response?.data?.data;
	if (Array.isArray(payload)) return payload;
	if (Array.isArray(payload?.data)) return payload.data;
	return [];
}

function normalizePhoneDigits(value) {
	return String(value ?? '').replace(DIGITS_ONLY_REGEX, '');
}

function groupByThree(value) {
	const digits = normalizePhoneDigits(value);
	return digits.match(/.{1,3}/g)?.join(' ') ?? '';
}

const INITIAL_FORM = {
	full_name: '',
	username: '',
	email_address: '',
	password: '',
	phone_number: '',
	birthdate: '',
	biography: '',
	preferred_lang_id: '',
	location_id: '',
	areas: [],
	service_line_id: '',
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

	const validate = useCallback(
		(vals) => ({
			...validateRegisterStep2(vals),
			...validateRegisterStep3(vals, role),
		}),
		[role]
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
				const id = Number(language.preferred_lang_id ?? language.id);
				const name = language.preferred_lang ?? language.name ?? language.label;
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

		setLoading(true);
		setApiError('');
		setApiInfo('');

		try {
			const payload = {
				full_name: values.full_name.trim(),
				username: values.username.trim(),
				email_address: values.email_address.trim(),
				password: values.password,
				user_role: role,
			};

			if (values.phone_number) payload.phone_number = values.phone_number.replace(/\s+/g, '');
			if (values.birthdate) payload.birthdate = values.birthdate;
			if (values.biography) payload.biography = values.biography.trim();
			if (values.preferred_lang_id) payload.preferred_lang_id = Number(values.preferred_lang_id);
			if (values.location_id) payload.location_id = Number(values.location_id);
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
								label={t('register.fullName')}
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
									label={t('register.username')}
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
									label={t('register.email')}
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
									label={t('register.password')}
									type={showPassword ? 'text' : 'password'}
									placeholder={t('register.enterPasswordPlaceholder')}
									error={fieldError('password')}
								/>
								<button
									type="button"
									className={styles.eyeToggle}
									onClick={() => setShowPassword((v) => !v)}
									tabIndex={-1}
									aria-label={t('togglePasswordVisibility')}
								>
									<i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
								</button>
							</div>

							{values.password && (
								<ul className={`list-unstyled vstack gap-1 py-2 px-3 mb-0 rounded ${styles.pwRules}`} aria-label={t('register.password')}>
									{PASSWORD_RULES.map((rule) => (
										<li
											key={rule.key}
											className={`${styles.pwRule} ${rule.test(values.password) ? styles.pwRuleOk : ''}`}
										>
											{rule.test(values.password) ? t('register.pwRuleOk') : t('register.pwRuleFail')} {t(`passwordRules.${rule.key}`)}
										</li>
									))}
								</ul>
							)}

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
						<p className={`text-center mb-3 small ${styles.subtitle}`}>{t('register.allFieldsOptional')}</p>
						<div className="vstack gap-3">
							{refLoading ? (
								<p className="text-center py-3 mb-0 small" style={{ color: 'var(--color-outline)' }}>{t('register.loadingOptions')}</p>
							) : (
								<>
									<div>
										<label htmlFor="phone_local_number" className={`form-label ${styles.selectLabel}`}>{t('register.phoneNumber')}</label>
										<div className={styles.phoneRow}>
											<CustomSelect
												id="phone_prefix"
												value={phonePrefix}
												onChange={onPhonePrefixChange}
												onBlur={() => setFieldTouched('phone_number', true)}
												options={COUNTRY_PHONE_PREFIXES}
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
										<label htmlFor="preferred_lang_id" className={`form-label ${styles.selectLabel}`}>{t('register.preferredLanguage')}</label>
										<CustomSelect
											id="preferred_lang_id"
											name="preferred_lang_id"
											value={form.values.preferred_lang_id}
											onChange={onChange}
											onBlur={handleBlur}
											options={languageOptions.map((l) => ({ value: l.id, label: l.name }))}
											placeholder={languageOptions.length === 0 ? t('register.noLanguagesAvailable') : t('register.selectLanguage')}
											disabled={languageOptions.length === 0}
											error={!!fieldError('preferred_lang_id')}
										/>
										{fieldError('preferred_lang_id') && (
											<div className="invalid-feedback d-block">{fieldError('preferred_lang_id')}</div>
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
											<span className={styles.selectLabel}>{t('register.areasOfExpertise')}</span>
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
											label={t('register.serviceLineId')}
											type="number"
											placeholder={t('register.serviceLineIdPlaceholder')}
											error={fieldError('service_line_id')}
										/>
									)}
								</>
							)}

							{apiError && (
								<div className="alert alert-danger py-2 px-3 mb-0 small" role="alert">{apiError}</div>
							)}

							<div className="row g-2 mt-1">
								<div className="col">
									<FormButton type="button" variant="secondary" onClick={handleBack}>{t('register.back')}</FormButton>
								</div>
								<div className="col">
									<FormButton type="submit" loading={loading}>{t('register.createAccountBtn')}</FormButton>
								</div>
							</div>
						</div>
					</form>
				)}
			</AuthCard>
		</AuthLayout>
	);
}
