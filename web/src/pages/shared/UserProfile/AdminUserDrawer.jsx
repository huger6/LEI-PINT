import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { updateUser } from '../../../features/users/api/usersApi';
import { getLocations } from '../../../features/users/api/profileApi';
import { getServiceLines, getAreas } from '../../../features/badges/api/hierarchyApi';
import { uploadProfileImageToTemp } from '../../../services/storage';
import api from '../../../services/api';
import {
	useAvailability,
	AVAILABILITY_STATUS,
	isCheckBlocking,
	fetchUsernameAvailability,
	fetchEmailAvailability,
} from '../../../validations';
import Icon from '../../../components/Icons/Icons';
import Button from '../../../components/Button/Button';
import FormInput from '../../../components/FormInput/FormInput';
import CustomSelect from '../../../components/CustomSelect/CustomSelect';
import AreaPickerList from '../../../components/AreaPickerList/AreaPickerList';
import Chip from '../../../components/Chip/Chip';
import ConfirmToast from '../../../components/ConfirmToast/ConfirmToast';
import styles from './AdminUserDrawer.module.css';

// Roles an admin may assign through this drawer (Administrator excluded).
const CHANGEABLE_ROLES = ['Consultant', 'Talent Manager', 'Service Line Leader'];

// Labeled divider used to separate sections within the drawer.
function SectionDivider({ label }) {
	return (
		<div className={styles.sectionDivider}>
			<span className={styles.sectionDividerLabel}>{label}</span>
			<div className={styles.sectionDividerLine} />
		</div>
	);
}

// Read-only label/value row for displaying account details.
function DetailRow({ label, children }) {
	return (
		<div className={styles.detailRow}>
			<span className={styles.detailLabel}>{label}</span>
			<span className={styles.detailValue}>{children}</span>
		</div>
	);
}

