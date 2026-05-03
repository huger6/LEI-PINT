import { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import { AuthCard, register } from '../../features/auth';
import api from '../../services/api.js';
import FormInput from '../../components/FormInput/FormInput';
import FormButton from '../../components/FormButton/FormButton';
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

const ROLES = [
  { value: 'Consultant', label: 'Consultant', desc: 'Join as a consultant and manage your expertise areas.' },
  { value: 'Talent Manager', label: 'Talent Manager', desc: 'Support and grow talent across the organization.' },
  { value: 'Service Line Leader', label: 'Service Line Leader', desc: 'Lead a service line and drive strategic outcomes.' },
];

const MIN_AGE = 16;

function getMinBirthdate() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - MIN_AGE);
  return d.toISOString().split('T')[0];
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

  // Availability checks
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
      ? 'This username is already in use.'
      : null;
  const emailAsyncError =
    emailCheck.status === AVAILABILITY_STATUS.UNAVAILABLE
      ? 'An account with this email already exists.'
      : null;
  const biographyAsyncError =
    biographyCheck.status === AVAILABILITY_STATUS.UNAVAILABLE
      ? biographyCheck.result?.errors?.[0] || 'Biography contains content that is not allowed.'
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

  useEffect(() => {
    if (step !== 3) return;
    setRefLoading(true);
    Promise.all([
      api.get('/languages').catch(() => ({ data: { data: [] } })),
      api.get('/locations').catch(() => ({ data: { data: [] } })),
      role === 'Consultant'
        ? api.get('/areas').catch(() => ({ data: { data: [] } }))
        : Promise.resolve({ data: { data: [] } }),
    ]).then(([langRes, locRes, areaRes]) => {
      setLanguages(langRes.data?.data ?? []);
      setLocations(locRes.data?.data ?? []);
      setAreasList(areaRes.data?.data ?? []);
    }).finally(() => setRefLoading(false));
  }, [step, role]);

  const step2Fields = useMemo(
    () => ['full_name', 'username', 'email_address', 'password'],
    []
  );

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
          <title>Account Created — LEI-PINT</title>
          <meta name="description" content="Your LEI-PINT account has been created. Check your email to confirm." />
        </Helmet>
        <AuthCard>
          <div className="d-flex flex-column align-items-center gap-3 py-2">
            <div className={styles.successIcon}>✓</div>
            <h2 className={`text-center mb-0 ${styles.title}`}>Account created!</h2>
            <p className="text-center mb-0 small" style={{ color: 'var(--color-outline)', lineHeight: 1.5 }}>
              {apiInfo || 'Check your email for a confirmation link before signing in.'}
            </p>
            <Link to="/login">
              <FormButton type="button">Go to login</FormButton>
            </Link>
          </div>
        </AuthCard>
      </AuthLayout>
    );
  }

  const usernameError = fieldError('username', usernameAsyncError);
  const emailError = fieldError('email_address', emailAsyncError);
  const biographyError = fieldError('biography', biographyAsyncError);

  const renderUsernameHint = () => {
    if (usernameError) return null;
    if (!values.username || !usernameSyncValid) return null;
    if (usernameCheck.status === AVAILABILITY_STATUS.CHECKING)
      return <p className={STATUS_HINT_CLASS} style={HINT_COLORS.muted}>Checking availability…</p>;
    if (usernameCheck.status === AVAILABILITY_STATUS.AVAILABLE)
      return <p className={STATUS_HINT_CLASS} style={HINT_COLORS.ok}>✓ Username is available.</p>;
    return null;
  };

  const renderEmailHint = () => {
    if (emailError) return null;
    if (!values.email_address || !emailSyncValid) return null;
    if (emailCheck.status === AVAILABILITY_STATUS.CHECKING)
      return <p className={STATUS_HINT_CLASS} style={HINT_COLORS.muted}>Checking availability…</p>;
    if (emailCheck.status === AVAILABILITY_STATUS.AVAILABLE)
      return <p className={STATUS_HINT_CLASS} style={HINT_COLORS.ok}>✓ Email is available.</p>;
    return null;
  };

  const renderBiographyHint = () => {
    if (biographyError) return null;
    if (!values.biography) return null;
    if (biographyCheck.status === AVAILABILITY_STATUS.CHECKING)
      return <p className={STATUS_HINT_CLASS} style={HINT_COLORS.muted}>Reviewing content…</p>;
    if (biographyCheck.status === AVAILABILITY_STATUS.AVAILABLE)
      return <p className={STATUS_HINT_CLASS} style={HINT_COLORS.ok}>✓ Looks good.</p>;
    return null;
  };

  const selectClass = (field) =>
    `form-select ${styles.select} ${fieldError(field) ? 'is-invalid' : ''}`;
  const textareaClass = `form-control ${styles.textarea} ${biographyError ? 'is-invalid' : ''}`;

  const continueDisabled = step2HasPending;

  return (
    <AuthLayout>
      <Helmet>
        <title>Create Account — LEI-PINT</title>
        <meta name="description" content="Create a new LEI-PINT account. Choose your role and get started." />
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
            <h2 className={`text-center mb-1 ${styles.title}`}>Create an account</h2>
            <p className={`text-center mb-3 small ${styles.subtitle}`}>Choose your role to get started</p>
            <div className={styles.roleGrid}>
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  className={`${styles.roleCard} ${role === r.value ? styles.roleCardActive : ''}`}
                  onClick={() => { setRole(r.value); setStep(2); }}
                >
                  <span className={styles.roleLabel}>{r.label}</span>
                  <span className={styles.roleDesc}>{r.desc}</span>
                </button>
              ))}
            </div>
            <p className="text-center mt-3 mb-0 small" style={{ color: 'var(--color-outline)' }}>
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} noValidate>
            <h2 className={`text-center mb-1 ${styles.title}`}>Basic information</h2>
            <p className={`text-center mb-3 small ${styles.subtitle}`}>Registering as <strong>{role}</strong></p>
            <div className="vstack gap-3">
              <FormInput
                {...form.getFieldProps('full_name')}
                onChange={onChange}
                onBlur={handleBlur}
                id="full_name"
                label="Full Name"
                type="text"
                placeholder="Jane Doe"
                error={fieldError('full_name')}
                autoFocus
              />
              <div>
                <FormInput
                  {...form.getFieldProps('username')}
                  onChange={onChange}
                  onBlur={handleBlur}
                  id="username"
                  label="Username"
                  type="text"
                  placeholder="jane.doe"
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
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
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
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  error={fieldError('password')}
                />
                <button
                  type="button"
                  className={styles.eyeToggle}
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label="Toggle password visibility"
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>

              {values.password && (
                <ul className={`list-unstyled vstack gap-1 py-2 px-3 mb-0 rounded ${styles.pwRules}`} aria-label="Password requirements">
                  {PASSWORD_RULES.map((rule) => (
                    <li
                      key={rule.label}
                      className={`${styles.pwRule} ${rule.test(values.password) ? styles.pwRuleOk : ''}`}
                    >
                      {rule.test(values.password) ? '✓' : '○'} {rule.label}
                    </li>
                  ))}
                </ul>
              )}

              <div className="row g-2 mt-1">
                <div className="col">
                  <FormButton type="button" variant="secondary" onClick={() => setStep(1)}>Back</FormButton>
                </div>
                <div className="col">
                  <FormButton type="submit" loading={continueDisabled}>Continue</FormButton>
                </div>
              </div>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit} noValidate>
            <h2 className={`text-center mb-1 ${styles.title}`}>Additional details</h2>
            <p className={`text-center mb-3 small ${styles.subtitle}`}>All fields below are optional unless noted</p>
            <div className="vstack gap-3">
              {refLoading ? (
                <p className="text-center py-3 mb-0 small" style={{ color: 'var(--color-outline)' }}>Loading options…</p>
              ) : (
                <>
                  <FormInput
                    {...form.getFieldProps('phone_number')}
                    onChange={onChange}
                    onBlur={handleBlur}
                    id="phone_number"
                    label="Phone Number"
                    type="tel"
                    placeholder="+351912345678"
                    error={fieldError('phone_number')}
                  />
                  <FormInput
                    {...form.getFieldProps('birthdate')}
                    onChange={onChange}
                    onBlur={handleBlur}
                    id="birthdate"
                    label="Date of Birth (min. 16 years)"
                    type="date"
                    max={getMinBirthdate()}
                    error={fieldError('birthdate')}
                  />

                  {languages.length > 0 && (
                    <div>
                      <label htmlFor="preferred_lang_id" className={`form-label ${styles.selectLabel}`}>Preferred Language</label>
                      <select
                        {...form.getFieldProps('preferred_lang_id')}
                        onChange={onChange}
                        onBlur={handleBlur}
                        id="preferred_lang_id"
                        className={selectClass('preferred_lang_id')}
                      >
                        <option value="">Select language</option>
                        {languages.map((l) => (
                          <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                      </select>
                      {fieldError('preferred_lang_id') && (
                        <div className="invalid-feedback d-block">{fieldError('preferred_lang_id')}</div>
                      )}
                    </div>
                  )}

                  {locations.length > 0 && (
                    <div>
                      <label htmlFor="location_id" className={`form-label ${styles.selectLabel}`}>Location</label>
                      <select
                        {...form.getFieldProps('location_id')}
                        onChange={onChange}
                        onBlur={handleBlur}
                        id="location_id"
                        className={selectClass('location_id')}
                      >
                        <option value="">Select location</option>
                        {locations.map((l) => (
                          <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                      </select>
                      {fieldError('location_id') && (
                        <div className="invalid-feedback d-block">{fieldError('location_id')}</div>
                      )}
                    </div>
                  )}

                  <div>
                    <label htmlFor="biography" className={`form-label ${styles.selectLabel}`}>Biography</label>
                    <textarea
                      {...form.getFieldProps('biography')}
                      onChange={onChange}
                      onBlur={handleBlur}
                      id="biography"
                      rows={3}
                      placeholder="Tell us about yourself…"
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
                      <span className={styles.selectLabel}>Areas of Expertise (1–5)</span>
                      {(touched.areas || submitAttempted) && liveErrors.areas && (
                        <span className="small" style={{ color: 'var(--color-on-error-container)' }}>
                          ⚠ {liveErrors.areas}
                        </span>
                      )}
                      <div className={styles.areaChips}>
                        {areasList.map((a) => {
                          const selected = values.areas.find((fa) => fa.area_id === a.id);
                          return (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => toggleArea(a.id)}
                              className={`${styles.areaChip} ${selected ? styles.areaChipActive : ''}`}
                            >
                              {a.name}
                              {selected && (
                                <span
                                  className={`${styles.primaryBadge} ${selected.is_primary ? styles.primaryBadgeOn : ''}`}
                                  onClick={(e) => { e.stopPropagation(); setPrimary(a.id); }}
                                  title="Set as primary"
                                >
                                  ★
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <p className="small mb-0" style={{ color: 'var(--color-outline)' }}>Click ★ to set your primary area.</p>
                    </div>
                  )}

                  {role === 'Service Line Leader' && (
                    <FormInput
                      {...form.getFieldProps('service_line_id')}
                      onChange={onChange}
                      onBlur={handleBlur}
                      id="service_line_id"
                      label="Service Line ID"
                      type="number"
                      placeholder="e.g. 1"
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
                  <FormButton type="button" variant="secondary" onClick={handleBack}>Back</FormButton>
                </div>
                <div className="col">
                  <FormButton type="submit" loading={loading}>Create account</FormButton>
                </div>
              </div>
            </div>
          </form>
        )}
      </AuthCard>
    </AuthLayout>
  );
}
