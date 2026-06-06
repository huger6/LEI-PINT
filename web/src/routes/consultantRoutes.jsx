import { CONSULTANT } from './paths';
import BadgeCatalog from '../pages/consultant/BadgeCatalog/BadgeCatalog';
import Objectives from '../pages/consultant/Objectives/Objectives';
import Points from '../pages/consultant/Points/Points';
import Evolution from '../pages/consultant/Evolution/Evolution';
import Ranking from '../pages/shared/Ranking/Ranking';

const consultantRoutes = [
	{ path: CONSULTANT.CATALOG, element: <BadgeCatalog /> },
	{ path: CONSULTANT.OBJECTIVES, element: <Objectives /> },
	{ path: CONSULTANT.POINTS, element: <Points /> },
	{ path: CONSULTANT.EVOLUTION, element: <Evolution /> },
	{ path: CONSULTANT.RANKING, element: <Ranking /> },
];

export default consultantRoutes;
