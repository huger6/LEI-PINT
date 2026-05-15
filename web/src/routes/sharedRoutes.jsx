import BadgeDetail from '../pages/consultant/BadgeDetail/BadgeDetail';
import ApplicationDetail from '../pages/consultant/ApplicationDetail/ApplicationDetail';
import ApplicationsPage from '../pages/ApplicationsPage/ApplicationsPage';

const sharedRoutes = [
	{ path: '/applications', element: <ApplicationsPage /> },
	{ path: '/badges/:slug', element: <BadgeDetail /> },
	{ path: '/applications/:id', element: <ApplicationDetail /> },
];

export default sharedRoutes;
