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
import AdminUserDrawer from './AdminUserDrawer';
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

function InfoRow({ icon, children }) {
	return (
		<div className={styles.infoRow}>
			<Icon name={icon} size={20} color="var(--color-outline)" />
			<span className={styles.infoText}>{children}</span>
		</div>
	);
}

function Chip({ label, onRemove }) {
	return (
		<span className={styles.chip}>
			<span className={styles.chipLabel}>{label}</span>
			{onRemove && (
				<button type="button" className={styles.chipRemove} onClick={onRemove} aria-label={`Remove ${label}`}>
					<Icon name="close" size={14} color="var(--color-blue-on-soft)" />
				</button>
			)}
		</span>
	);
}

function BulletItem({ children, color = 'var(--color-green-on-soft)' }) {
	return (
		<div className={styles.bulletItem}>
			<span className={styles.bullet} style={{ color }}>•</span>
			<span className={styles.bulletText}>{children}</span>
		</div>
	);
}

function CheckItem({ children, color = 'var(--color-red-on-soft)' }) {
	return (
		<div className={styles.checkItem}>
			<Icon name="check" size={16} color={color} />
			<span className={styles.checkText}>{children}</span>
		</div>
	);
}

function ProfileStatItem({ icon, iconColor, value, label }) {
	return (
		<div className={styles.statItem}>
			<Icon name={icon} size={24} color={iconColor} />
			<span className={styles.statValue}>{value ?? '—'}</span>
			<span className={styles.statLabel}>{label}</span>
		</div>
	);
}

