import { SLL } from './paths';
import SllTeam from '../pages/management/SllTeam/SllTeam';
import SllBadgeHistory from '../pages/management/SllBadgeHistory/SllBadgeHistory';

// Service-Line-Leader-only routes. Shared management paths (/validations,
// /stats, /badges, /announcements) live in the management block in index.jsx.
const sllRoutes = [
	{ path: SLL.TEAM, element: <SllTeam /> },
	{ path: SLL.BADGE_HISTORY, element: <SllBadgeHistory /> },
];

export default sllRoutes;
