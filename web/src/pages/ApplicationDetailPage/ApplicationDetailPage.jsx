import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getApplicationById } from '../../features/applications/api/applicationsApi';
import { getBadgeBySlug } from '../../features/badges/api/badgesApi';
import DetailPageSkeleton from '../../components/Skeleton/DetailPageSkeleton';
import ApplicationDetail from '../consultant/ApplicationDetail/ApplicationDetail';
import ApplicationStatus from '../consultant/ApplicationStatus/ApplicationStatus';

export default function ApplicationDetailPage() {
	const { id } = useParams();
	const [application, setApplication] = useState(null);
	const [badge, setBadge] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		let ignore = false;

		async function load() {
			try {
				const app = await getApplicationById(id);
				if (ignore) return;
				setApplication(app);

				const badgeSlug = app.badge?.badge_slug || app.badge?.badgeSlug;
				if (badgeSlug) {
					const badgeData = await getBadgeBySlug(badgeSlug);
					if (!ignore) setBadge(badgeData);
				}
			} catch (err) {
				if (!ignore) setError(err.message);
			} finally {
				if (!ignore) setLoading(false);
			}
		}

		load();
		return () => { ignore = true; };
	}, [id]);

	if (loading) return <DetailPageSkeleton />;

	if (error) {
		return (
			<div style={{ padding: 24 }}>
				<div className="alert alert-danger" role="alert">{error}</div>
			</div>
		);
	}

	if (!application) {
		return (
			<div style={{ padding: 24, textAlign: 'center' }}>
				<h5 className="text-muted">Application not found</h5>
			</div>
		);
	}

	const state = application.application_state || application.state;

	if (state === 'Open') {
		return <ApplicationDetail application={application} badge={badge} />;
	}

	return <ApplicationStatus application={application} badge={badge} />;
}
