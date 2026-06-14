import { TM } from './paths';
import TmConsultants from '../pages/management/TmConsultants/TmConsultants';
import ConsultantDetail from '../pages/management/ConsultantDetail/ConsultantDetail';

// Talent-Manager-only routes. Shared management paths (/validations, /stats,
// /badges, /announcements) live in the management block in index.jsx because
// they are also used by the Service Line Leader.
const tmRoutes = [
	{ path: TM.CONSULTANTS, element: <TmConsultants /> },
	{ path: `${TM.CONSULTANTS}/:userGuid`, element: <ConsultantDetail /> },
];

export default tmRoutes;
