import { CONSULTANT } from './paths';
import BadgeCatalog from '../pages/consultant/BadgeCatalog/BadgeCatalog';
import Objectives from '../pages/consultant/Objectives/Objectives';

const consultantRoutes = [
	{ path: CONSULTANT.CATALOG, element: <BadgeCatalog /> },
	{ path: CONSULTANT.OBJECTIVES, element: <Objectives /> },
];

export default consultantRoutes;