export default function UserProfile() {
	const { t } = useTranslation();
	const { guid } = useParams();
	const location = useLocation();
	const navigate = useNavigate();
	const { user: authUser } = useAuth();
	const { user: contextUser } = useUser();

	const isEditMode = location.pathname.endsWith('/edit');
	const isAdmin = authUser?.role_name === 'Administrator' || authUser?.role === 'Administrator';
	const isOwnProfile = !guid;
	const canEditEmail = isAdmin && !isOwnProfile;
	const canEditUsername = isAdmin && !isOwnProfile;

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
				about: profile.about || profile.bio || '',
				interests: [...(profile.interests || [])],
				goals: [...(profile.goals || [])],
			};
			setForm(initial);
			initialFormRef.current = JSON.parse(JSON.stringify(initial));
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

	// ── Validation ───────────────────────────────────────────────
	const validate = () => {
		const errs = {};
		if (!form.fullName?.trim()) errs.fullName = t('profile.errors.nameRequired');
		if (!form.username?.trim()) errs.username = t('profile.errors.usernameRequired');
		else if (form.username.trim().length < 3) errs.username = t('profile.errors.usernameTooShort');
		if (canEditEmail) {
			if (!form.email?.trim()) errs.email = t('profile.errors.emailRequired');
			else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = t('profile.errors.emailInvalid');
		}
		setFormErrors(errs);
		return Object.keys(errs).length === 0;
	};

	// ── Save ─────────────────────────────────────────────────────
	const handleSave = async () => {
		if (!validate()) return;
		setSaving(true);
		try {
			const payload = {
				fullName: form.fullName?.trim(),
				about: form.about?.trim() || '',
				interests: form.interests || [],
				goals: form.goals || [],
			};
			if (form.locationId) payload.locationId = Number(form.locationId);
			if (canEditUsername) payload.username = form.username?.trim();
			if (canEditEmail) payload.email = form.email?.trim();

			if (isOwnProfile) {
				await updateProfile(payload);
			} else {
				await updateUser(guid, payload);
			}
			setIsDirty(false);
			setSaveSuccess(true);
			const basePath = isOwnProfile ? SHARED.PROFILE : `${ADMIN.USERS}/${guid}/profile`;
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
		const editPath = isOwnProfile
			? `${SHARED.PROFILE}/edit`
			: `${ADMIN.USERS}/${guid}/profile/edit`;
		navigate(editPath);
	};

	const handleCancel = () => {
		const viewPath = isOwnProfile ? SHARED.PROFILE : `${ADMIN.USERS}/${guid}/profile`;
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
	const displayServiceLine = profile?.serviceLine?.name || profile?.service_line?.name || '';
	const displayAbout = profile?.about || profile?.bio || '';
	const displayInterests = profile?.interests || [];
	const displayGoals = profile?.goals || [];
	const displayAchievements = profile?.achievements || [];
	const memberSince = profile?.createdAt || profile?.created_at || '';
	const photoUrl = profile?.photoUrl || profile?.photo_url || profile?.avatar || null;

	// ── Stats by role ────────────────────────────────────────────
	const getStats = () => {
		const base = [
			{ icon: 'badge', iconColor: 'var(--color-blue-on-soft)', value: profile?.badgesCount ?? profile?.badges_count ?? 0, label: t('profile.badgesEarned') },
		];

		if (isConsultant) {
			return [
				...base,
				{ icon: 'paper', iconColor: 'var(--color-orange-on-soft)', value: profile?.applicationsCount ?? profile?.applications_count ?? 0, label: t('profile.applicationsCompleted') },
				{ icon: 'star-points', iconColor: 'var(--color-green-on-soft)', value: profile?.totalPoints ?? profile?.total_points ?? 0, label: t('profile.totalPoints') },
				{ icon: 'fire', iconColor: 'var(--color-red-on-soft)', value: profile?.currentStreakDays ?? profile?.current_streak_days ?? 0, label: t('profile.currentStreak') },
			];
		}

		if (isTm) {
			return [
				...base,
				{ icon: 'tabler_users', iconColor: 'var(--color-orange-on-soft)', value: profile?.teamMembersCount ?? profile?.team_members_count ?? 0, label: t('profile.teamMembers') },
				{ icon: 'check2', iconColor: 'var(--color-green-on-soft)', value: profile?.validationsCount ?? profile?.validations_count ?? 0, label: t('profile.validationsDone') },
			];
		}

		// SLL
		return [
			...base,
			{ icon: 'tabler_users', iconColor: 'var(--color-orange-on-soft)', value: profile?.teamMembersCount ?? profile?.team_members_count ?? 0, label: t('profile.teamMembers') },
			{ icon: 'check2', iconColor: 'var(--color-green-on-soft)', value: profile?.validationsCount ?? profile?.validations_count ?? 0, label: t('profile.validationsDone') },
		];
	};

	// ── Loading / error states ───────────────────────────────────
	if (loading) {
		return (
			<div className={styles.page}>
				<p className="text-muted">{t('loading')}</p>
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
		<div className={styles.page}>
			{/* ── Page title ─────────────────────────────────── */}
			<h1 className={styles.pageTitle}>{pageTitle}</h1>

			{/* ── Info card (avatar + details + about me) ────── */}
			<ContentCard className={styles.infoCard} padding={32}>
				<div className={styles.infoCardInner}>
					<div className={styles.infoLeft}>
						<div className={styles.avatar}>
							{photoUrl ? (
								<img src={photoUrl} alt={displayName} className={styles.avatarImg} />
							) : (
								<span className={styles.avatarFallback}>{getInitials(displayName)}</span>
							)}
						</div>

						<div className={styles.infoDetails}>
							{isEditMode ? (
								<>
									<div className="row g-3 mb-2">
										<div className="col-sm-6">
											<FormInput
												id="fullName"
												label={t('profile.fullName')}
												value={form.fullName || ''}
												onChange={handleChange('fullName')}
												error={formErrors.fullName}
												required
											/>
										</div>
										<div className="col-sm-6">
											<FormInput
												id="username"
												label={t('profile.username')}
												value={form.username || ''}
												onChange={canEditUsername ? handleChange('username') : undefined}
												error={formErrors.username}
												disabled={!canEditUsername}
												required
											/>
										</div>
									</div>
									<div className="row g-3">
										<div className="col-sm-6">
											<FormInput
												id="email"
												label={t('profile.email')}
												value={canEditEmail ? (form.email || '') : displayEmail}
												onChange={canEditEmail ? handleChange('email') : undefined}
												error={formErrors.email}
												disabled={!canEditEmail}
												required={canEditEmail}
											/>
										</div>
										<div className="col-sm-6">
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
										{displayLocation && <InfoRow icon="location_on">{displayLocation}</InfoRow>}
										{!isTm && displayServiceLine && (
											<InfoRow icon="service-line">{displayServiceLine}</InfoRow>
										)}
										{memberSince && (
											<InfoRow icon="today">
												{t('profile.memberSince', { date: formatDate(memberSince) })}
											</InfoRow>
										)}
									</div>
								</>
							)}
						</div>
					</div>

					<div className={styles.infoActions}>
						{!isEditMode && (isOwnProfile || isAdmin) && (
							<button type="button" className={styles.editBtn} onClick={handleEdit} aria-label={t('profile.editProfile')}>
								<Icon name="pencil" size={20} color="var(--color-on-background)" />
							</button>
						)}
						{!isEditMode && isAdmin && !isOwnProfile && (
							<button type="button" className={styles.drawerBtn} onClick={() => setDrawerOpen(true)} aria-label={t('profile.adminDetails')}>
								<Icon name="settings" size={20} color="var(--color-outline)" />
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

			{/* ── Content sections ───────────────────────────── */}
			<div className="row g-4">
				{/* Left column */}
				<div className="col-lg-7 d-flex flex-column gap-4">
					{/* Key Interests (consultant & SLL) */}
					{(isConsultant || !isTm) && (
						<ContentCard>
							<CardHeader
								icon="skills"
								iconBg="var(--color-orange-soft)"
								iconColor="var(--color-orange-on-soft)"
								title={t('profile.keyInterests')}
							/>
							<div className={styles.sectionBody}>
								{isEditMode ? (
									<>
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
									</>
								) : displayInterests.length > 0 ? (
									<div className={styles.chipList}>
										{displayInterests.map((interest, idx) => (
											<Chip key={idx} label={interest} />
										))}
									</div>
								) : (
									<p className={styles.emptyText}>{t('profile.noInterests')}</p>
								)}
							</div>
						</ContentCard>
					)}

					{/* Current Goals */}
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

					{/* Recent Achievements (always read-only) */}
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

				{/* Right column - Stats */}
				<div className="col-lg-5">
					<ContentCard className={styles.statsCard} padding={32}>
						<div className={styles.statsGrid}>
							{stats.map((stat, idx) => (
								<ProfileStatItem key={idx} {...stat} />
							))}
						</div>
					</ContentCard>
				</div>
			</div>

			{/* ── Badge gallery link ──────────────────────────── */}
			<ContentCard className={styles.badgeGalleryCard}>
				<Link to={badgesPath} className={styles.badgeGalleryLink}>
					<div className={styles.badgeGalleryIcon}>
						<Icon name="badge" size={32} color="var(--color-primary)" />
					</div>
					<div className={styles.badgeGalleryText}>
						<span className={styles.badgeGalleryTitle}>{t('profile.viewBadgeGallery')}</span>
						<span className={styles.badgeGalleryDesc}>{t('profile.viewBadgeGalleryDesc')}</span>
					</div>
					<Icon name="chevron_forward" size={20} color="var(--color-outline)" />
				</Link>
			</ContentCard>

			{/* ── Save / Cancel buttons (edit mode) ──────────── */}
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

			{/* ── Success toast ───────────────────────────────── */}
			{saveSuccess && (
				<div className={styles.successToast} role="status">
					<Icon name="check2" size={20} color="var(--color-success)" />
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

			{/* ── Admin drawer ────────────────────────────────── */}
			{isAdmin && !isOwnProfile && (
				<AdminUserDrawer
					open={drawerOpen}
					onClose={() => setDrawerOpen(false)}
					profile={profile}
					guid={guid}
				/>
			)}
		</div>
	);
}
