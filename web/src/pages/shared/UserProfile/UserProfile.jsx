import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { useUser } from '../../../hooks/userContext';
import { updateProfile, getUserPublicProfile, getInPlatformProfile, getLocations } from '../../../features/users/api/profileApi';
import { updateUser } from '../../../features/users/api/usersApi';
import ContentCard, { CardHeader } from '../../../components/ContentCard/ContentCard';
import CustomSelect from '../../../components/CustomSelect/CustomSelect';
import Icon from '../../../components/Icons/Icons';
import Button from '../../../components/Button/Button';
import FormInput from '../../../components/FormInput/FormInput';
import ConfirmToast from '../../../components/ConfirmToast/ConfirmToast';
import InfoRow from '../../../components/InfoRow/InfoRow';
import TitleSelector from '../../../components/TitleSelector/TitleSelector';
import ProfileStatItem from '../../../components/ProfileStatItem/ProfileStatItem';
import AdminUserDrawer from './AdminUserDrawer';
import DetailPageSkeleton from '../../../components/Skeleton/DetailPageSkeleton';
import TranslatedText from '../../../components/TranslatedText/TranslatedText';
import { uploadProfileImageToTemp } from '../../../services/storage';
import { getEarnedBadgesForEvolution } from '../../../features/evolution/api/evolutionApi';
import { setBadgeFeatured } from '../../../features/gamification/api/gamificationApi';
import { getConsultantStats } from '../../../services/pointsService';
import { getApplicationsPaged } from '../../../features/applications/api/applicationsApi';
import { SHARED, ADMIN } from '../../../routes/paths';
import styles from './UserProfile.module.css';

// Format an ISO date string as a localized pt-PT date.
function formatDate(dateStr) {
	if (!dateStr) return '—';
	return new Date(dateStr).toLocaleDateString('pt-PT', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	});
}

