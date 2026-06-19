import { SHARED } from './paths';
import BadgeDetail from '../pages/consultant/BadgeDetail/BadgeDetail';
import ApplicationDetailPage from '../pages/ApplicationDetailPage/ApplicationDetailPage';
import ApplicationsPage from '../pages/ApplicationsPage/ApplicationsPage';
import SubmissionConfirmation from '../pages/consultant/SubmissionConfirmation/SubmissionConfirmation';
import UserProfile from '../pages/shared/UserProfile/UserProfile';
import SearchResults from '../pages/shared/SearchResults/SearchResults';
import Ranking from '../pages/shared/Ranking/Ranking';
import MailSignature from '../pages/shared/MailSignature/MailSignature';
import AnnouncementsPage from '../pages/shared/AnnouncementsPage/AnnouncementsPage';
import Settings from '../pages/shared/Settings/Settings';
import Privacy from '../pages/shared/Privacy/Privacy';
import Security from '../pages/shared/Security/Security';

const sharedRoutes = [
	{ path: SHARED.SEARCH, element: <SearchResults /> },
	{ path: SHARED.APPLICATIONS, element: <ApplicationsPage /> },
	{ path: SHARED.BADGE_DETAIL, element: <BadgeDetail /> },
	{ path: SHARED.APPLICATION_SUBMITTED, element: <SubmissionConfirmation /> },
	{ path: SHARED.APPLICATION_DETAIL, element: <ApplicationDetailPage /> },
	{ path: SHARED.PROFILE, element: <UserProfile /> },
	{ path: SHARED.PROFILE_EDIT, element: <UserProfile /> },
	{ path: SHARED.USER_PROFILE_VIEW, element: <UserProfile /> },
	{ path: SHARED.MAIL_SIGNATURE, element: <MailSignature /> },
	{ path: SHARED.RANKING, element: <Ranking /> },
	{ path: SHARED.ANNOUNCEMENTS, element: <AnnouncementsPage /> },
	{ path: SHARED.SETTINGS, element: <Settings /> },
	{ path: SHARED.PRIVACY, element: <Privacy /> },
	{ path: SHARED.SECURITY, element: <Security /> },
];

export default sharedRoutes;
