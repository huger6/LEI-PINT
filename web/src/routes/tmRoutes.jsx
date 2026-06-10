import { TM } from './paths';
import TmValidations from '../pages/management/TmValidations/TmValidations';
import TmConsultants from '../pages/management/TmConsultants/TmConsultants';
import TmStats from '../pages/management/TmStats/TmStats';
import TmAnnouncements from '../pages/management/TmAnnouncements/TmAnnouncements';
import BadgeCatalog from '../pages/consultant/BadgeCatalog/BadgeCatalog';

const tmRoutes = [
	{ path: TM.VALIDATIONS, element: <TmValidations /> },
	{ path: TM.CONSULTANTS, element: <TmConsultants /> },
	{ path: TM.BADGES, element: <BadgeCatalog /> },
	{ path: TM.STATS, element: <TmStats /> },
	{ path: TM.ANNOUNCEMENTS, element: <TmAnnouncements /> },
];

export default tmRoutes;
