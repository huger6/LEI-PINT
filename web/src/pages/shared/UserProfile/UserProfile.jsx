import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { useUser } from '../../../hooks/userContext';
import { updateProfile, getUserPublicProfile, getLocations } from '../../../features/users/api/profileApi';
import { updateUser } from '../../../features/users/api/usersApi';
import ContentCard, { CardHeader } from '../../../components/ContentCard/ContentCard';
import CustomSelect from '../../../components/CustomSelect/CustomSelect';
import Icon from '../../../components/Icons/Icons';
import Button from '../../../components/Button/Button';
import FormInput from '../../../components/FormInput/FormInput';
import ConfirmToast from '../../../components/ConfirmToast/ConfirmToast';
import InfoRow from '../../../components/InfoRow/InfoRow';
import Chip from '../../../components/Chip/Chip';
import BulletItem from '../../../components/BulletItem/BulletItem';
import CheckItem from '../../../components/CheckItem/CheckItem';
import ProfileStatItem from '../../../components/ProfileStatItem/ProfileStatItem';
import AdminUserDrawer from './AdminUserDrawer';
import DetailPageSkeleton from '../../../components/Skeleton/DetailPageSkeleton';
import { uploadProfileImageToTemp } from '../../../services/storage';
import { SHARED, ADMIN } from '../../../routes/paths';
import styles from './UserProfile.module.css';

function formatDate(dateStr) {
	if (!dateStr) return '—';
	return new Date(dateStr).toLocaleDateString('pt-PT', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	});
}

