import { SHARED } from './paths';
import BadgeDetail from '../pages/consultant/BadgeDetail/BadgeDetail';
import ApplicationDetailPage from '../pages/ApplicationDetailPage/ApplicationDetailPage';
import ApplicationsPage from '../pages/ApplicationsPage/ApplicationsPage';
import SubmissionConfirmation from '../pages/consultant/SubmissionConfirmation/SubmissionConfirmation';
import UserProfile from '../pages/shared/UserProfile/UserProfile';
import SearchResults from '../pages/shared/SearchResults/SearchResults';
import Ranking from '../pages/shared/Ranking/Ranking';
import MailSignature from '../pages/shared/MailSignature/MailSignature';

const sharedRoutes = [
	{ path: SHARED.SEARCH, element: <SearchResults /> },
	{ path: SHARED.APPLICATIONS, element: <ApplicationsPage /> },
	{ path: SHARED.BADGE_DETAIL, element: <BadgeDetail /> },
	{ path: SHARED.APPLICATION_SUBMITTED, element: <SubmissionConfirmation /> },
	{ path: SHARED.APPLICATION_DETAIL, element: <ApplicationDetailPage /> },
	{ path: SHARED.PROFILE, element: <UserProfile /> },
	{ path: SHARED.PROFILE_EDIT, element: <UserProfile /> },
	{ path: SHARED.MAIL_SIGNATURE, element: <MailSignature /> },
	{ path: SHARED.RANKING, element: <Ranking /> },
];

export default sharedRoutes;
