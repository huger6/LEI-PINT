import { SHARED } from './paths';
import BadgeDetail from '../pages/consultant/BadgeDetail/BadgeDetail';
import ApplicationDetailPage from '../pages/ApplicationDetailPage/ApplicationDetailPage';
import ApplicationsPage from '../pages/ApplicationsPage/ApplicationsPage';
import UserProfile from '../pages/shared/UserProfile/UserProfile';
import SearchResults from '../pages/shared/SearchResults/SearchResults';
import Ranking from '../pages/shared/Ranking/Ranking';

const sharedRoutes = [
	{ path: SHARED.SEARCH, element: <SearchResults /> },
	{ path: SHARED.APPLICATIONS, element: <ApplicationsPage /> },
	{ path: SHARED.BADGE_DETAIL, element: <BadgeDetail /> },
	{ path: SHARED.APPLICATION_DETAIL, element: <ApplicationDetailPage /> },
	{ path: SHARED.PROFILE, element: <UserProfile /> },
	{ path: SHARED.PROFILE_EDIT, element: <UserProfile /> },
	{ path: SHARED.RANKING, element: <Ranking /> },
];

export default sharedRoutes;
