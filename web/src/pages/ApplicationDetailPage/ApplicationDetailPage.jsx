import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getApplicationById } from '../../features/applications/api/applicationsApi';
import { resolveErrorMessage } from '../../validations/apiErrors';
import DetailPageSkeleton from '../../components/Skeleton/DetailPageSkeleton';
import ApplicationDetail from '../consultant/ApplicationDetail/ApplicationDetail';
import ApplicationStatus from '../consultant/ApplicationStatus/ApplicationStatus';

export default function ApplicationDetailPage() {
	const { id } = useParams();
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

	return <ApplicationStatus application={application} badge={application.badge} />;
}
