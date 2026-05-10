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

	return (
		<>
			<nav aria-label="breadcrumb" className="mb-3">
				<ol className="breadcrumb">
					<li className="breadcrumb-item"><Link to="/badges">{t('badgeDetail.catalog')}</Link></li>
					<li className="breadcrumb-item active" aria-current="page">{badge.badge_title || badge.badgeTitle}</li>
				</ol>
			</nav>

			<div className="row">
				<div className="col-lg-8">
					<div className="card border-0 shadow-sm mb-4">
						<div className="card-body">
							<h1 className="h3 mb-2">{badge.badge_title || badge.badgeTitle}</h1>
							<p className="text-muted mb-3">
								{badge.badge_description || badge.badgeDescription || t('badgeDetail.noDescription')}
							</p>
							<div className="d-flex flex-wrap gap-2">
								{badge.area?.area_name && (
									<span className="badge bg-info">{badge.area.area_name}</span>
								)}
								{(badge.badge_points || badge.badgePoints) != null && (
									<span className="badge bg-warning text-dark">{badge.badge_points || badge.badgePoints} {t('badgeDetail.pointsLabel')}</span>
								)}
							</div>
						</div>
					</div>

					<div className="card border-0 shadow-sm">
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
