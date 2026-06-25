import { Navigate, useParams } from 'react-router-dom';

export default function RedirectPublicProfile() {
	const { guid } = useParams();
	return <Navigate to={`/softinsa/u/${guid}`} replace />;
}
