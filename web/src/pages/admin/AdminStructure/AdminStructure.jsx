import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function AdminStructure() {
	const { t } = useTranslation();

	const SECTIONS = [
		{ to: '/learning-paths', label: t('adminDashboard.learningPaths'), desc: t('adminStructure.learningPathsDesc') },
		{ to: '/service-lines', label: t('adminDashboard.serviceLines'), desc: t('adminStructure.serviceLinesDesc') },
		{ to: '/areas', label: t('adminDashboard.areas'), desc: t('adminStructure.areasDesc') },
		{ to: '/levels', label: t('adminLevels.title'), desc: t('adminStructure.levelsDesc') },
	];

	return (
		<div>
			<h1 className="h3 mb-4">{t('adminStructure.title')}</h1>
			<div className="row g-4">
				{SECTIONS.map((s) => (
					<div key={s.to} className="col-md-6 col-lg-3">
						<Link to={s.to} className="text-decoration-none">
							<div className="card border-0 shadow-sm h-100">
								<div className="card-body">
									<h5 className="fw-semibold mb-2">{s.label}</h5>
									<p className="text-muted small mb-0">{s.desc}</p>
								</div>
							</div>
						</Link>
					</div>
				))}
			</div>
		</div>
	);
}
