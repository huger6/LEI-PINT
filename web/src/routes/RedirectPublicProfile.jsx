import { Navigate, useParams } from 'react-router-dom';

// The canonical public profile lives on the Softinsa microsite. The legacy
// in-platform /u/:guid view used an admin-only endpoint (403 for non-admins),
// so redirect it to the integrated public profile.
export default function RedirectPublicProfile() {
	const { guid } = useParams();
	return <Navigate to={`/softinsa/u/${guid}`} replace />;
}
