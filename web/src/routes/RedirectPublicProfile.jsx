import { Navigate, useParams } from 'react-router-dom';

// Redirects legacy /u/:guid links to the public Softinsa profile URL.
export default function RedirectPublicProfile() {
	// Reads the user GUID from the route params to build the redirect target.
	const { guid } = useParams();
	return <Navigate to={`/softinsa/u/${guid}`} replace />;
}
