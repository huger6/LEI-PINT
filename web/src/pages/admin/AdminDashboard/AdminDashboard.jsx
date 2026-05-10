import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUser } from '../../../hooks/userContext';
import { getUsers } from '../../../features/users/api/usersApi';
import { getBadges } from '../../../features/badges/api/badgesApi';
import { getLearningPaths } from '../../../features/badges/api/hierarchyApi';
import LoadingScreen from '../../../components/LoadingScreen/LoadingScreen';
import Icon from '../../../components/Icons/Icons';

const CARD_ICON_MAP = {
	people: 'tabler_users',
	award: 'badge',
	'file-earmark-text': 'paper',
	signpost: 'learning-path',
};

export default function AdminDashboard() {
	const { t } = useTranslation();
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
				console.error(err);
			} finally {
				setLoading(false);
			}
		}
		fetchStats();
	}, []);

	const cards = [
		{ label: t('adminDashboard.totalUsers'), value: stats.users, icon: 'people', link: '/users' },
		{ label: t('adminDashboard.totalBadges'), value: stats.badges, icon: 'award', link: '/badges' },
		{ label: t('adminDashboard.totalApplications'), value: stats.applications, icon: 'file-earmark-text', link: '/applications' },
		{ label: t('adminDashboard.learningPaths'), value: stats.learningPaths, icon: 'signpost', link: '/structure' },
	];

	const quickLinks = [
		{ label: t('adminDashboard.users'), path: '/users' },
		{ label: t('adminDashboard.badges'), path: '/badges' },
		{ label: t('adminDashboard.serviceLines'), path: '/structure' },
		{ label: t('adminDashboard.areas'), path: '/structure' },
	];

	if (loading) return <LoadingScreen />;

	return (
		<div>
			<h1 className="h3 mb-2">{t('adminDashboard.title')}</h1>
			<p className="text-muted mb-4">
				{t('adminDashboard.welcome', { name: user?.fullName })}
			</p>

			<div className="row g-3 mb-4">
				{cards.map((card) => (
					<div className="col-md-6 col-lg-3" key={card.label}>
						<Link to={card.link} className="text-decoration-none">
							<div className="card h-100 border-0 shadow-sm">
								<div className="card-body d-flex align-items-center gap-3">
									<Icon name={CARD_ICON_MAP[card.icon] || 'paper'} size={32} className="text-primary" aria-hidden="true" />
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
					<h5 className="card-title fw-semibold mb-3">{t('shared.quickActions')}</h5>
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
