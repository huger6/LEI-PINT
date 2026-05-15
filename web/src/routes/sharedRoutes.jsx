import { SHARED } from './paths';
import BadgeDetail from '../pages/consultant/BadgeDetail/BadgeDetail';
import ApplicationDetail from '../pages/consultant/ApplicationDetail/ApplicationDetail';
import ApplicationsPage from '../pages/ApplicationsPage/ApplicationsPage';

const sharedRoutes = [
	{ path: SHARED.APPLICATIONS, element: <ApplicationsPage /> },
	{ path: SHARED.BADGE_DETAIL, element: <BadgeDetail /> },
	{ path: SHARED.APPLICATION_DETAIL, element: <ApplicationDetail /> },
];

export default sharedRoutes;
