import { CONSULTANT } from './paths';
import BadgeCatalog from '../pages/consultant/BadgeCatalog/BadgeCatalog';
import Objectives from '../pages/consultant/Objectives/Objectives';
import Points from '../pages/consultant/Points/Points';
import Evolution from '../pages/consultant/Evolution/Evolution';

const consultantRoutes = [
	{ path: CONSULTANT.CATALOG, element: <BadgeCatalog /> },
	{ path: CONSULTANT.OBJECTIVES, element: <Objectives /> },
	{ path: CONSULTANT.POINTS, element: <Points /> },
	{ path: CONSULTANT.EVOLUTION, element: <Evolution /> },
];

export default consultantRoutes;
