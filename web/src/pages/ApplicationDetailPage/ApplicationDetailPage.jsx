import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getApplicationById } from '../../features/applications/api/applicationsApi';
import { resolveErrorMessage } from '../../validations/apiErrors';
import { useUser } from '../../hooks/userContext';
import DetailPageSkeleton from '../../components/Skeleton/DetailPageSkeleton';
import ApplicationDetail from '../consultant/ApplicationDetail/ApplicationDetail';
import ApplicationStatus from '../consultant/ApplicationStatus/ApplicationStatus';
import ApplicationReview from '../management/ApplicationReview/ApplicationReview';

export default function ApplicationDetailPage() {
	const { id } = useParams();
	const { user } = useUser();
	const [application, setApplication] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const loadApplication = useCallback(async () => {
		try {
			const app = await getApplicationById(id);
			setApplication(app);
			setError(null);
		} catch (err) {
			setError(resolveErrorMessage(err));
		} finally {
			setLoading(false);
		}
	}, [id]);

	useEffect(() => {
		loadApplication();
	}, [loadApplication]);

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
		return <ApplicationDetail application={application} onReload={loadApplication} />;
	}

	// Reviewers act on the application at their workflow stage:
	// Talent Manager forwards 'Submitted' apps; Service Line Leader is the final
	// gatekeeper for 'In validation' apps (accept/reject).
	if (user?.role === 'Talent Manager' && state === 'Submitted') {
		return <ApplicationReview application={application} onReload={loadApplication} />;
	}
	if (user?.role === 'Service Line Leader' && state === 'In validation') {
		return <ApplicationReview application={application} onReload={loadApplication} />;
	}

	return <ApplicationStatus application={application} badge={application.badge} />;
}