// Derive avatar initials from a full name (first + last initial).
function getInitials(name = '') {
	const parts = name.trim().split(/\s+/);
	if (parts.length === 0 || !parts[0]) return '?';
	if (parts.length === 1) return parts[0][0].toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Admin-only side drawer for viewing and editing a user's full profile.
export default function AdminUserDrawer({ open, onClose, onSaved, profile, guid }) {
	// Translation helper for localized labels and messages.
	const { t } = useTranslation();
	// Ref to the drawer panel element.
	const panelRef = useRef(null);

	// Editable form state for the user being managed.
	const [form, setForm] = useState({});
	// Per-field validation errors.
	const [errors, setErrors] = useState({});
	// Whether a save request is in flight.
	const [saving, setSaving] = useState(false);
	// Whether the form differs from its initial loaded state.
	const [isDirty, setIsDirty] = useState(false);
	// Snapshot of the initial form values for dirty-checking and diffing.
	const initialRef = useRef({});

	// Service line options loaded from the API.
	const [serviceLines, setServiceLines] = useState([]);
	// All areas loaded from the API.
	const [allAreas, setAllAreas] = useState([]);
	// Available locations loaded from the API.
	const [locations, setLocations] = useState([]);
	// Whether to show the "last SLL" confirmation warning.
	const [showSllWarning, setShowSllWarning] = useState(false);
	// Role change awaiting confirmation via the warning toast.
	const [pendingRoleChange, setPendingRoleChange] = useState(null);

	// Text input for adding a new interest chip.
	const [interestInput, setInterestInput] = useState('');
	// Text input for adding a new goal.
	const [goalInput, setGoalInput] = useState('');

	// Local preview URL for the (possibly unsaved) profile image.
	const [profilePreviewUrl, setProfilePreviewUrl] = useState('');
	// Whether a profile image upload is in progress.
	const [profileUploading, setProfileUploading] = useState(false);
	// Error message for a failed profile image upload.
	const [profileUploadError, setProfileUploadError] = useState('');
	// Ref to the hidden file input for profile image selection.
	const profileFileRef = useRef(null);

	// Resolve the user's role from the various possible profile shapes.
	const displayRole = profile?.role?.role_name || profile?.role_name || profile?.role || '';
	// Whether the managed user is an Administrator (role not editable).
	const isAdminRole = displayRole === 'Administrator';

	// Map locations into valid select options.
	const locationOptions = useMemo(
		() => locations.map((l) => {
			const id = Number(l.location_id ?? l.id);
			const name = l.location_name ?? l.name ?? l.label;
			return Number.isInteger(id) && id > 0 && name ? { value: id, label: String(name) } : null;
		}).filter(Boolean),
		[locations],
	);

	// Populate the form from the profile when the drawer opens.
	useEffect(() => {
		if (open && profile) {
			const photoUrl = profile.profileImg || profile.profile_img_url || '';
			const locId = profile.location_id ?? profile.locationId ?? '';
			const initial = {
				fullName: profile.fullName || profile.full_name || '',
				username: profile.username || '',
				email: profile.email || '',
				locationId: locId ? String(locId) : '',
				about: profile.biography || profile.about || profile.bio || '',
				interests: [...(profile.interests || [])],
				goals: [...(profile.goals || [])],
				profileImgUrl: photoUrl,
				isActive: profile.isActive ?? profile.is_active ?? true,
				emailConfirmed: profile.emailConfirmed ?? profile.email_confirmed ?? false,
				gdprAccepted: profile.gdprAccepted ?? profile.gdpr_accepted ?? false,
				role: displayRole,
				serviceLine: profile.serviceLineId ? String(profile.serviceLineId) : '',
				areas: (profile.areas || []).map((a) => ({
					area_id: a.areaId ?? a.area_id,
					is_primary: a.isPrimary ?? a.is_primary ?? false,
				})).filter((a) => a.area_id),
			};
			setForm(initial);
			initialRef.current = JSON.parse(JSON.stringify(initial));
			setProfilePreviewUrl(photoUrl);
			setProfileUploadError('');
			setErrors({});
			setIsDirty(false);
			setInterestInput('');
			setGoalInput('');
		}
	}, [open, profile, displayRole]);

	// Load service lines, areas and locations once the drawer opens.
	useEffect(() => {
		if (!open) return;
		Promise.all([
			getServiceLines().catch(() => []),
			getAreas().catch(() => []),
			getLocations().catch(() => []),
		]).then(([sl, ar, loc]) => {
			setServiceLines(sl || []);
			setAllAreas(ar || []);
			setLocations(loc || []);
		});
	}, [open]);

	// Close the drawer on Escape while it is open.
	useEffect(() => {
		if (!open) return;
		const handleKey = (e) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', handleKey);
		return () => window.removeEventListener('keydown', handleKey);
	}, [open, onClose]);

	// Trimmed username for change detection and availability checks.
	const trimmedUsername = form.username?.trim() || '';
	// Trimmed email for change detection and availability checks.
	const trimmedEmail = form.email?.trim() || '';

	// True when a valid username differs from the original.
	const usernameChanged = trimmedUsername !== (initialRef.current.username?.trim() || '')
		&& trimmedUsername.length >= 3;
	// True when a valid email differs from the original.
	const emailChanged = trimmedEmail !== (initialRef.current.email?.trim() || '')
		&& /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

	// Debounced availability check for the username field.
	const usernameCheck = useAvailability({
		value: trimmedUsername,
		isValid: trimmedUsername.length >= 3,
		enabled: open && usernameChanged,
		fetcher: fetchUsernameAvailability,
	});

	// Debounced availability check for the email field.
	const emailCheck = useAvailability({
		value: trimmedEmail,
		isValid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail),
		enabled: open && emailChanged,
		fetcher: fetchEmailAvailability,
	});

	// Compare a candidate form state against the initial snapshot to set dirty flag.
	const checkDirty = useCallback((next) => {
		const initial = initialRef.current;
		const changed = next.fullName !== initial.fullName
			|| next.username !== initial.username
			|| next.email !== initial.email
			|| next.locationId !== initial.locationId
			|| next.about !== initial.about
			|| JSON.stringify(next.interests) !== JSON.stringify(initial.interests)
			|| JSON.stringify(next.goals) !== JSON.stringify(initial.goals)
			|| next.profileImgUrl !== initial.profileImgUrl
			|| next.isActive !== initial.isActive
			|| next.emailConfirmed !== initial.emailConfirmed
			|| next.gdprAccepted !== initial.gdprAccepted
			|| next.role !== initial.role
			|| next.serviceLine !== initial.serviceLine
			|| JSON.stringify(next.areas) !== JSON.stringify(initial.areas);
		setIsDirty(changed);
	}, []);

	// Curried change handler that updates a single form field and rechecks dirtiness.
	const handleChange = (field) => (e) => {
		const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
		setForm((prev) => {
			const next = { ...prev, [field]: value };
			checkDirty(next);
			return next;
		});
		if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
	};

	// ── Interest chips ───────────────────────────────────────────
	// Add the typed interest as a chip if non-empty and not a duplicate.
	const addInterest = () => {
		const val = interestInput.trim();
		if (!val || form.interests?.includes(val)) return;
		setForm((prev) => {
			const next = { ...prev, interests: [...(prev.interests || []), val] };
			checkDirty(next);
			return next;
		});
		setInterestInput('');
	};

	// Remove the interest chip at the given index.
	const removeInterest = (idx) => {
		setForm((prev) => {
			const next = { ...prev, interests: prev.interests.filter((_, i) => i !== idx) };
			checkDirty(next);
			return next;
		});
	};

	// ── Goals list ───────────────────────────────────────────────
	// Add the typed goal to the list if non-empty.
	const addGoal = () => {
		const val = goalInput.trim();
		if (!val) return;
		setForm((prev) => {
			const next = { ...prev, goals: [...(prev.goals || []), val] };
			checkDirty(next);
			return next;
		});
		setGoalInput('');
	};

	// Remove the goal at the given index.
	const removeGoal = (idx) => {
		setForm((prev) => {
			const next = { ...prev, goals: prev.goals.filter((_, i) => i !== idx) };
			checkDirty(next);
			return next;
		});
	};

	// ── Profile image ────────────────────────────────────────────
	// Handle file selection: preview locally, then upload to temp storage.
	const onProfileImageChange = useCallback(async (e) => {
		const file = e.target.files?.[0];
		e.target.value = '';
		if (!file) return;

		setProfileUploadError('');
		setProfileUploading(true);

		const localUrl = URL.createObjectURL(file);
		setProfilePreviewUrl(localUrl);

		try {
			const { publicUrl } = await uploadProfileImageToTemp(file);
			URL.revokeObjectURL(localUrl);
			setProfilePreviewUrl(publicUrl);
			setForm((prev) => {
				const next = { ...prev, profileImgUrl: publicUrl };
				checkDirty(next);
				return next;
			});
		} catch {
			setProfileUploadError(t('register.profilePictureUploadFailed'));
		} finally {
			setProfileUploading(false);
		}
	}, [t, checkDirty]);

	// Clear the selected/existing profile image.
	const clearProfileImage = useCallback(() => {
		setProfilePreviewUrl('');
		setProfileUploadError('');
		setForm((prev) => {
			const next = { ...prev, profileImgUrl: null };
			checkDirty(next);
			return next;
		});
		if (profileFileRef.current) profileFileRef.current.value = '';
	}, [checkDirty]);

	// Apply a role change, resetting service line / areas to match the new role.
	const applyRoleChange = (newRole) => {
		setForm((prev) => {
			const next = { ...prev, role: newRole };
			if (newRole !== 'Service Line Leader') next.serviceLine = '';
			if (newRole !== 'Consultant') next.areas = [];
			if (newRole === 'Consultant' && initialRef.current.role === 'Consultant') {
				next.areas = [...initialRef.current.areas];
			}
			checkDirty(next);
			return next;
		});
	};

	// Handle role select change, warning when demoting the last SLL of a service line.
	const handleRoleChange = async (e) => {
		const newRole = e.target.value;
		const currentRole = initialRef.current.role;

		if (newRole === currentRole) return;

		if (currentRole === 'Service Line Leader' && newRole !== 'Service Line Leader' && profile.serviceLineId) {
			try {
				const { data } = await api.get(`/admin/service-lines/${profile.serviceLineId}/sll-count`);
				if (data?.data?.count <= 1) {
					setPendingRoleChange(newRole);
					setShowSllWarning(true);
					return;
				}
			} catch { /* proceed anyway */ }
		}

		applyRoleChange(newRole);
	};

	// Validate required fields and role-specific requirements before saving.
	const validate = () => {
		const errs = {};
		if (!form.fullName?.trim()) errs.fullName = t('profile.errors.nameRequired');
		if (!form.username?.trim()) errs.username = t('profile.errors.usernameRequired');
		else if (form.username.trim().length < 3) errs.username = t('profile.errors.usernameTooShort');
		if (!form.email?.trim()) errs.email = t('profile.errors.emailRequired');
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = t('profile.errors.emailInvalid');

		if (form.role === 'Service Line Leader' && !form.serviceLine) {
			errs.serviceLine = t('adminUsers.serviceLineRequired');
		}
		if (form.role === 'Consultant' && (!form.areas || form.areas.length === 0)) {
			errs.areas = t('adminUsers.areasRequired');
		}

		setErrors(errs);
		return Object.keys(errs).length === 0;
	};

	// Validate, build a diff-only payload and persist the user changes.
	const handleSave = async () => {
		if (!validate()) return;
		if (usernameChanged && isCheckBlocking(usernameCheck.status)) {
			if (usernameCheck.status === AVAILABILITY_STATUS.UNAVAILABLE) {
				setErrors((prev) => ({ ...prev, username: t('profile.errors.usernameTaken') }));
			}
			return;
		}
		if (emailChanged && isCheckBlocking(emailCheck.status)) {
			if (emailCheck.status === AVAILABILITY_STATUS.UNAVAILABLE) {
				setErrors((prev) => ({ ...prev, email: t('profile.errors.emailTaken') }));
			}
			return;
		}

		setSaving(true);
		try {
			const payload = {};
			const initial = initialRef.current;

			if (form.fullName?.trim() !== initial.fullName) payload.full_name = form.fullName.trim();
			if (usernameChanged) payload.username = form.username.trim();
			if (emailChanged) payload.email_address = form.email.trim();
			if (form.locationId !== initial.locationId) {
				payload.location_id = form.locationId ? Number(form.locationId) : null;
			}
			if ((form.about || '') !== (initial.about || '')) payload.biography = form.about?.trim() || null;
			if (JSON.stringify(form.interests) !== JSON.stringify(initial.interests)) payload.interests = form.interests;
			if (JSON.stringify(form.goals) !== JSON.stringify(initial.goals)) payload.goals = form.goals;

			if (form.profileImgUrl === null) {
				payload.profile_img_url = null;
			} else if (form.profileImgUrl && form.profileImgUrl !== initial.profileImgUrl) {
				payload.profile_img_url = form.profileImgUrl;
			}

			if (form.isActive !== initial.isActive) payload.approve_member = form.isActive;
			if (form.emailConfirmed !== initial.emailConfirmed) payload.email_confirmed = form.emailConfirmed;
			if (form.gdprAccepted !== initial.gdprAccepted) payload.gdpr_accepted = form.gdprAccepted;

			if (form.role !== initial.role) {
				payload.user_role = form.role;
			}
			if (form.role === 'Service Line Leader' && form.serviceLine) {
				payload.service_line_id = Number(form.serviceLine);
			}
			if (form.role === 'Consultant' && form.areas.length > 0) {
				payload.areas = form.areas;
			}

			if (Object.keys(payload).length > 0) {
				await updateUser(guid, payload);
			}
			setIsDirty(false);
			if (onSaved) await onSaved();
			onClose();
		} catch (err) {
			const serverErrors = err.response?.data?.errors;
			if (serverErrors) {
				const mapped = {};
				for (const [key, msg] of Object.entries(serverErrors)) mapped[key] = msg;
				setErrors((prev) => ({ ...prev, ...mapped }));
			}
		} finally {
			setSaving(false);
		}
	};

	// Account creation timestamp (handles camelCase/snake_case).
	const joinedAt = profile?.createdAt || profile?.created_at;
	// Last login timestamp (handles the various field names).
	const lastLogin = profile?.lastLogin || profile?.last_login || profile?.last_online;

	// Format an ISO date string as a localized pt-PT date and time.
	const formatDate = (str) => {
		if (!str) return '—';
		return new Date(str).toLocaleDateString('pt-PT', {
			day: '2-digit', month: '2-digit', year: 'numeric',
			hour: '2-digit', minute: '2-digit',
		});
	};

	// Map service lines into select options.
	const serviceLineOptions = serviceLines.map((sl) => ({
		value: String(sl.service_line_id ?? sl.id),
		label: sl.service_line_name ?? sl.name ?? '',
	}));

	// Map areas into the shape expected by the area picker.
	const areaOptions = allAreas.map((a) => ({
		area_id: a.area_id ?? a.id,
		area_name: a.area_name ?? a.name ?? '',
	}));

	return (
		<aside ref={panelRef} className={`${styles.drawer} ${open ? styles.drawerOpen : ''}`} role="complementary" aria-label={t('profile.adminDetails')}>
			<div className={styles.drawerInner}>
			<div className={styles.drawerHeader}>
				<h3 className={styles.drawerTitle}>{t('profile.adminDetails')}</h3>
				<button type="button" className={styles.closeBtn} onClick={onClose} aria-label={t('shared.close')}>
					<Icon name="close" size={20} />
				</button>
			</div>

			<div className={styles.drawerBody}>
				{/* ── Profile Image ─────────────────────────── */}
				<div className={styles.avatarSection}>
					<div className={styles.avatarWrapper}>
						<div className={styles.avatar}>
							{profilePreviewUrl ? (
								<img src={profilePreviewUrl} alt={form.fullName || ''} className={styles.avatarImg} />
							) : (
								<span className={styles.avatarFallback}>{getInitials(form.fullName || '')}</span>
							)}
							<button
								type="button"
								className={styles.avatarOverlay}
								onClick={() => profileFileRef.current?.click()}
								disabled={profileUploading}
							>
								<Icon name="photo" size={20} color="white" />
							</button>
						</div>
						{(profilePreviewUrl || form.profileImgUrl) && (
							<button
								type="button"
								className={styles.avatarRemoveBtn}
								onClick={clearProfileImage}
								disabled={profileUploading}
								aria-label={t('register.profilePictureRemove')}
							>
								<Icon name="trash" size={12} color="var(--color-error)" />
							</button>
						)}
					</div>
					<input
						ref={profileFileRef}
						type="file"
						className="d-none"
						accept="image/jpeg,image/png,image/webp,image/gif"
						onChange={onProfileImageChange}
					/>
					{profileUploadError && (
						<span className={styles.avatarError}>{profileUploadError}</span>
					)}
				</div>

				{/* ── Profile Details ───────────────────────── */}
				<SectionDivider label={t('profile.profileDetails')} />

				<FormInput
					id="admin-fullname"
					label={t('profile.fullName')}
					value={form.fullName || ''}
					onChange={handleChange('fullName')}
					error={errors.fullName}
					required
				/>

				<div>
					<FormInput
						id="admin-username"
						label={t('profile.username')}
						value={form.username || ''}
						onChange={handleChange('username')}
						error={errors.username || (usernameCheck.status === AVAILABILITY_STATUS.UNAVAILABLE ? t('profile.errors.usernameTaken') : null)}
						required
					/>
					{usernameChanged && usernameCheck.status === AVAILABILITY_STATUS.CHECKING && (
						<small className="text-muted">{t('register.checkingAvailability')}</small>
					)}
					{usernameChanged && usernameCheck.status === AVAILABILITY_STATUS.AVAILABLE && (
						<small className="text-success">{t('register.usernameAvailable')}</small>
					)}
				</div>

				<div>
					<FormInput
						id="admin-email"
						label={t('profile.email')}
						value={form.email || ''}
						onChange={handleChange('email')}
						error={errors.email || (emailCheck.status === AVAILABILITY_STATUS.UNAVAILABLE ? t('profile.errors.emailTaken') : null)}
						required
					/>
					{emailChanged && emailCheck.status === AVAILABILITY_STATUS.CHECKING && (
						<small className="text-muted">{t('register.checkingAvailability')}</small>
					)}
					{emailChanged && emailCheck.status === AVAILABILITY_STATUS.AVAILABLE && (
						<small className="text-success">{t('register.emailAvailable')}</small>
					)}
				</div>

				<div>
					<label htmlFor="admin-location" className={styles.detailLabel}>{t('profile.location')}</label>
					<CustomSelect
						id="admin-location"
						name="locationId"
						value={form.locationId || ''}
						onChange={(e) => {
							const val = e.target.value;
							setForm((prev) => {
								const next = { ...prev, locationId: String(val) };
								checkDirty(next);
								return next;
							});
						}}
						options={locationOptions}
						placeholder={locationOptions.length === 0 ? t('profile.noLocationsAvailable') : t('profile.selectLocation')}
						disabled={locationOptions.length === 0}
					/>
				</div>

				<div>
					<label htmlFor="admin-about" className={styles.detailLabel}>{t('profile.aboutMe')}</label>
					<textarea
						id="admin-about"
						className={`form-control ${styles.textarea}`}
						rows={3}
						value={form.about || ''}
						onChange={handleChange('about')}
						placeholder={t('profile.aboutMePlaceholder')}
					/>
				</div>

				{/* ── Role & Structure ──────────────────────── */}
				<SectionDivider label={t('profile.roleAndStructure')} />

				{isAdminRole ? (
					<DetailRow label={t('profile.role')}>{t(`roles.${displayRole}`)}</DetailRow>
				) : (
					<div>
						<label htmlFor="admin-role" className={styles.detailLabel}>{t('profile.role')}</label>
						<CustomSelect
							id="admin-role"
							name="role"
							value={form.role || ''}
							onChange={handleRoleChange}
							options={CHANGEABLE_ROLES.map((r) => ({ value: r, label: t(`roles.${r}`) }))}
						/>
					</div>
				)}

				{form.role === 'Service Line Leader' && (
					<div>
						<label htmlFor="admin-sl" className={styles.detailLabel}>{t('shared.serviceLine')}</label>
						<CustomSelect
							id="admin-sl"
							name="serviceLine"
							value={form.serviceLine}
							onChange={handleChange('serviceLine')}
							options={serviceLineOptions}
							placeholder={t('adminUsers.selectServiceLine')}
							error={!!errors.serviceLine}
						/>
						{errors.serviceLine && (
							<small className="text-danger">{errors.serviceLine}</small>
						)}
					</div>
				)}

				{form.role === 'Consultant' && (
					<div>
						<label className={styles.detailLabel}>{t('register.areasOfExpertise')}</label>
						<AreaPickerList
							areas={areaOptions}
							selected={form.areas || []}
							onChange={(areas) => {
								setForm((prev) => {
									const next = { ...prev, areas };
									checkDirty(next);
									return next;
								});
								if (errors.areas) setErrors((prev) => ({ ...prev, areas: null }));
							}}
							error={errors.areas}
						/>
					</div>
				)}

				{/* ── Interests & Goals ─────────────────────── */}
				<SectionDivider label={t('profile.interestsAndGoals')} />

				<div>
					<label className={styles.detailLabel}>{t('profile.keyInterests')}</label>
					<div className={styles.chipList}>
						{(form.interests || []).map((interest, idx) => (
							<Chip key={idx} label={interest} onRemove={() => removeInterest(idx)} />
						))}
					</div>
					<div className={styles.addRow}>
						<input
							type="text"
							className={`form-control ${styles.addInput}`}
							value={interestInput}
							onChange={(e) => setInterestInput(e.target.value)}
							onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
							placeholder={t('profile.addInterest')}
						/>
						<Button size="sm" onClick={addInterest} disabled={!interestInput.trim()}>
							<Icon name="add" size={16} />
						</Button>
					</div>
				</div>

				<div>
					<label className={styles.detailLabel}>{t('profile.currentGoals')}</label>
					<div className={styles.goalsList}>
						{(form.goals || []).map((goal, idx) => (
							<div key={idx} className={styles.goalEditRow}>
								<span className={styles.goalText}>{goal}</span>
								<button type="button" className={styles.removeBtn} onClick={() => removeGoal(idx)} aria-label={`Remove goal`}>
									<Icon name="close" size={14} color="var(--color-error)" />
								</button>
							</div>
						))}
					</div>
					<div className={styles.addRow}>
						<input
							type="text"
							className={`form-control ${styles.addInput}`}
							value={goalInput}
							onChange={(e) => setGoalInput(e.target.value)}
							onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())}
							placeholder={t('profile.addGoal')}
						/>
						<Button size="sm" onClick={addGoal} disabled={!goalInput.trim()}>
							<Icon name="add" size={16} />
						</Button>
					</div>
				</div>

				{/* ── Account Settings ──────────────────────── */}
				<SectionDivider label={t('profile.accountSettings')} />

				<DetailRow label={t('profile.joinedAt')}>{formatDate(joinedAt)}</DetailRow>
				<DetailRow label={t('profile.lastLogin')}>{formatDate(lastLogin)}</DetailRow>

				<div className={styles.toggleGroup}>
					<label className={styles.toggleRow}>
						<span>{t('profile.isActive')}</span>
						<input
							type="checkbox"
							className="form-check-input"
							checked={form.isActive || false}
							onChange={handleChange('isActive')}
						/>
					</label>

					<label className={styles.toggleRow}>
						<span>{t('profile.emailConfirmed')}</span>
						<input
							type="checkbox"
							className="form-check-input"
							checked={form.emailConfirmed || false}
							onChange={handleChange('emailConfirmed')}
						/>
					</label>

					<label className={styles.toggleRow}>
						<span>{t('profile.gdprAccepted')}</span>
						<input
							type="checkbox"
							className="form-check-input"
							checked={form.gdprAccepted || false}
							onChange={handleChange('gdprAccepted')}
						/>
					</label>
				</div>
			</div>

			<div className={styles.drawerFooter}>
				<Button variant="outlined" onClick={onClose} disabled={saving}>
					{t('profile.cancel')}
				</Button>
				<Button
					onClick={handleSave}
					loading={saving}
					disabled={!isDirty || (usernameChanged && isCheckBlocking(usernameCheck.status)) || (emailChanged && isCheckBlocking(emailCheck.status))}
				>
					{t('profile.saveChanges')}
				</Button>
			</div>
			</div>

			<ConfirmToast
				open={showSllWarning}
				message={t('adminUsers.sllLastLeaderWarning')}
				confirmLabel={t('shared.yes')}
				cancelLabel={t('shared.no')}
				onConfirm={() => {
					setShowSllWarning(false);
					applyRoleChange(pendingRoleChange);
					setPendingRoleChange(null);
				}}
				onCancel={() => {
					setShowSllWarning(false);
					setPendingRoleChange(null);
				}}
			/>
		</aside>
	);
}