// Derive avatar initials from a full name (first + last initial).
function getInitials(name = '') {
	const parts = name.trim().split(/\s+/);
	if (parts.length === 0 || !parts[0]) return '?';
	if (parts.length === 1) return parts[0][0].toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// User profile page: views or edits own/other user profiles (with admin drawer).
export default function UserProfile() {
	// Translation helper for localized labels and messages.
	const { t } = useTranslation();
	// Optional user guid from the route (absent for own profile).
	const { guid } = useParams();
	// Current location, used to detect edit mode.
	const location = useLocation();
	// Programmatic navigation helper.
	const navigate = useNavigate();
	// Authenticated user from the auth hook.
	const { user: authUser } = useAuth();
	// Context user and a function to refresh it.
	const { user: contextUser, refreshUser } = useUser();

	// Whether the page is in edit mode (path ends with /edit).
	const isEditMode = location.pathname.endsWith('/edit');
	// Whether this is the logged-in user's own profile.
	const isOwnProfile = !guid;
	// Whether this view is the admin user-management route (full profile) vs the
	// shared in-platform profile route (safe read-only subset).
	const isAdminRoute = location.pathname.startsWith('/admin/');
	// Whether the viewer is an Administrator.
	const isAdmin = contextUser?.role === 'Administrator' || authUser?.role === 'Administrator';
	// Loaded profile data being displayed/edited.
	const [profile, setProfile] = useState(null);
	// Whether the profile is loading.
	const [loading, setLoading] = useState(true);
	// Available locations for the edit form.
	const [locations, setLocations] = useState([]);

	// Editable form state in edit mode.
	const [form, setForm] = useState({});
	// Per-field validation errors.
	const [formErrors, setFormErrors] = useState({});
	// Whether the form has unsaved changes.
	const [isDirty, setIsDirty] = useState(false);
	// Whether a save request is in flight.
	const [saving, setSaving] = useState(false);
	// Whether a save just succeeded (drives the success toast).
	const [saveSuccess, setSaveSuccess] = useState(false);
	// Whether the unsaved-changes confirmation is shown.
	const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
	// Pending navigation target held while confirming leave.
	const pendingNavRef = useRef(null);

	// Whether the admin edit drawer is open.
	const [drawerOpen, setDrawerOpen] = useState(false);

	// Local preview URL for the (possibly unsaved) profile image.
	const [profilePreviewUrl, setProfilePreviewUrl] = useState('');
	// Whether a profile image upload is in progress.
	const [profileUploading, setProfileUploading] = useState(false);
	// Error message for a failed profile image upload.
	const [profileUploadError, setProfileUploadError] = useState('');
	// Ref to the hidden file input for profile image selection.
	const profileFileRef = useRef(null);

	// Editable public badge gallery (own consultant profile): the consultant
	// chooses which earned badges show on their public profile.
	const [galleryBadges, setGalleryBadges] = useState([]);
	// Id of the badge currently being toggled as featured.
	const [savingBadge, setSavingBadge] = useState(null);
	// Whether the gallery is in edit mode (reveals the per-badge visibility toggles).
	const [editingGallery, setEditingGallery] = useState(false);

	// Snapshot of the initial form values for dirty-checking.
	const initialFormRef = useRef({});

	// Map locations into valid select options.
	const locationOptions = useMemo(
		() => locations.map((l) => {
			const id = Number(l.location_id ?? l.id);
			const name = l.location_name ?? l.name ?? l.label;
			return Number.isInteger(id) && id > 0 && name ? { value: id, label: String(name) } : null;
		}).filter(Boolean),
		[locations],
	);

	// Resolve the profile's role from the various possible shapes.
	const userRole = profile?.role?.role_name || profile?.role_name || profile?.role || '';
	// Role flags driving conditional sections and stats.
	const isConsultant = userRole === 'Consultant';
	const isTm = userRole === 'Talent Manager';
	const isAdminRole = userRole === 'Administrator';

	// ── Load profile ─────────────────────────────────────────────
	// Load the profile: own profile from context, others from the public API.
	useEffect(() => {
		let ignore = false;
		setLoading(true);

		if (isOwnProfile) {
			if (contextUser) {
				setProfile(contextUser);
				setLoading(false);
				// contextUser carries the editable fields (bio, areas, streak) but not
				// the gamification counters, so the stat cards would read 0. Fetch the
				// real numbers from the consultant-accessible endpoints (same source as
				// the Points/Evolution pages) and merge them in.
				if (contextUser.role === 'Consultant') {
					Promise.all([
						getConsultantStats().catch(() => null),
						getApplicationsPaged({ state: ['Submitted', 'In validation', 'Accepted', 'Rejected'], page: 1, limit: 1 }).catch(() => null),
					]).then(([stats, apps]) => {
						if (ignore) return;
						setProfile((prev) => ({
							...prev,
							badgesCount: stats?.earnedBadges ?? prev?.badgesCount ?? 0,
							totalPoints: stats?.totalPoints ?? prev?.totalPoints ?? 0,
							applicationsCount: apps?.pagination?.total ?? prev?.applicationsCount ?? 0,
						}));
					});
				}
			}
		} else {
			// Admin management route gets the full profile; everywhere else gets
			// the read-only in-platform profile available to any authenticated user.
			const fetchProfile = isAdminRoute ? getUserPublicProfile : getInPlatformProfile;
			fetchProfile(guid)
				.then((data) => {
					if (!ignore) setProfile(data);
				})
				.catch(() => { })
				.finally(() => {
					if (!ignore) setLoading(false);
				});
		}

		return () => { ignore = true; };
	}, [guid, contextUser, isOwnProfile, isAdminRoute]);

	// Load the consultant's earned badges to power the editable public gallery.
	useEffect(() => {
		if (!isOwnProfile || !isConsultant) return undefined;
		let ignore = false;
		getEarnedBadgesForEvolution()
			.then((rows) => { if (!ignore) setGalleryBadges(rows || []); })
			.catch(() => { if (!ignore) setGalleryBadges([]); });
		return () => { ignore = true; };
	}, [isOwnProfile, isConsultant]);

	// Toggle whether a badge is featured on the public profile (optimistic update).
	const toggleBadgeFeatured = useCallback(async (b) => {
		if (!b.verificationLink) return;
		const next = !b.isFeatured;
		setSavingBadge(b.awardedBadgeId);
		setGalleryBadges((prev) => prev.map((x) => (x.awardedBadgeId === b.awardedBadgeId ? { ...x, isFeatured: next } : x)));
		try {
			await setBadgeFeatured(b.verificationLink, next);
		} catch {
			setGalleryBadges((prev) => prev.map((x) => (x.awardedBadgeId === b.awardedBadgeId ? { ...x, isFeatured: !next } : x)));
		} finally {
			setSavingBadge(null);
		}
	}, []);

	// Load available locations once on mount.
	useEffect(() => {
		let ignore = false;
		getLocations()
			.then((data) => { if (!ignore) setLocations(data); })
			.catch(() => { if (!ignore) setLocations([]); });
		return () => { ignore = true; };
	}, []);

	// ── Init form in edit mode ───────────────────────────────────
	// Populate the form from the profile when entering edit mode.
	useEffect(() => {
		if (isEditMode && profile) {
			const locId = profile.location_id ?? profile.locationId ?? '';
			const initial = {
				fullName: profile.fullName || profile.full_name || '',
				username: profile.username || '',
				email: profile.email || '',
				locationId: locId ? String(locId) : '',
				about: profile.biography || profile.about || profile.bio || '',
				profileImgUrl: profile.profileImg || profile.profile_img_url || '',
			};
			setForm(initial);
			initialFormRef.current = JSON.parse(JSON.stringify(initial));
			setProfilePreviewUrl(initial.profileImgUrl || '');
			setProfileUploadError('');
			setIsDirty(false);
			setFormErrors({});
			setSaveSuccess(false);
		}
	}, [isEditMode, profile]);

	// ── Dirty check ──────────────────────────────────────────────
	// Set the dirty flag by comparing the form against its initial snapshot.
	const checkDirty = useCallback((newForm) => {
		setIsDirty(JSON.stringify(newForm) !== JSON.stringify(initialFormRef.current));
	}, []);

	// Curried change handler that updates one field and rechecks dirtiness.
	const handleChange = (field) => (e) => {
		const value = e.target.value;
		setForm((prev) => {
			const next = { ...prev, [field]: value };
			checkDirty(next);
			return next;
		});
		if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: null }));
	};

	// ── Profile image ────────────────────────────────────────────
	// Handle file selection: preview locally, upload, and surface specific errors.
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
		} catch (err) {
			URL.revokeObjectURL(localUrl);
			setProfilePreviewUrl('');
			// Surface the actual reason so the user knows why (size/format/config).
			const byCode = {
				PROFILE_IMAGE_TOO_LARGE: t('register.profilePictureTooLarge', { sizeMb: 2 }),
				PROFILE_IMAGE_INVALID_FORMAT: t('register.profilePictureInvalidFormat'),
				SUPABASE_CONFIG_MISSING: t('register.profilePictureConfigMissing'),
			};
			setProfileUploadError(byCode[err?.code] || t('register.profilePictureUploadFailed'));
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

	// ── Validation ───────────────────────────────────────────────
	// Validate required fields before saving.
	const validate = () => {
		const errs = {};
		if (!form.fullName?.trim()) errs.fullName = t('profile.errors.nameRequired');
		setFormErrors(errs);
		return Object.keys(errs).length === 0;
	};

	// ── Reload profile from server ───────────────────────────────
	// Re-fetch the profile after a save (own via context, others via API).
	const reloadProfile = useCallback(async () => {
		if (isOwnProfile) {
			await refreshUser();
		} else {
			const data = await getUserPublicProfile(guid);
			setProfile(data);
		}
	}, [isOwnProfile, guid, refreshUser]);

	// ── Save ─────────────────────────────────────────────────────
	// Validate, build the payload, persist the profile and navigate back.
	const handleSave = async () => {
		if (!validate()) return;
		setSaving(true);
		try {
			const payload = {
				full_name: form.fullName?.trim(),
			};
			if (form.about?.trim()) payload.biography = form.about.trim();
			if (form.locationId) payload.location_id = Number(form.locationId);

			if (form.profileImgUrl === null) {
				payload.profile_img_url = null;
			} else if (form.profileImgUrl && form.profileImgUrl !== initialFormRef.current.profileImgUrl) {
				payload.profile_img_url = form.profileImgUrl;
			}

			if (isOwnProfile) {
				await updateProfile(payload);
			} else {
				await updateUser(guid, payload);
			}
			setIsDirty(false);
			setSaveSuccess(true);
			await reloadProfile();
			const basePath = isOwnProfile ? SHARED.PROFILE : `${ADMIN.USERS}/${guid}`;
			navigate(basePath, { replace: true });
		} catch (err) {
			const serverErrors = err.response?.data?.errors;
			if (serverErrors) {
				const mapped = {};
				for (const [key, msg] of Object.entries(serverErrors)) mapped[key] = msg;
				setFormErrors((prev) => ({ ...prev, ...mapped }));
			}
		} finally {
			setSaving(false);
		}
	};

	// ── Navigation ───────────────────────────────────────────────
	// Enter edit mode for the user's own profile.
	const handleEdit = () => {
		if (isOwnProfile) {
			navigate(`${SHARED.PROFILE}/edit`);
		}
	};

	// Cancel editing, prompting to confirm if there are unsaved changes.
	const handleCancel = () => {
		const viewPath = isOwnProfile ? SHARED.PROFILE : `${ADMIN.USERS}/${guid}`;
		if (isDirty) {
			pendingNavRef.current = viewPath;
			setShowLeaveConfirm(true);
		} else {
			navigate(viewPath);
		}
	};

	// Confirm leaving with unsaved changes and navigate to the pending target.
	const confirmLeave = () => {
		setIsDirty(false);
		setShowLeaveConfirm(false);
		if (pendingNavRef.current) {
			navigate(pendingNavRef.current);
			pendingNavRef.current = null;
		}
	};

	// Dismiss the leave confirmation and clear the pending navigation.
	const cancelLeave = () => {
		setShowLeaveConfirm(false);
		pendingNavRef.current = null;
	};

	// Warn before unloading the tab while there are unsaved edits.
	useEffect(() => {
		if (!isDirty || !isEditMode) return;
		const handler = (e) => {
			e.preventDefault();
			e.returnValue = '';
		};
		window.addEventListener('beforeunload', handler);
		return () => window.removeEventListener('beforeunload', handler);
	}, [isDirty, isEditMode]);

	// Auto-hide the success toast a few seconds after a successful save.
	useEffect(() => {
		if (!saveSuccess) return;
		const timer = setTimeout(() => setSaveSuccess(false), 3500);
		return () => clearTimeout(timer);
	}, [saveSuccess]);

	// ── Derived display values ───────────────────────────────────
	// Computed read-only values for rendering the profile (name, location, etc.).
	const displayName = profile?.fullName || profile?.full_name || profile?.username || '';
	const displayEmail = profile?.email || '';
	const displayLocation = profile?.location?.location_name || profile?.location?.name || profile?.location || '';
	const displayLanguage = profile?.lang?.name || '';
	const displayServiceLine = profile?.serviceLine?.name || profile?.service_line?.name || '';
	const displayAreas = isConsultant
		? (profile?.areas || []).map((a) => a.name || a.area_name).filter(Boolean)
		: [];
	const displayAbout = profile?.biography || profile?.about || profile?.bio || '';
	const memberSince = profile?.createdAt || profile?.created_at || '';
	const photoUrl = profile?.profileImg || profile?.profile_img_url || profile?.photoUrl || profile?.photo_url || null;
	const showServiceLine = !isTm && !isAdminRole && !!displayServiceLine;

	// ── Stats by role ────────────────────────────────────────────
	// Build the role-specific list of profile stat cards.
	const getStats = () => {
		const base = [
			{ icon: 'badge', accentColor: 'var(--color-blue-on-soft)', accentBg: 'var(--color-blue-soft)', value: profile?.badgesCount ?? profile?.badges_count ?? 0, label: t('profile.badgesEarned'), footer: t('profile.statFooterBadges') },
		];

		if (isConsultant) {
			return [
				...base,
				{ icon: 'paper', accentColor: 'var(--color-orange-on-soft)', accentBg: 'var(--color-orange-soft)', value: profile?.applicationsCount ?? profile?.applications_count ?? 0, label: t('profile.applicationsCompleted'), footer: t('profile.statFooterApplications') },
				{ icon: 'star-points', accentColor: 'var(--color-green-on-soft)', accentBg: 'var(--color-green-soft)', value: profile?.totalPoints ?? profile?.total_points ?? 0, label: t('profile.totalPoints'), footer: t('profile.statFooterPoints') },
				{ icon: 'fire', accentColor: 'var(--color-red-on-soft)', accentBg: 'var(--color-red-soft)', value: profile?.currentStreakDays ?? profile?.current_streak_days ?? 0, label: t('profile.currentStreak'), footer: t('profile.statFooterStreak') },
			];
		}

		if (isAdminRole) return base;

		// TM / SLL are reviewers, not badge earners — show only reviewer stats.
		return [
			{ icon: 'tabler_users', accentColor: 'var(--color-orange-on-soft)', accentBg: 'var(--color-orange-soft)', value: profile?.teamMembersCount ?? profile?.team_members_count ?? 0, label: t('profile.teamMembers'), footer: t('profile.statFooterTeam') },
			{ icon: 'check_circle', accentColor: 'var(--color-green-on-soft)', accentBg: 'var(--color-green-soft)', value: profile?.validationsCount ?? profile?.validations_count ?? 0, label: t('profile.validationsDone'), footer: t('profile.statFooterValidations') },
		];
	};

	// ── Loading / error states ───────────────────────────────────
	if (loading) {
		return (
			<div className={styles.page}>
				<DetailPageSkeleton />
			</div>
		);
	}

	if (!profile) {
		return (
			<div className={styles.page}>
				<p className="text-muted">{t('profile.notFound')}</p>
			</div>
		);
	}

	// Page heading text (own vs. another user's profile).
	const pageTitle = isOwnProfile ? t('profile.myProfile') : t('profile.profileOf', { name: displayName });
	// Resolved stat cards for the current role.
	const stats = getStats();

	return (
		<div className={styles.pageLayout}>
		<div className={styles.page}>
			{/* ── Page title ─────────────────────────────────── */}
			<h1 className={styles.pageTitle}>{pageTitle}</h1>

			{/* ── Info card (avatar + details + about me) ────── */}
			<ContentCard className={styles.infoCard} padding={32}>
				<div className={styles.infoCardInner}>
					<div className={styles.infoLeft}>
						<div className={styles.avatarWrapper}>
							<div className={styles.avatar}>
								{(isEditMode ? profilePreviewUrl : photoUrl) ? (
									<img src={isEditMode ? profilePreviewUrl : photoUrl} alt={displayName} className={styles.avatarImg} />
								) : (
									<span className={styles.avatarFallback}>{getInitials(displayName)}</span>
								)}
								{isEditMode && (
									<button
										type="button"
										className={styles.avatarOverlay}
										onClick={() => profileFileRef.current?.click()}
										disabled={profileUploading}
									>
										<Icon name="photo" size={24} color="white" />
									</button>
								)}
							</div>
							{isEditMode && (profilePreviewUrl || form.profileImgUrl) && (
								<button
									type="button"
									className={styles.avatarRemoveBtn}
									onClick={clearProfileImage}
									disabled={profileUploading}
									aria-label={t('register.profilePictureRemove')}
								>
									<Icon name="trash" size={14} color="var(--color-error)" />
								</button>
							)}
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

						<div className={styles.infoDetails}>
							{isEditMode ? (
								<>
									<div className="row g-3 mb-2">
										<div className={isOwnProfile ? 'col-sm-6' : 'col-sm-12'}>
											<FormInput
												id="fullName"
												label={t('profile.fullName')}
												value={form.fullName || ''}
												onChange={handleChange('fullName')}
												error={formErrors.fullName}
												required
											/>
										</div>
										{isOwnProfile && (
											<div className="col-sm-6">
												<FormInput
													id="username"
													label={t('profile.username')}
													value={form.username || ''}
													disabled
													required
												/>
											</div>
										)}
									</div>
									<div className="row g-3">
										{isOwnProfile && (
											<div className="col-sm-6">
												<FormInput
													id="email"
													label={t('profile.email')}
													value={displayEmail}
													disabled
												/>
											</div>
										)}
										<div className={isOwnProfile ? 'col-sm-6' : 'col-sm-12'}>
											<label htmlFor="profileLocation" className={`form-label ${styles.fieldLabel}`}>
												{t('profile.location')}
											</label>
											<CustomSelect
												id="profileLocation"
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
									</div>
								</>
							) : (
								<>
									<h2 className={styles.userName}>{displayName}</h2>
									<div className={styles.infoRows}>
										{displayEmail && <InfoRow icon="email">{displayEmail}</InfoRow>}
										{(displayLocation || displayLanguage) && (
											<div className={styles.pairedRow}>
												{displayLocation && <InfoRow icon="location_on">{displayLocation}</InfoRow>}
												{displayLanguage && <InfoRow icon="language">{displayLanguage}</InfoRow>}
											</div>
										)}
										{(showServiceLine || displayAreas.length > 0) && (
											<div className={styles.pairedRow}>
												{showServiceLine && <InfoRow icon="service-line">{displayServiceLine}</InfoRow>}
												{displayAreas.length > 0 && <InfoRow icon="area">{displayAreas.join(' · ')}</InfoRow>}
											</div>
										)}
									</div>
								</>
							)}
						</div>
					</div>

					<div className={styles.infoActions}>
						{/* Teams expects the e-mail (UPN) literally in `users`; the "@" is
						    kept unencoded because %40 prevents Teams from resolving the person. */}
						{!isOwnProfile && displayEmail && (
							<a
								href={`https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(displayEmail).replace(/%40/g, '@')}`}
								target="_blank"
								rel="noopener noreferrer"
								className={styles.teamsBtn}
								aria-label={t('profile.messageOnTeams')}
							>
								<Icon name="send" size={16} color="#fff" />
								<span>{t('profile.messageOnTeams')}</span>
							</a>
						)}
						{!isEditMode && (isOwnProfile || isAdmin) && (
							<button
								type="button"
								className={styles.editBtn}
								onClick={isAdmin && !isOwnProfile ? () => setDrawerOpen(true) : handleEdit}
								aria-label={t('profile.editProfile')}
							>
								<Icon name="pencil" size={20} color="var(--color-on-background)" />
							</button>
						)}
					</div>
				</div>

				{/* About Me — inside the info card */}
				<div className={styles.aboutSection}>
					<CardHeader
						icon="user"
						iconBg="var(--color-blue-soft)"
						iconColor="var(--color-blue-on-soft)"
						title={t('profile.aboutMe')}
					/>
					<div className={styles.sectionBody}>
						{isEditMode ? (
							<textarea
								className={`form-control ${styles.textarea}`}
								rows={4}
								value={form.about || ''}
								onChange={handleChange('about')}
								placeholder={t('profile.aboutMePlaceholder')}
							/>
						) : (
							<p className={styles.aboutText}>
								{displayAbout ? <TranslatedText text={displayAbout} /> : t('profile.noAboutMe')}
							</p>
						)}
					</div>
				</div>
			</ContentCard>

			{/* ── Title selector — the consultant picks a title they own (from a
			    special badge or a redeemed reward) to display on their profile ──── */}
			{isConsultant && isOwnProfile && <TitleSelector />}

			{/* ── Save / Cancel buttons (edit mode) — above the stats ── */}
			{isEditMode && (
				<div className={styles.actionBar}>
					<Button variant="outlined" onClick={handleCancel} disabled={saving}>
						{t('profile.cancel')}
					</Button>
					<Button onClick={handleSave} loading={saving} disabled={!isDirty}>
						{t('profile.saveChanges')}
					</Button>
				</div>
			)}

			{/* ── Statistics section ─────────────────────────── */}
			<h2 className={styles.sectionTitle}>{t('profile.statistics')}</h2>
			<div className={styles.statsGrid}>
				{stats.map((stat, idx) => (
					<ProfileStatItem key={idx} {...stat} />
				))}
			</div>

			{/* ── Badge gallery — own consultant profile (curate via edit) ── */}
			{isConsultant && isOwnProfile && (
				<ContentCard className={styles.section}>
					<div className={styles.galleryHeaderRow}>
						<CardHeader
							icon="badge"
							iconBg="var(--color-primary-soft)"
							iconColor="var(--color-primary)"
							title={t('profile.badgeGalleryTitle')}
						/>
						{galleryBadges.length > 0 && (
							<Button
								variant={editingGallery ? 'filled' : 'outlined'}
								color="primary"
								size="sm"
								onClick={() => setEditingGallery((v) => !v)}
							>
								<Icon name={editingGallery ? 'check' : 'pencil'} size={14} />
								{t(editingGallery ? 'profile.galleryDone' : 'profile.galleryEdit')}
							</Button>
						)}
					</div>
					{editingGallery && <p className={styles.galleryHint}>{t('profile.badgeGalleryHint')}</p>}
					{galleryBadges.length === 0 ? (
						<p className={styles.emptyText}>{t('profile.noBadgesYet')}</p>
					) : (() => {
						// View mode shows only the selected badges; edit mode reveals
						// every earned badge so the consultant can pick which to display.
						const visible = editingGallery ? galleryBadges : galleryBadges.filter((b) => b.isFeatured);
						if (visible.length === 0) {
							return <p className={styles.emptyText}>{t('profile.galleryNoneSelected')}</p>;
						}
						return (
							<div className={styles.galleryGrid}>
								{visible.map((b) => {
									const badge = b.badge || {};
									const on = !!b.isFeatured;
									return (
										<div
											key={b.awardedBadgeId}
											className={`${styles.galleryItem} ${editingGallery && on ? styles.galleryItemOn : ''} ${editingGallery ? styles.galleryItemEditable : ''}`}
											role={editingGallery ? 'button' : undefined}
											tabIndex={editingGallery ? 0 : undefined}
											aria-pressed={editingGallery ? on : undefined}
											aria-busy={savingBadge === b.awardedBadgeId || undefined}
											onClick={editingGallery ? () => toggleBadgeFeatured(b) : undefined}
											onKeyDown={editingGallery ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleBadgeFeatured(b); } } : undefined}
										>
											{editingGallery && on && (
												<span className={styles.galleryCheck} aria-label={t('profile.onPublicProfile')}>
													<Icon name="check" size={14} color="#fff" aria-hidden="true" />
												</span>
											)}
											<div className={styles.galleryThumb}>
												{badge.imageUrl ? <img src={badge.imageUrl} alt={badge.title || ''} /> : <Icon name="badge" size={28} color="var(--color-secondary)" />}
											</div>
											<span className={styles.galleryName}>{badge.title || '—'}</span>
										</div>
									);
								})}
							</div>
						);
					})()}
				</ContentCard>
			)}

			{/* ── Badge gallery — viewing another consultant (read-only, selected only) ── */}
			{isConsultant && !isOwnProfile && (
				<ContentCard className={styles.section}>
					<CardHeader
						icon="badge"
						iconBg="var(--color-primary-soft)"
						iconColor="var(--color-primary)"
						title={t('profile.badgeGalleryTitle')}
					/>
					{(!profile?.galleryBadges || profile.galleryBadges.length === 0) ? (
						<p className={styles.emptyText}>{t('profile.galleryEmptyPublic')}</p>
					) : (
						<div className={styles.galleryGrid}>
							{profile.galleryBadges.map((b) => {
								const inner = (
									<>
										<div className={styles.galleryThumb}>
											{b.imageUrl ? <img src={b.imageUrl} alt={b.title || ''} /> : <Icon name="badge" size={28} color="var(--color-secondary)" />}
										</div>
										<span className={styles.galleryName}>{b.title || '—'}</span>
									</>
								);
								return b.slug ? (
									<Link
										key={b.awardedBadgeId}
										to={SHARED.BADGE_DETAIL.replace(':slug', b.slug)}
										className={`${styles.galleryItem} ${styles.galleryItemLink}`}
									>
										{inner}
									</Link>
								) : (
									<div key={b.awardedBadgeId} className={styles.galleryItem}>{inner}</div>
								);
							})}
						</div>
					)}
				</ContentCard>
			)}


			{/* ── Success toast ───────────────────────────────── */}
			{saveSuccess && (
				<div className={styles.successToast} role="status">
					<Icon name="check_circle" size={20} color="var(--color-success)" />
					<span>{t('profile.profileUpdated')}</span>
				</div>
			)}

			{/* ── Unsaved changes confirm ─────────────────────── */}
			<ConfirmToast
				open={showLeaveConfirm}
				message={t('profile.unsavedChanges')}
				confirmLabel={t('profile.leave')}
				cancelLabel={t('profile.stay')}
				onConfirm={confirmLeave}
				onCancel={cancelLeave}
			/>
		</div>

		{/* ── Admin drawer (aside) ────────────────────────── */}
		{isAdmin && !isOwnProfile && (
			<AdminUserDrawer
				open={drawerOpen}
				onClose={() => setDrawerOpen(false)}
				onSaved={reloadProfile}
				profile={profile}
				guid={guid}
			/>
		)}
		</div>
	);
}
