import { useState, useEffect } from 'react';
import { getBadges } from '../../services/badgeService';

export default function AdminRequirements() {
	const [badges, setBadges] = useState([]);
	const [selectedBadge, setSelectedBadge] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadBadges();
	}, []);

	async function loadBadges() {
		try {
			const data = await getBadges();
			setBadges(data.data || data || []);
		} catch (err) {
			console.error('Erro ao carregar badges:', err);
		} finally {
			setLoading(false);
		}
	}

	const activeBadge = badges.find((b) => (b.badge_slug || b.badgeSlug) === selectedBadge);
	const requirements = activeBadge?.badge_requirements || activeBadge?.badgeRequirements || [];

	return (
		<div>
			<h1 className="h3 mb-4">Requisitos de Badges</h1>

			<div className="card border-0 shadow-sm mb-4">
				<div className="card-body">
					<label htmlFor="badge_select" className="form-label">Selecionar Badge</label>
					<select
						id="badge_select"
						className="form-select"
						value={selectedBadge || ''}
						onChange={(e) => setSelectedBadge(e.target.value)}
					>
						<option value="">Escolher badge...</option>
						{badges.map((b) => (
							<option key={b.badge_slug || b.badgeSlug} value={b.badge_slug || b.badgeSlug}>
								{b.badge_title || b.badgeTitle}
							</option>
						))}
					</select>
				</div>
			</div>

			{selectedBadge && (
				<div className="card border-0 shadow-sm">
					<div className="card-body">
						<h5 className="fw-semibold mb-3">
							Requisitos: {activeBadge?.badge_title || activeBadge?.badgeTitle}
						</h5>

						{requirements.length === 0 ? (
							<p className="text-muted small">Este badge não tem requisitos definidos.</p>
						) : (
							<div className="table-responsive">
								<table className="table table-hover align-middle mb-0">
									<thead className="table-light">
										<tr>
											<th>#</th>
											<th>Título</th>
											<th>Descrição</th>
										</tr>
									</thead>
									<tbody>
										{requirements.map((req, idx) => (
											<tr key={req.requirement_id || req.requirementId || idx}>
												<td>{idx + 1}</td>
												<td>{req.requirement_title || req.requirementTitle || '—'}</td>
												<td>{req.requirement_description || req.requirementDescription || '—'}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
