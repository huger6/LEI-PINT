import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../../hooks/userContext';
import { getUsers } from '../../services/adminService';
import { getBadges } from '../../services/badgeService';
import { getLearningPaths } from '../../services/hierarchyService';
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen';

export default function AdminDashboard() {
	const { user } = useUser();
	const [stats, setStats] = useState({ users: 0, badges: 0, applications: 0, learningPaths: 0 });
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function fetchStats() {
			try {
				const [users, badges, paths] = await Promise.all([
					getUsers({ limit: 1 }),
					getBadges({ limit: 1 }),
					getLearningPaths({ limit: 1 }),
				]);
				setStats({
					users: users.pagination?.total || users.length || 0,
					badges: badges.pagination?.total || badges.length || 0,
					applications: 0,
					learningPaths: paths.pagination?.total || paths.length || 0,
				});
			} catch (err) {
				console.error('Erro ao carregar estatísticas:', err);
			} finally {
				setLoading(false);
			}
		}
		fetchStats();
	}, []);

	const cards = [
		{ label: 'Total Utilizadores', value: stats.users, icon: 'people', link: '/users' },
		{ label: 'Total Badges', value: stats.badges, icon: 'award', link: '/badges' },
		{ label: 'Total Candidaturas', value: stats.applications, icon: 'file-earmark-text', link: '/applications' },
		{ label: 'Learning Paths', value: stats.learningPaths, icon: 'signpost', link: '/structure' },
	];

	const quickLinks = [
		{ label: 'Utilizadores', path: '/users' },
		{ label: 'Badges', path: '/badges' },
		{ label: 'Service Lines', path: '/structure' },
		{ label: 'Áreas', path: '/structure' },
	];

	if (loading) return <LoadingScreen />;

	return (
		<div>
			<h1 className="h3 mb-2">Painel de Administração</h1>
			<p className="text-muted mb-4">
				Bem-vindo, <strong>{user?.fullName}</strong>
			</p>

			<div className="row g-3 mb-4">
				{cards.map((card) => (
					<div className="col-md-6 col-lg-3" key={card.label}>
						<Link to={card.link} className="text-decoration-none">
							<div className="card h-100 border-0 shadow-sm">
								<div className="card-body d-flex align-items-center gap-3">
									<i className={`bi bi-${card.icon} fs-2 text-primary`} />
									<div>
										<div className="text-muted small">{card.label}</div>
										<div className="h4 mb-0 fw-bold">{card.value}</div>
									</div>
								</div>
							</div>
						</Link>
					</div>
				))}
			</div>

			<div className="card border-0 shadow-sm">
				<div className="card-body">
					<h5 className="card-title fw-semibold mb-3">Ações Rápidas</h5>
					<div className="d-flex flex-wrap gap-2">
						{quickLinks.map((link) => (
							<Link key={link.path} to={link.path} className="btn btn-outline-primary">
								{link.label}
							</Link>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
