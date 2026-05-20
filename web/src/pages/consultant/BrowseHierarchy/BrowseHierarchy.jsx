import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../../components/Button/Button';
import { useTranslation } from 'react-i18next';
import { getLearningPaths, getServiceLines, getAreas, getLevels } from '../../../features/badges/api/hierarchyApi';
import { getBadges } from '../../../features/badges/api/badgesApi';
import Icon from '../../../components/Icons/Icons';
import ListSkeleton from '../../../components/Skeleton/ListSkeleton';

const STEP_ICON_MAP = {
	lp: 'learning-path',
	sl: 'service-line',
	area: 'area',
	level: 'evolution',
	badge: 'badge',
	detail: 'paper',
};

export default function BrowseHierarchy() {
	const { t } = useTranslation();
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
			console.error(err);
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
		lp: t('browseHierarchy.learningPaths'),
		sl: t('browseHierarchy.serviceLines'),
		area: t('browseHierarchy.areas'),
		level: t('browseHierarchy.levels'),
		badge: t('browseHierarchy.badges'),
		detail: t('browseHierarchy.details'),
	};

	if (step === 'detail' && selection.badgeSlug) {
		return (
			<div>
				<nav aria-label={t('shared.breadcrumb')} className="mb-3">
					<ol className="breadcrumb">
						<li className="breadcrumb-item"><button className="btn btn-link p-0" onClick={() => handleBreadcrumb('lp')}>{t('browseHierarchy.learningPaths')}</button></li>
						{selection.learningPathName && <li className="breadcrumb-item"><button className="btn btn-link p-0" onClick={() => handleBreadcrumb('sl')}>{selection.learningPathName}</button></li>}
						{selection.serviceLineName && <li className="breadcrumb-item"><button className="btn btn-link p-0" onClick={() => handleBreadcrumb('area')}>{selection.serviceLineName}</button></li>}
						{selection.areaName && <li className="breadcrumb-item"><button className="btn btn-link p-0" onClick={() => handleBreadcrumb('level')}>{selection.areaName}</button></li>}
						{selection.levelName && <li className="breadcrumb-item"><button className="btn btn-link p-0" onClick={() => handleBreadcrumb('badge')}>{selection.levelName}</button></li>}
						<li className="breadcrumb-item active">{selection.badgeName}</li>
					</ol>
				</nav>
				<div className="d-flex align-items-center gap-3 mb-4">
					<h1 className="h3 mb-0">{selection.badgeName}</h1>
					<Button as={Link} to={`/badges/${selection.badgeSlug}`} size="sm">
						{t('shared.viewDetails')}
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div>
			{/* Breadcrumb */}
			<nav aria-label={t('shared.breadcrumb')} className="mb-3">
				<ol className="breadcrumb">
					<li className={`breadcrumb-item ${step === 'lp' ? 'active' : ''}`}>
						{step === 'lp' ? t('browseHierarchy.learningPaths') : <button className="btn btn-link p-0" onClick={() => handleBreadcrumb('lp')}>{t('browseHierarchy.learningPaths')}</button>}
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
				<Icon
					name={STEP_ICON_MAP[step] || 'paper'}
					size={20}
					aria-hidden="true"
					style={{ color: 'var(--color-primary)' }}
				/>
				<h1 className="page-title mb-0">{stepLabels[step]}</h1>
			</div>

			{/* Content */}
			<div className="card border-0 shadow-sm brand-card" style={{ borderRadius: 14 }}>
				<div className="card-body p-0">
					{loading && (
						<ListSkeleton rows={5} />
					)}
					{!loading && items.length === 0 && (
						<div className="text-center py-5">
							<h5 className="text-muted">{t('browseHierarchy.noItems')}</h5>
							<p className="text-muted small">{t('browseHierarchy.noItemsDesc', { step: stepLabels[step].toLowerCase() })}</p>
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
										<Icon
											name="keyboard_arrow_down"
											size={14}
											className="text-muted flex-shrink-0"
											aria-hidden="true"
											style={{ transform: 'rotate(-90deg)' }}
										/>
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
