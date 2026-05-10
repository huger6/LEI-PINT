import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getLearningPaths, getServiceLines, getAreas, getLevels } from '../../services/hierarchyService';
import { getBadges } from '../../services/badgeService';

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
						<li className="breadcrumb-item"><button className="btn btn-link p-0" onClick={() => handleBreadcrumb('lp')}>Learning Paths</button></li>
						{selection.learningPathName && <li className="breadcrumb-item"><button className="btn btn-link p-0" onClick={() => handleBreadcrumb('sl')}>{selection.learningPathName}</button></li>}
						{selection.serviceLineName && <li className="breadcrumb-item"><button className="btn btn-link p-0" onClick={() => handleBreadcrumb('area')}>{selection.serviceLineName}</button></li>}
						{selection.areaName && <li className="breadcrumb-item"><button className="btn btn-link p-0" onClick={() => handleBreadcrumb('level')}>{selection.areaName}</button></li>}
						{selection.levelName && <li className="breadcrumb-item"><button className="btn btn-link p-0" onClick={() => handleBreadcrumb('badge')}>{selection.levelName}</button></li>}
						<li className="breadcrumb-item active">{selection.badgeName}</li>
					</ol>
				</nav>
				<div className="d-flex align-items-center gap-3 mb-4">
					<h1 className="h3 mb-0">{selection.badgeName}</h1>
					<Link to={`/badges/${selection.badgeSlug}`} className="btn btn-primary btn-sm">
						Ver Detalhes
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div>
			<nav aria-label="breadcrumb" className="mb-3">
				<ol className="breadcrumb">
					<li className={`breadcrumb-item ${step === 'lp' ? 'active' : ''}`}>
						{step === 'lp' ? 'Learning Paths' : <button className="btn btn-link p-0" onClick={() => handleBreadcrumb('lp')}>Learning Paths</button>}
					</li>
					{selection.learningPathName && (
						<li className={`breadcrumb-item ${step === 'sl' ? 'active' : ''}`}>
							{step === 'sl' ? selection.learningPathName : <button className="btn btn-link p-0" onClick={() => handleBreadcrumb('sl')}>{selection.learningPathName}</button>}
						</li>
					)}
					{selection.serviceLineName && (
						<li className={`breadcrumb-item ${step === 'area' ? 'active' : ''}`}>
							{step === 'area' ? selection.serviceLineName : <button className="btn btn-link p-0" onClick={() => handleBreadcrumb('area')}>{selection.serviceLineName}</button>}
						</li>
					)}
					{selection.areaName && (
						<li className={`breadcrumb-item ${step === 'level' ? 'active' : ''}`}>
							{step === 'level' ? selection.areaName : <button className="btn btn-link p-0" onClick={() => handleBreadcrumb('level')}>{selection.areaName}</button>}
						</li>
					)}
					{selection.levelName && (
						<li className={`breadcrumb-item ${step === 'badge' ? 'active' : ''}`}>
							{step === 'badge' ? selection.levelName : <button className="btn btn-link p-0" onClick={() => handleBreadcrumb('badge')}>{selection.levelName}</button>}
						</li>
					)}
				</ol>
			</nav>

			<h1 className="h3 mb-4">{stepLabels[step]}</h1>

			<div className="card border-0 shadow-sm">
				<div className="card-body">
					{loading && (
						<div className="text-center py-5">
							<div className="spinner-border text-primary" aria-label="A carregar" />
						</div>
					)}
					{!loading && items.length === 0 && (
						<div className="text-center py-5">
							<h5 className="text-muted">Sem itens</h5>
							<p className="text-muted small">Nenhum {stepLabels[step].toLowerCase()} encontrado.</p>
						</div>
					)}
					{!loading && items.length > 0 && (
						<div className="list-group list-group-flush">
							{items.map((item) => {
								const id = item.learning_path_id || item.service_line_id || item.area_id || item.progression_stage_id || item.badge_slug;
								const name = item.path_title || item.service_line_name || item.area_name || item.stage_title || item.badge_title;
								const description = item.path_description || item.service_line_description || item.area_description || item.stage_description || item.badge_description;
								return (
									<button
										key={id}
										className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
										onClick={() => handleSelect(item, step)}
									>
										<div className="text-start">
											<h6 className="fw-semibold mb-1">{name}</h6>
											{description && <p className="text-muted small mb-0">{description}</p>}
										</div>
										<span className="text-muted">&rsaquo;</span>
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
