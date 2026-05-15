import { SHARED } from './paths';
import BadgeDetail from '../pages/consultant/BadgeDetail/BadgeDetail';
import ApplicationDetail from '../pages/consultant/ApplicationDetail/ApplicationDetail';
import ApplicationsPage from '../pages/ApplicationsPage/ApplicationsPage';
import UserProfile from '../pages/shared/UserProfile/UserProfile';

const sharedRoutes = [
	{ path: SHARED.APPLICATIONS, element: <ApplicationsPage /> },
	{ path: SHARED.BADGE_DETAIL, element: <BadgeDetail /> },
	{ path: SHARED.APPLICATION_DETAIL, element: <ApplicationDetail /> },
	{ path: SHARED.PROFILE, element: <UserProfile /> },
	{ path: SHARED.PROFILE_EDIT, element: <UserProfile /> },
];

export default sharedRoutes;