function getInitials(name = '') {
	const parts = name.trim().split(/\s+/);
	if (parts.length === 0 || !parts[0]) return '?';
	if (parts.length === 1) return parts[0][0].toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function UserProfile() {
	const { t } = useTranslation();
	const { guid } = useParams();
	const location = useLocation();
	const navigate = useNavigate();
	const { user: authUser } = useAuth();
	const { user: contextUser, refreshUser } = useUser();

	const isEditMode = location.pathname.endsWith('/edit');
	const isOwnProfile = !guid;
	const isAdmin = contextUser?.role === 'Administrator' || authUser?.role === 'Administrator';
	const [profile, setProfile] = useState(null);
	const [loading, setLoading] = useState(true);
	const [locations, setLocations] = useState([]);

	const [form, setForm] = useState({});
	const [formErrors, setFormErrors] = useState({});
	const [isDirty, setIsDirty] = useState(false);
	const [saving, setSaving] = useState(false);
	const [saveSuccess, setSaveSuccess] = useState(false);
	const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
	const pendingNavRef = useRef(null);

	const [drawerOpen, setDrawerOpen] = useState(false);
	const [interestInput, setInterestInput] = useState('');
	const [goalInput, setGoalInput] = useState('');

	const [profilePreviewUrl, setProfilePreviewUrl] = useState('');
	const [profileUploading, setProfileUploading] = useState(false);
	const [profileUploadError, setProfileUploadError] = useState('');
	const profileFileRef = useRef(null);

	const initialFormRef = useRef({});

	const locationOptions = useMemo(
		() => locations.map((l) => {
			const id = Number(l.location_id ?? l.id);
			const name = l.location_name ?? l.name ?? l.label;
			return Number.isInteger(id) && id > 0 && name ? { value: id, label: String(name) } : null;
		}).filter(Boolean),
		[locations],
	);

	const userRole = profile?.role?.role_name || profile?.role_name || profile?.role || '';
	const isConsultant = userRole === 'Consultant';
	const isTm = userRole === 'Talent Manager';
	const isAdminRole = userRole === 'Administrator';

	// ── Load profile ─────────────────────────────────────────────
	useEffect(() => {
		let ignore = false;
		setLoading(true);

		if (isOwnProfile) {
			if (contextUser) {
				setProfile(contextUser);
				setLoading(false);
			}
		} else {
			getUserPublicProfile(guid)
				.then((data) => {
					if (!ignore) setProfile(data);
				})
				.catch(() => { })
				.finally(() => {
					if (!ignore) setLoading(false);
				});
		}

		return () => { ignore = true; };
	}, [guid, contextUser, isOwnProfile]);

	useEffect(() => {
		let ignore = false;
		getLocations()
			.then((data) => { if (!ignore) setLocations(data); })
			.catch(() => { if (!ignore) setLocations([]); });
		return () => { ignore = true; };
	}, []);

	// ── Init form in edit mode ───────────────────────────────────
	useEffect(() => {
		if (isEditMode && profile) {
			const locId = profile.location_id ?? profile.locationId ?? '';
			const initial = {
				fullName: profile.fullName || profile.full_name || '',
				username: profile.username || '',
				email: profile.email || '',
				locationId: locId ? String(locId) : '',
				about: profile.biography || profile.about || profile.bio || '',
				interests: [...(profile.interests || [])],
				goals: [...(profile.goals || [])],
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
	const checkDirty = useCallback((newForm) => {
		setIsDirty(JSON.stringify(newForm) !== JSON.stringify(initialFormRef.current));
	}, []);

	const handleChange = (field) => (e) => {
		const value = e.target.value;
		setForm((prev) => {
			const next = { ...prev, [field]: value };
			checkDirty(next);
			return next;
		});
		if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: null }));
	};

	// ── Interest chips ───────────────────────────────────────────
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

	const removeInterest = (idx) => {
		setForm((prev) => {
			const next = { ...prev, interests: prev.interests.filter((_, i) => i !== idx) };
			checkDirty(next);
			return next;
		});
	};

	// ── Goals list ───────────────────────────────────────────────
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

	const removeGoal = (idx) => {
		setForm((prev) => {
			const next = { ...prev, goals: prev.goals.filter((_, i) => i !== idx) };
			checkDirty(next);
			return next;
		});
	};

	// ── Profile image ────────────────────────────────────────────
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
	const validate = () => {
		const errs = {};
		if (!form.fullName?.trim()) errs.fullName = t('profile.errors.nameRequired');
		setFormErrors(errs);
		return Object.keys(errs).length === 0;
	};

	// ── Reload profile from server ───────────────────────────────
	const reloadProfile = useCallback(async () => {
		if (isOwnProfile) {
			await refreshUser();
		} else {
			const data = await getUserPublicProfile(guid);
			setProfile(data);
		}
	}, [isOwnProfile, guid, refreshUser]);

	// ── Save ─────────────────────────────────────────────────────
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
	const handleEdit = () => {
		if (isOwnProfile) {
			navigate(`${SHARED.PROFILE}/edit`);
		}
	};

	const handleCancel = () => {
		const viewPath = isOwnProfile ? SHARED.PROFILE : `${ADMIN.USERS}/${guid}`;
		if (isDirty) {
			pendingNavRef.current = viewPath;
			setShowLeaveConfirm(true);
		} else {
			navigate(viewPath);
		}
	};

	const confirmLeave = () => {
		setIsDirty(false);
		setShowLeaveConfirm(false);
		if (pendingNavRef.current) {
			navigate(pendingNavRef.current);
			pendingNavRef.current = null;
		}
	};

	const cancelLeave = () => {
		setShowLeaveConfirm(false);
		pendingNavRef.current = null;
	};

	useEffect(() => {
		if (!isDirty || !isEditMode) return;
		const handler = (e) => {
			e.preventDefault();
			e.returnValue = '';
		};
		window.addEventListener('beforeunload', handler);
		return () => window.removeEventListener('beforeunload', handler);
	}, [isDirty, isEditMode]);

	useEffect(() => {
		if (!saveSuccess) return;
		const timer = setTimeout(() => setSaveSuccess(false), 3500);
		return () => clearTimeout(timer);
	}, [saveSuccess]);

	// ── Derived display values ───────────────────────────────────
	const displayName = profile?.fullName || profile?.full_name || profile?.username || '';
	const displayEmail = profile?.email || '';
	const displayLocation = profile?.location?.location_name || profile?.location?.name || profile?.location || '';
	const displayLanguage = profile?.lang?.name || '';
	const displayServiceLine = profile?.serviceLine?.name || profile?.service_line?.name || '';
	const displayAreas = isConsultant
		? (profile?.areas || []).map((a) => a.name || a.area_name).filter(Boolean)
		: [];
	const displayAbout = profile?.biography || profile?.about || profile?.bio || '';
	const displayInterests = profile?.interests || [];
	const displayGoals = profile?.goals || [];
	const displayAchievements = profile?.achievements || [];
	const memberSince = profile?.createdAt || profile?.created_at || '';
	const photoUrl = profile?.profileImg || profile?.profile_img_url || profile?.photoUrl || profile?.photo_url || null;
	const showServiceLine = !isTm && !isAdminRole && !!displayServiceLine;

	// ── Stats by role ────────────────────────────────────────────
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

	const pageTitle = isOwnProfile ? t('profile.myProfile') : t('profile.profileOf', { name: displayName });
	const stats = getStats();

	const badgesPath = isOwnProfile ? SHARED.BADGES : SHARED.BADGES;

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
								{displayAbout || t('profile.noAboutMe')}
							</p>
						)}
					</div>
				</div>
			</ContentCard>

			{/* ── Content sections (2-column grid) — consultant-only ──── */}
			{isConsultant && (
			<div className="row g-4">
				<div className="col-md-6">
					<ContentCard>
						<CardHeader
							icon="trophy"
							iconBg="var(--color-red-soft)"
							iconColor="var(--color-red-on-soft)"
							title={t('profile.recentAchievements')}
						/>
						<div className={styles.sectionBody}>
							{displayAchievements.length > 0 ? (
								<div className={styles.achievementsList}>
									{displayAchievements.map((item, idx) => (
										<CheckItem key={idx}>{item.description || item.title || item}</CheckItem>
									))}
								</div>
							) : (
								<p className={styles.emptyText}>{t('profile.noAchievements')}</p>
							)}
						</div>
					</ContentCard>
				</div>

				<div className="col-md-6">
					<ContentCard>
						<CardHeader
							icon="target"
							iconBg="var(--color-green-soft)"
							iconColor="var(--color-green-on-soft)"
							title={t('profile.currentGoals')}
						/>
						<div className={styles.sectionBody}>
							{isEditMode ? (
								<>
									<div className={styles.goalsList}>
										{(form.goals || []).map((goal, idx) => (
											<div key={idx} className={styles.goalEditRow}>
												<span className={styles.goalText}>{goal}</span>
												<button type="button" className={styles.removeBtn} onClick={() => removeGoal(idx)} aria-label={`Remove goal`}>
													<Icon name="close" size={16} color="var(--color-error)" />
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
								</>
							) : displayGoals.length > 0 ? (
								<div className={styles.goalsList}>
									{displayGoals.map((goal, idx) => (
										<BulletItem key={idx}>{goal}</BulletItem>
									))}
								</div>
							) : (
								<p className={styles.emptyText}>{t('profile.noGoals')}</p>
							)}
						</div>
					</ContentCard>
				</div>
			</div>
			)}

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

			{/* ── Badge gallery link ──────────────────────────── */}
			{isConsultant && (
			<ContentCard className={styles.badgeGalleryCard}>
				<Link to={badgesPath} className={styles.badgeGalleryLink}>
					<div className={styles.badgeGalleryIcon}>
						<Icon name="badge" size={32} color="var(--color-primary)" />
					</div>
					<div className={styles.badgeGalleryText}>
						<span className={styles.badgeGalleryTitle}>{t('profile.viewBadgeGallery')}</span>
						<span className={styles.badgeGalleryDesc}>{t('profile.viewBadgeGalleryDesc')}</span>
					</div>
					<div className={styles.badgeGalleryArrow}>
						<Icon name="chevron_forward" size={20} color="var(--color-outline)" />
					</div>
				</Link>
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
