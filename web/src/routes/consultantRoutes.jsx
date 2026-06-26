import { CONSULTANT } from './paths';
import BadgeCatalog from '../pages/consultant/BadgeCatalog/BadgeCatalog';
import Achievements from '../pages/consultant/Achievements/Achievements';
import Objectives from '../pages/consultant/Objectives/Objectives';
import Points from '../pages/consultant/Points/Points';
import Evolution from '../pages/consultant/Evolution/Evolution';
import Store from '../pages/consultant/Store/Store';

// /ranking is served by the shared (ungated) block so every role can reach it.
// It must NOT also live here, or this Consultant-gated route would shadow the
// shared one and 403 for Talent Manager / Service Line Leader.
const consultantRoutes = [
	{ path: CONSULTANT.CATALOG, element: <BadgeCatalog /> },
	{ path: CONSULTANT.ACHIEVEMENTS, element: <Achievements /> },
	{ path: CONSULTANT.OBJECTIVES, element: <Objectives /> },
	{ path: CONSULTANT.POINTS, element: <Points /> },
	{ path: CONSULTANT.EVOLUTION, element: <Evolution /> },
	{ path: CONSULTANT.STORE, element: <Store /> },
];

export default consultantRoutes;
