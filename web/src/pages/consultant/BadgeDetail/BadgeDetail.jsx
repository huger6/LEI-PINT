import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getBadgeBySlug } from '../../../services/badgeService';
import { startApplication, getApplications } from '../../../services/applicationService';
import LoadingScreen from '../../../components/LoadingScreen/LoadingScreen';
import FormButton from '../../../components/FormButton/FormButton';
import styles from './BadgeDetail.module.css';

export default function BadgeDetail() {
	const { t } = useTranslation();
	const { slug } = useParams();
	const navigate = useNavigate();
	const [badge, setBadge] = useState(null);
	const [requirements, setRequirements] = useState([]);
	const [alreadyApplied, setAlreadyApplied] = useState(false);
	const [loading, setLoading] = useState(true);
	const [applying, setApplying] = useState(false);
	const [error, setError] = useState(null);

	useEffect(() => {
		loadData();
	}, [slug]);

	async function loadData() {
		try {
			const badgeData = await getBadgeBySlug(slug);
			setBadge(badgeData);
			setRequirements(badgeData?.badge_requirements || badgeData?.badgeRequirements || []);

			const apps = await getApplications();
			const appList = apps.data || apps || [];
			const hasApp = appList.some(
				(a) =>
					(a.badge_id || a.badgeId) === (badgeData?.badge_id || badgeData?.badgeId) &&
					(a.application_state || a.state) !== 'Closed'
			);
			setAlreadyApplied(hasApp);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}

	async function handleApply() {
		setApplying(true);
		try {
			const newApp = await startApplication(badge.badge_id || badge.badgeId);
			const appGuid = newApp.application_guid || newApp.applicationGuid;
			navigate(`/applications/${appGuid}`);
		} catch (err) {
			setError(err.message);
			setApplying(false);
		}
	}

	if (loading) return <LoadingScreen />;

	if (error) {
		return (
			<div className="alert alert-danger m-4" role="alert">
				{t('shared.error')}: {error}
			</div>
		);
	}

	if (!badge) {
		return (
			<div className="text-center py-5">
				<h5 className="text-muted">{t('badgeDetail.notFound')}</h5>
				<Link to="/badges">{t('badgeDetail.backToCatalog')}</Link>
			</div>
		);
	}

	const title = badge.badge_title || badge.badgeTitle;
	const description = badge.badge_description || badge.badgeDescription;
	const areaName = badge.area?.area_name;
	const points = badge.badge_points || badge.badgePoints;
	const imgUrl = badge.badge_img_url || badge.badgeImgUrl;

	return (
		<>
			{/* Breadcrumb */}
			<nav aria-label="breadcrumb" className="mb-3">
				<ol className="breadcrumb">
					<li className="breadcrumb-item"><Link to="/badges">{t('badgeDetail.catalog')}</Link></li>
					<li className="breadcrumb-item active" aria-current="page">{badge.badge_title || badge.badgeTitle}</li>
				</ol>
			</nav>

			<div className="row g-4">
				{/* Main Content */}
				<div className="col-lg-8">
					{/* Badge Info Card */}
					<div className="card border-0 shadow-sm brand-card mb-4" style={{ borderRadius: 14, overflow: 'hidden' }}>
						{/* Header Area */}
						<div
							className="d-flex align-items-center justify-content-center"
							style={{
								height: 160,
								background: 'linear-gradient(135deg, rgba(0,184,224,0.08) 0%, rgba(57,99,156,0.08) 100%)',
							}}
						>
							{imgUrl ? (
								<img src={imgUrl} alt={title} style={{ maxHeight: 110, objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.08))' }} />
							) : (
								<i className="bi bi-award" style={{ fontSize: '3.5rem', color: 'var(--color-primary)', opacity: 0.45 }} />
							)}
						</div>

						<div className="card-body">
							<h1 className="h3 mb-2">{badge.badge_title || badge.badgeTitle}</h1>
							<p className="text-muted mb-3">
								{badge.badge_description || badge.badgeDescription || t('badgeDetail.noDescription')}
							</p>
							<div className="d-flex flex-wrap gap-2">
								{areaName && (
									<span className="badge badge-area" style={{ fontSize: '0.75rem', fontWeight: 600, padding: '4px 12px', borderRadius: 8 }}>
										{areaName}
									</span>
								)}
								{(badge.badge_points || badge.badgePoints) != null && (
									<span className="badge bg-warning text-dark">{badge.badge_points || badge.badgePoints} {t('badgeDetail.pointsLabel')}</span>
								)}
							</div>
						</div>
					</div>

					{/* Requirements Card */}
					<div className="card border-0 shadow-sm brand-card" style={{ borderRadius: 14 }}>
						<div className="card-body">
							<h5 className="fw-semibold mb-3">{t('badgeDetail.requirements')}</h5>
							{requirements.length === 0 ? (
								<p className="text-muted small">{t('badgeDetail.noRequirements')}</p>
							) : (
								<div className="d-flex flex-column gap-3">
									{requirements.map((req, idx) => (
										<div
											key={req.requirement_id || req.requirementId || idx}
											className={`p-3 rounded border ${styles.requirementBlock}`}
										>
											<h6 className="fw-semibold mb-1">
												{req.requirement_title || req.requirementTitle || t('badgeDetail.requirementN', { n: idx + 1 })}
											</h6>
											<p className="text-muted small mb-0">
												{req.requirement_description || req.requirementDescription || t('shared.noDescription')}
											</p>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Sidebar */}
				<div className="col-lg-4">
					<div className={`card border-0 shadow-sm sticky-top ${styles.stickyCard}`}>
						<div className="card-body">
							<h5 className="fw-semibold mb-3">{t('badgeDetail.application')}</h5>
							{alreadyApplied ? (
								<FormButton variant="primary" disabled className="w-100">
									{t('badgeDetail.alreadyApplied')}
								</FormButton>
							) : (
								<FormButton variant="primary" onClick={handleApply} loading={applying} className="w-100">
									{t('badgeDetail.applyNow')}
								</FormButton>
							)}
							<Link to="/badges" className="btn btn-outline-primary w-100 mt-2">
								{t('badgeDetail.backToCatalogBtn')}
							</Link>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
