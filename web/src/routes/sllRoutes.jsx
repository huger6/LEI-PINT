import { SLL } from './paths';
import SllTeam from '../pages/management/SllTeam/SllTeam';
import SllBadgeHistory from '../pages/management/SllBadgeHistory/SllBadgeHistory';
import SllGamification from '../pages/management/SllGamification/SllGamification';
import ConsultantDetail from '../pages/management/ConsultantDetail/ConsultantDetail';

// Service-Line-Leader-only routes. Shared management paths (/validations,
// /stats, /badges, /announcements) live in the management block in index.jsx.
const sllRoutes = [
	{ path: SLL.TEAM, element: <SllTeam /> },
	{ path: `${SLL.TEAM}/:userGuid`, element: <ConsultantDetail /> },
	{ path: SLL.BADGE_HISTORY, element: <SllBadgeHistory /> },
	{ path: SLL.GAMIFICATION, element: <SllGamification /> },
];

export default sllRoutes;
