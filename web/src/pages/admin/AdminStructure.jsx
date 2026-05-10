import { Link } from 'react-router-dom';

const SECTIONS = [
	{ to: '/learning-paths', label: 'Learning Paths', desc: 'Percursos de progressão profissional' },
	{ to: '/service-lines', label: 'Service Lines', desc: 'Linhas de serviço da organização' },
	{ to: '/areas', label: 'Áreas', desc: 'Áreas de especialização' },
	{ to: '/levels', label: 'Níveis de Progressão', desc: 'Etapas do percurso profissional' },
];

export default function AdminStructure() {
	return (
		<div>
			<h1 className="h3 mb-4">Gerir Estrutura</h1>
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
