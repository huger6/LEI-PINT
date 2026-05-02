import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import AuthCard from '../components/AuthCard';
import FormInput from '../components/FormInput';
import FormButton from '../components/FormButton';
import * as authApi from '../api/auth.js';
import api from '../api/axios.js';
import styles from './RegisterPage.module.css';

const ROLES = [
  { value: 'Consultant', label: 'Consultant', desc: 'Join as a consultant and manage your expertise areas.' },
  { value: 'Talent Manager', label: 'Talent Manager', desc: 'Support and grow talent across the organization.' },
  { value: 'Service Line Leader', label: 'Service Line Leader', desc: 'Lead a service line and drive strategic outcomes.' },
];

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { label: 'One uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { label: 'One lowercase letter', test: (v) => /[a-z]/.test(v) },
  { label: 'One digit', test: (v) => /\d/.test(v) },
  { label: 'One special character', test: (v) => /[^A-Za-z0-9]/.test(v) },
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

export default function RegisterPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(false);

  const [languages, setLanguages] = useState([]);
  const [locations, setLocations] = useState([]);
  const [areas, setAreasList] = useState([]);
  const [refLoading, setRefLoading] = useState(false);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateStep2 = () => {
    const errs = {};
    if (!form.full_name || form.full_name.trim().length < 2)
      errs.full_name = 'Full name must be at least 2 characters.';
    if (!form.username || !/^[a-zA-Z0-9._]{3,50}$/.test(form.username))
      errs.username = 'Username: 3-50 chars, letters, digits, . or _ only.';
    if (!form.email_address || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email_address))
      errs.email_address = 'Enter a valid email address.';
    if (!form.password || PASSWORD_RULES.some((r) => !r.test(form.password)))
      errs.password = 'Password does not meet all requirements.';
    return errs;
  };

  const handleNext = () => {
    if (step === 2) {
      const errs = validateStep2();
      if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => s - 1);

  const toggleArea = (areaId) => {
    setForm((prev) => {
      const exists = prev.areas.find((a) => a.area_id === areaId);
      if (exists) {
        const next = prev.areas.filter((a) => a.area_id !== areaId);
        if (next.length > 0 && !next.some((a) => a.is_primary)) {
          next[0] = { ...next[0], is_primary: true };
        }
        return { ...prev, areas: next };
      }
      if (prev.areas.length >= 5) return prev;
      return {
        ...prev,
        areas: [...prev.areas, { area_id: areaId, is_primary: prev.areas.length === 0 }],
      };
    });
  };

  const setPrimary = (areaId) => {
    setForm((prev) => ({
      ...prev,
      areas: prev.areas.map((a) => ({ ...a, is_primary: a.area_id === areaId })),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (role === 'Consultant' && form.areas.length === 0) {
      setErrors({ areas: 'Select at least one area.' });
      return;
    }
    setLoading(true);
    setApiError('');
    try {
      const payload = {
        full_name: form.full_name.trim(),
        username: form.username.trim(),
        email_address: form.email_address.trim(),
        password: form.password,
        user_role: role,
      };
      if (form.phone_number) payload.phone_number = form.phone_number.trim();
      if (form.birthdate) payload.birthdate = form.birthdate;
      if (form.biography) payload.biography = form.biography.trim();
      if (form.preferred_lang_id) payload.preferred_lang_id = Number(form.preferred_lang_id);
      if (form.location_id) payload.location_id = Number(form.location_id);
      if (role === 'Consultant') payload.areas = form.areas;
      if (role === 'Service Line Leader' && form.service_line_id)
        payload.service_line_id = Number(form.service_line_id);

      await authApi.register(payload);
      setSuccess(true);
    } catch (err) {
      const code = err?.response?.data?.code;
      if (code === 'AUTH_CREDENTIALS_CONFLICT') {
        setApiError('An account with that email or username already exists.');
      } else if (code === 'VALIDATION_INVALID_DATA') {
        setApiError('Please review your information and try again.');
      } else {
        setApiError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout>
        <AuthCard>
          <div className={styles.successState}>
            <div className={styles.successIcon}>✓</div>
            <h2 className={styles.title}>Account created!</h2>
            <p className={styles.successMsg}>
              Check your email for a confirmation link before signing in.
            </p>
            <Link to="/login">
              <FormButton type="button">Go to login</FormButton>
            </Link>
          </div>
        </AuthCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
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
            <h2 className={styles.title}>Create an account</h2>
            <p className={styles.subtitle}>Choose your role to get started</p>
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
            <p className={styles.footer}>
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} noValidate>
            <h2 className={styles.title}>Basic information</h2>
            <p className={styles.subtitle}>Registering as <strong>{role}</strong></p>
            <div className={styles.form}>
              <FormInput
                id="full_name"
                name="full_name"
                label="Full Name"
                type="text"
                placeholder="Jane Doe"
                value={form.full_name}
                onChange={handleChange}
                error={errors.full_name}
                autoFocus
              />
              <FormInput
                id="username"
                name="username"
                label="Username"
                type="text"
                placeholder="jane.doe"
                value={form.username}
                onChange={handleChange}
                error={errors.username}
              />
              <FormInput
                id="email_address"
                name="email_address"
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={form.email_address}
                onChange={handleChange}
                error={errors.email_address}
              />
              <div className={styles.passwordField}>
                <FormInput
                  id="password"
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  error={errors.password}
                />
                <button
                  type="button"
                  className={styles.eyeToggle}
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>

              {form.password && (
                <ul className={styles.pwRules} aria-label="Password requirements">
                  {PASSWORD_RULES.map((rule) => (
                    <li
                      key={rule.label}
                      className={`${styles.pwRule} ${rule.test(form.password) ? styles.pwRuleOk : ''}`}
                    >
                      {rule.test(form.password) ? '✓' : '○'} {rule.label}
                    </li>
                  ))}
                </ul>
              )}

              <div className={styles.btnRow}>
                <FormButton type="button" variant="secondary" onClick={handleBack}>
                  Back
                </FormButton>
                <FormButton type="submit">Continue</FormButton>
              </div>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit} noValidate>
            <h2 className={styles.title}>Additional details</h2>
            <p className={styles.subtitle}>All fields below are optional unless noted</p>
            <div className={styles.form}>
              {refLoading ? (
                <div className={styles.refLoading}>Loading options…</div>
              ) : (
                <>
                  <FormInput
                    id="phone_number"
                    name="phone_number"
                    label="Phone Number"
                    type="tel"
                    placeholder="+351 912 345 678"
                    value={form.phone_number}
                    onChange={handleChange}
                  />
                  <FormInput
                    id="birthdate"
                    name="birthdate"
                    label="Date of Birth (min. 16 years)"
                    type="date"
                    max={getMinBirthdate()}
                    value={form.birthdate}
                    onChange={handleChange}
                  />

                  {languages.length > 0 && (
                    <div className={styles.selectField}>
                      <label htmlFor="preferred_lang_id" className={styles.selectLabel}>Preferred Language</label>
                      <select
                        id="preferred_lang_id"
                        name="preferred_lang_id"
                        value={form.preferred_lang_id}
                        onChange={handleChange}
                        className={styles.select}
                      >
                        <option value="">Select language</option>
                        {languages.map((l) => (
                          <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {locations.length > 0 && (
                    <div className={styles.selectField}>
                      <label htmlFor="location_id" className={styles.selectLabel}>Location</label>
                      <select
                        id="location_id"
                        name="location_id"
                        value={form.location_id}
                        onChange={handleChange}
                        className={styles.select}
                      >
                        <option value="">Select location</option>
                        {locations.map((l) => (
                          <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className={styles.selectField}>
                    <label htmlFor="biography" className={styles.selectLabel}>Biography</label>
                    <textarea
                      id="biography"
                      name="biography"
                      rows={3}
                      placeholder="Tell us about yourself…"
                      value={form.biography}
                      onChange={handleChange}
                      className={styles.textarea}
                      maxLength={5000}
                    />
                  </div>

                  {role === 'Consultant' && (
                    <div className={styles.areasSection}>
                      <span className={styles.selectLabel}>Areas of Expertise (1–5)</span>
                      {errors.areas && <span className={styles.areaError}>{errors.areas}</span>}
                      <div className={styles.areaChips}>
                        {areas.map((a) => {
                          const selected = form.areas.find((fa) => fa.area_id === a.id);
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
                      <p className={styles.areaHint}>Click ★ to set your primary area.</p>
                    </div>
                  )}

                  {role === 'Service Line Leader' && (
                    <FormInput
                      id="service_line_id"
                      name="service_line_id"
                      label="Service Line ID"
                      type="number"
                      placeholder="e.g. 1"
                      value={form.service_line_id}
                      onChange={handleChange}
                    />
                  )}
                </>
              )}

              {apiError && (
                <div className={styles.errorBanner} role="alert">{apiError}</div>
              )}

              <div className={styles.btnRow}>
                <FormButton type="button" variant="secondary" onClick={handleBack}>
                  Back
                </FormButton>
                <FormButton type="submit" loading={loading}>
                  Create account
                </FormButton>
              </div>
            </div>
          </form>
        )}
      </AuthCard>
    </AuthLayout>
  );
}
