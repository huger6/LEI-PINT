import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getLearningPaths, getServiceLines, getAreas, getLevels } from '../../services/hierarchyService';
import { getBadges } from '../../services/badgeService';

const STEP_ICONS = {
	lp: 'bi-book',
	sl: 'bi-diagram-3',
	area: 'bi-grid',
	level: 'bi-bar-chart-steps',
	badge: 'bi-award',
	detail: 'bi-file-earmark-text',
};

export default function BrowseHierarchy() {
	const [step, setStep] = useState('lp');
	const [selection, setSelection] = useState({});
	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadItems('lp');
	}, []);

	async function loadItems(stepKey, parent = null) {
		try {
			setLoading(true);
			let data = [];
			switch (stepKey) {
				case 'lp':
					data = await getLearningPaths();
					break;
				case 'sl':
					data = await getServiceLines({ learningPathId: parent?.learningPathId });
					break;
				case 'area':
					data = await getAreas({ serviceLineId: parent?.serviceLineId });
					break;
				case 'level':
					data = await getLevels({ areaId: parent?.areaId });
					break;
				case 'badge':
					data = await getBadges({ progressionStageId: parent?.progressionStageId });
					break;
				default:
					break;
			}
			setItems(data || []);
		} catch (err) {
			console.error('Erro ao carregar:', err);
		} finally {
			setLoading(false);
		}
	}

	function handleSelect(item, stepKey) {
		const nextSteps = { lp: 'sl', sl: 'area', area: 'level', level: 'badge', badge: 'detail' };
		const next = nextSteps[stepKey];

		const newSelection = { ...selection };
		switch (stepKey) {
			case 'lp':
				newSelection.learningPathId = item.learning_path_id;
				newSelection.learningPathName = item.path_title;
				break;
			case 'sl':
				newSelection.serviceLineId = item.service_line_id;
				newSelection.serviceLineName = item.service_line_name;
				break;
			case 'area':
				newSelection.areaId = item.area_id;
				newSelection.areaName = item.area_name;
				break;
			case 'level':
				newSelection.progressionStageId = item.progression_stage_id;
				newSelection.levelName = item.stage_title;
				break;
			case 'badge':
				newSelection.badgeSlug = item.badge_slug;
				newSelection.badgeName = item.badge_title;
				break;
			default:
				break;
		}
		setSelection(newSelection);

		if (next) {
			setStep(next);
			loadItems(next, newSelection);
		}
	}

	function handleBreadcrumb(targetStep) {
		const steps = ['lp', 'sl', 'area', 'level', 'badge'];
		const targetIdx = steps.indexOf(targetStep);
		const newSelection = {};
		for (let i = 0; i <= targetIdx; i++) {
			const key = steps[i];
			if (key === 'lp' && selection.learningPathId) {
				newSelection.learningPathId = selection.learningPathId;
				newSelection.learningPathName = selection.learningPathName;
			}
			if (key === 'sl' && selection.serviceLineId) {
				newSelection.serviceLineId = selection.serviceLineId;
				newSelection.serviceLineName = selection.serviceLineName;
			}
			if (key === 'area' && selection.areaId) {
				newSelection.areaId = selection.areaId;
				newSelection.areaName = selection.areaName;
			}
			if (key === 'level' && selection.progressionStageId) {
				newSelection.progressionStageId = selection.progressionStageId;
				newSelection.levelName = selection.levelName;
			}
		}
		setSelection(newSelection);
		setStep(targetStep);
		loadItems(targetStep, newSelection);
	}

	const stepLabels = {
		lp: 'Learning Paths',
		sl: 'Service Lines',
		area: 'Áreas',
		level: 'Níveis',
		badge: 'Badges',
		detail: 'Detalhes',
	};

	if (step === 'detail' && selection.badgeSlug) {
		return (
			<div>
				<nav aria-label="breadcrumb" className="mb-3">
					<ol className="breadcrumb">
						<li className="breadcrumb-item"><button className="btn btn-link p-0" style={{ fontSize: '0.8125rem' }} onClick={() => handleBreadcrumb('lp')}>Learning Paths</button></li>
						{selection.learningPathName && <li className="breadcrumb-item"><button className="btn btn-link p-0" style={{ fontSize: '0.8125rem' }} onClick={() => handleBreadcrumb('sl')}>{selection.learningPathName}</button></li>}
						{selection.serviceLineName && <li className="breadcrumb-item"><button className="btn btn-link p-0" style={{ fontSize: '0.8125rem' }} onClick={() => handleBreadcrumb('area')}>{selection.serviceLineName}</button></li>}
						{selection.areaName && <li className="breadcrumb-item"><button className="btn btn-link p-0" style={{ fontSize: '0.8125rem' }} onClick={() => handleBreadcrumb('level')}>{selection.areaName}</button></li>}
						{selection.levelName && <li className="breadcrumb-item"><button className="btn btn-link p-0" style={{ fontSize: '0.8125rem' }} onClick={() => handleBreadcrumb('badge')}>{selection.levelName}</button></li>}
						<li className="breadcrumb-item active">{selection.badgeName}</li>
					</ol>
				</nav>
				<div className="d-flex align-items-center gap-3 mb-4">
					<h1 className="page-title mb-0">{selection.badgeName}</h1>
					<Link to={`/badges/${selection.badgeSlug}`} className="btn btn-primary btn-sm" style={{ borderRadius: 8, fontWeight: 600 }}>
						<i className="bi bi-arrow-right me-1" />
						Ver Detalhes
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div>
			{/* Breadcrumb */}
			<nav aria-label="breadcrumb" className="mb-3">
				<ol className="breadcrumb">
					<li className={`breadcrumb-item ${step === 'lp' ? 'active' : ''}`}>
						{step === 'lp' ? 'Learning Paths' : <button className="btn btn-link p-0" style={{ fontSize: '0.8125rem' }} onClick={() => handleBreadcrumb('lp')}>Learning Paths</button>}
					</li>
					{selection.learningPathName && (
						<li className={`breadcrumb-item ${step === 'sl' ? 'active' : ''}`}>
							{step === 'sl' ? selection.learningPathName : <button className="btn btn-link p-0" style={{ fontSize: '0.8125rem' }} onClick={() => handleBreadcrumb('sl')}>{selection.learningPathName}</button>}
						</li>
					)}
					{selection.serviceLineName && (
						<li className={`breadcrumb-item ${step === 'area' ? 'active' : ''}`}>
							{step === 'area' ? selection.serviceLineName : <button className="btn btn-link p-0" style={{ fontSize: '0.8125rem' }} onClick={() => handleBreadcrumb('area')}>{selection.serviceLineName}</button>}
						</li>
					)}
					{selection.areaName && (
						<li className={`breadcrumb-item ${step === 'level' ? 'active' : ''}`}>
							{step === 'level' ? selection.areaName : <button className="btn btn-link p-0" style={{ fontSize: '0.8125rem' }} onClick={() => handleBreadcrumb('level')}>{selection.areaName}</button>}
						</li>
					)}
					{selection.levelName && (
						<li className={`breadcrumb-item ${step === 'badge' ? 'active' : ''}`}>
							{step === 'badge' ? selection.levelName : <button className="btn btn-link p-0" style={{ fontSize: '0.8125rem' }} onClick={() => handleBreadcrumb('badge')}>{selection.levelName}</button>}
						</li>
					)}
				</ol>
			</nav>

			{/* Page Title */}
			<div className="d-flex align-items-center gap-2 mb-4">
				<i className={`bi ${STEP_ICONS[step] || 'bi-folder'}`} style={{ fontSize: '1.25rem', color: 'var(--color-primary)' }} />
				<h1 className="page-title mb-0">{stepLabels[step]}</h1>
			</div>

			{/* Content */}
			<div className="card border-0 shadow-sm brand-card" style={{ borderRadius: 14 }}>
				<div className="card-body p-0">
					{loading && (
						<div className="text-center py-5">
							<div className="spinner-border text-primary" aria-label="A carregar" />
						</div>
					)}
					{!loading && items.length === 0 && (
						<div className="text-center py-5">
							<i className="bi bi-inbox" style={{ fontSize: '2rem', color: 'var(--color-outline)', opacity: 0.35 }} />
							<h5 className="mt-3" style={{ fontWeight: 700, fontSize: '1rem' }}>Sem itens</h5>
							<p className="text-muted small">Nenhum {stepLabels[step].toLowerCase()} encontrado.</p>
						</div>
					)}
					{!loading && items.length > 0 && (
						<div>
							{items.map((item, idx) => {
								const id = item.learning_path_id || item.service_line_id || item.area_id || item.progression_stage_id || item.badge_slug;
								const name = item.path_title || item.service_line_name || item.area_name || item.stage_title || item.badge_title;
								const description = item.path_description || item.service_line_description || item.area_description || item.stage_description || item.badge_description;
								return (
									<button
										key={id}
										className="d-flex justify-content-between align-items-center w-100 text-start"
										onClick={() => handleSelect(item, step)}
										style={{
											padding: '14px 20px',
											background: 'transparent',
											border: 'none',
											borderBottom: idx < items.length - 1 ? '1px solid #f0f2f4' : 'none',
											cursor: 'pointer',
											transition: 'background 150ms ease',
										}}
										onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-primary-hover-bg-soft)'; }}
										onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
									>
										<div>
											<h6 className="fw-bold mb-1" style={{ fontSize: '0.9375rem' }}>{name}</h6>
											{description && <p className="text-muted mb-0" style={{ fontSize: '0.8125rem' }}>{description}</p>}
										</div>
										<i className="bi bi-chevron-right text-muted flex-shrink-0" style={{ fontSize: '0.875rem' }} />
									</button>
								);
							})}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
