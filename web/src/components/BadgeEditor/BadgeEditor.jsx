import { useEffect, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Canvas, Circle, Rect, Polygon, IText, Gradient, FabricImage } from 'fabric';
import useCanvasHistory from './useCanvasHistory';
import useSnapGuidelines from './useSnapGuidelines';
import { applyTemplate } from './templates.jsx';
import ToolbarPanel from './ToolbarPanel/ToolbarPanel';
import PropertiesPanel from './PropertiesPanel/PropertiesPanel';
import styles from './BadgeEditor.module.css';

const CANVAS_W = 450;
const CANVAS_H = 450;

function hexagonPoints(cx, cy, r) {
	const pts = [];
	for (let i = 0; i < 6; i++) {
		const angle = (Math.PI / 3) * i - Math.PI / 2;
		pts.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
	}
	return pts;
}

function shieldPoints(cx, cy, w, h) {
	const hw = w / 2;
	return [
		{ x: cx - hw, y: cy - h * 0.45 },
		{ x: cx + hw, y: cy - h * 0.45 },
		{ x: cx + hw, y: cy + h * 0.1 },
		{ x: cx, y: cy + h * 0.55 },
		{ x: cx - hw, y: cy + h * 0.1 },
	];
}

export default function BadgeEditor({ onExport = null, exportLabel = null }) {
	const { t } = useTranslation();
	const canvasRef = useRef(null);
	const fabricRef = useRef(null);
	const [selected, setSelected] = useState(null);
	const [props, setProps] = useState({});
	const [svgOutput, setSvgOutput] = useState(null);
	const [canvasBg, setCanvasBg] = useState('#ffffff');
	const [zoomLevel, setZoomLevel] = useState(1);

	const { saveState, undo, redo, canUndo, canRedo, isRestoring } = useCanvasHistory(fabricRef);

	const syncSelection = useCallback((obj) => {
		if (!obj) return;
		setSelected(obj);
		const isGrad = obj.fill && typeof obj.fill === 'object' && obj.fill.type;
		setProps({
			fill: isGrad ? '#000000' : (obj.fill || '#000000'),
			stroke: obj.stroke || '',
			strokeWidth: obj.strokeWidth || 0,
			opacity: Math.round((obj.opacity ?? 1) * 100),
			angle: Math.round(obj.angle || 0),
			fontSize: obj.fontSize || 24,
			fontWeight: obj.fontWeight || 'normal',
			fontStyle: obj.fontStyle || 'normal',
			fontFamily: obj.fontFamily || 'Inter, sans-serif',
			textAlign: obj.textAlign || 'left',
			charSpacing: obj.charSpacing || 0,
			lineHeight: obj.lineHeight || 1.16,
			isText: obj instanceof IText,
			fillMode: isGrad ? 'gradient' : 'solid',
			gradientStart: isGrad ? (obj.fill.colorStops?.[0]?.color || '#000000') : '#000000',
			gradientEnd: isGrad ? (obj.fill.colorStops?.[1]?.color || '#ffffff') : '#ffffff',
		});
	}, []);

	useEffect(() => {
		const fc = new Canvas(canvasRef.current, {
			width: CANVAS_W,
			height: CANVAS_H,
			backgroundColor: '#ffffff',
		});
		fabricRef.current = fc;

		fc.on('selection:created', (e) => syncSelection(e.selected?.[0]));
		fc.on('selection:updated', (e) => syncSelection(e.selected?.[0]));
		fc.on('selection:cleared', () => {
			setSelected(null);
			setProps({});
		});
		fc.on('object:modified', (e) => {
			syncSelection(e.target);
			if (!isRestoring.current) saveState();
		});

		setTimeout(() => saveState(), 0);

		const handleKeyDown = (e) => {
			if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
				e.preventDefault();
				undo();
			}
			if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
				e.preventDefault();
				redo();
			}
		};
		document.addEventListener('keydown', handleKeyDown);

		return () => {
			document.removeEventListener('keydown', handleKeyDown);
			fc.dispose();
			fabricRef.current = null;
		};
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	useSnapGuidelines(fabricRef, CANVAS_W, CANVAS_H);

	const addShape = useCallback((type) => {
		const fc = fabricRef.current;
		if (!fc) return;
		const cx = CANVAS_W / 2;
		const cy = CANVAS_H / 2;
		let obj;

		switch (type) {
			case 'circle':
				obj = new Circle({
					radius: 100, left: cx, top: cy,
					originX: 'center', originY: 'center',
					fill: '#00B8E0', stroke: '#39639C', strokeWidth: 3,
				});
				break;
			case 'hexagon': {
				const pts = hexagonPoints(0, 0, 110);
				obj = new Polygon(pts, {
					left: cx, top: cy,
					originX: 'center', originY: 'center',
					fill: '#39639C', stroke: '#00B8E0', strokeWidth: 3,
				});
				break;
			}
			case 'shield': {
				const pts = shieldPoints(0, 0, 200, 240);
				obj = new Polygon(pts, {
					left: cx, top: cy,
					originX: 'center', originY: 'center',
					fill: '#FFCC00', stroke: '#39639C', strokeWidth: 3,
				});
				break;
			}
			case 'rect':
				obj = new Rect({
					width: 180, height: 180, left: cx, top: cy,
					originX: 'center', originY: 'center',
					fill: '#04CE00', stroke: '#39639C', strokeWidth: 3,
					rx: 12, ry: 12,
				});
				break;
			default:
				return;
		}

		fc.add(obj);
		fc.setActiveObject(obj);
		fc.requestRenderAll();
		saveState();
	}, [saveState]);

	const addText = useCallback(() => {
		const fc = fabricRef.current;
		if (!fc) return;
		const txt = new IText('Badge', {
			left: CANVAS_W / 2, top: CANVAS_H / 2,
			originX: 'center', originY: 'center',
			fontSize: 32, fontFamily: 'Inter, sans-serif',
			fill: '#1D1B20', fontWeight: 'bold',
		});
		fc.add(txt);
		fc.setActiveObject(txt);
		fc.requestRenderAll();
		saveState();
	}, [saveState]);

	const updateProp = useCallback((key, value) => {
		const fc = fabricRef.current;
		if (!fc || !selected) return;

		if (key === 'opacity') {
			selected.set('opacity', value / 100);
		} else if (key === 'fillMode') {
			setProps((p) => ({ ...p, fillMode: value }));
			if (value === 'gradient') {
				const start = props.gradientStart || '#000000';
				const end = props.gradientEnd || '#ffffff';
				const grad = new Gradient({
					type: 'linear',
					gradientUnits: 'percentage',
					coords: { x1: 0, y1: 0, x2: 1, y2: 1 },
					colorStops: [
						{ offset: 0, color: start },
						{ offset: 1, color: end },
					],
				});
				selected.set('fill', grad);
			} else {
				selected.set('fill', props.fill || '#000000');
			}
			fc.requestRenderAll();
			saveState();
			return;
		} else if (key === 'gradientStart' || key === 'gradientEnd') {
			setProps((p) => {
				const newP = { ...p, [key]: value };
				const grad = new Gradient({
					type: 'linear',
					gradientUnits: 'percentage',
					coords: { x1: 0, y1: 0, x2: 1, y2: 1 },
					colorStops: [
						{ offset: 0, color: newP.gradientStart || '#000000' },
						{ offset: 1, color: newP.gradientEnd || '#ffffff' },
					],
				});
				selected.set('fill', grad);
				fc.requestRenderAll();
				return newP;
			});
			return;
		} else {
			selected.set(key, value);
		}

		fc.requestRenderAll();
		setProps((p) => ({ ...p, [key]: value }));
	}, [selected, props.gradientStart, props.gradientEnd, props.fill, saveState]);

	const deleteSelected = useCallback(() => {
		const fc = fabricRef.current;
		if (!fc || !selected) return;
		fc.remove(selected);
		fc.discardActiveObject();
		fc.requestRenderAll();
		setSelected(null);
		setProps({});
		saveState();
	}, [selected, saveState]);

	const clearCanvas = useCallback(() => {
		const fc = fabricRef.current;
		if (!fc) return;
		fc.clear();
		fc.backgroundColor = '#ffffff';
		setCanvasBg('#ffffff');
		fc.requestRenderAll();
		setSelected(null);
		setProps({});
		saveState();
	}, [saveState]);

	const bringToFront = useCallback(() => {
		const fc = fabricRef.current;
		if (!fc || !selected) return;
		fc.bringObjectToFront(selected);
		fc.requestRenderAll();
		saveState();
	}, [selected, saveState]);

	const sendToBack = useCallback(() => {
		const fc = fabricRef.current;
		if (!fc || !selected) return;
		fc.sendObjectToBack(selected);
		fc.requestRenderAll();
		saveState();
	}, [selected, saveState]);

	const duplicateSelected = useCallback(() => {
		const fc = fabricRef.current;
		if (!fc || !selected) return;
		selected.clone().then((cloned) => {
			cloned.set({
				left: (cloned.left || 0) + 20,
				top: (cloned.top || 0) + 20,
			});
			fc.add(cloned);
			fc.setActiveObject(cloned);
			fc.requestRenderAll();
			saveState();
		});
	}, [selected, saveState]);

	const importImage = useCallback((file) => {
		const fc = fabricRef.current;
		if (!fc) return;
		const reader = new FileReader();
		reader.onload = (e) => {
			FabricImage.fromURL(e.target.result).then((img) => {
				const maxDim = Math.min(CANVAS_W, CANVAS_H) * 0.6;
				const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
				img.set({
					left: CANVAS_W / 2, top: CANVAS_H / 2,
					originX: 'center', originY: 'center',
					scaleX: scale, scaleY: scale,
				});
				fc.add(img);
				fc.setActiveObject(img);
				fc.requestRenderAll();
				saveState();
			});
		};
		reader.readAsDataURL(file);
	}, [saveState]);

	const selectTemplate = useCallback((templateId) => {
		if (!window.confirm(t('badgeEditor.templateConfirm'))) return;
		const fc = fabricRef.current;
		if (!fc) return;
		applyTemplate(templateId, fc, CANVAS_W, CANVAS_H);
		setCanvasBg(fc.backgroundColor || '#ffffff');
		setSelected(null);
		setProps({});
		saveState();
	}, [t, saveState]);

	const updateCanvasBg = useCallback((color) => {
		const fc = fabricRef.current;
		if (!fc) return;
		fc.backgroundColor = color;
		fc.requestRenderAll();
		setCanvasBg(color);
	}, []);

	const zoomIn = useCallback(() => {
		const fc = fabricRef.current;
		if (!fc) return;
		const z = Math.min(zoomLevel * 1.25, 3);
		fc.setZoom(z);
		fc.setDimensions({ width: CANVAS_W * z, height: CANVAS_H * z });
		setZoomLevel(z);
	}, [zoomLevel]);

	const zoomOut = useCallback(() => {
		const fc = fabricRef.current;
		if (!fc) return;
		const z = Math.max(zoomLevel / 1.25, 0.25);
		fc.setZoom(z);
		fc.setDimensions({ width: CANVAS_W * z, height: CANVAS_H * z });
		setZoomLevel(z);
	}, [zoomLevel]);

	const zoomReset = useCallback(() => {
		const fc = fabricRef.current;
		if (!fc) return;
		fc.setZoom(1);
		fc.setDimensions({ width: CANVAS_W, height: CANVAS_H });
		setZoomLevel(1);
	}, []);

	const exportSvg = useCallback(() => {
		const fc = fabricRef.current;
		if (!fc) return;
		const prevZoom = fc.getZoom();
		if (prevZoom !== 1) {
			fc.setZoom(1);
			fc.setDimensions({ width: CANVAS_W, height: CANVAS_H });
		}
		const svg = fc.toSVG();
		if (prevZoom !== 1) {
			fc.setZoom(prevZoom);
			fc.setDimensions({ width: CANVAS_W * prevZoom, height: CANVAS_H * prevZoom });
		}
		if (onExport) {
			onExport(svg);
			return;
		}
		setSvgOutput(svg);
	}, [onExport]);

	return (
		<div className={styles.editor}>
			{/* Left Toolbar */}
			<ToolbarPanel
				onAddShape={addShape}
				onAddText={addText}
				onBringFront={bringToFront}
				onSendBack={sendToBack}
				onDelete={deleteSelected}
				onClear={clearCanvas}
				onDuplicate={duplicateSelected}
				onUndo={undo}
				onRedo={redo}
				onImportImage={importImage}
				onSelectTemplate={selectTemplate}
				canUndo={canUndo}
				canRedo={canRedo}
				hasSelection={!!selected}
				t={t}
			/>

			{/* Canvas Area */}
			<div className={styles.canvasArea}>
				<div className={styles.canvasWrapper}>
					<canvas ref={canvasRef} />
				</div>
				<div className={styles.controlBar}>
					<div className={styles.zoomControls}>
						<button className={styles.zoomBtn} onClick={zoomOut} title={t('badgeEditor.zoomOut')}>
							<i className="bi bi-dash" />
						</button>
						<span className={styles.zoomLabel}>{Math.round(zoomLevel * 100)}%</span>
						<button className={styles.zoomBtn} onClick={zoomIn} title={t('badgeEditor.zoomIn')}>
							<i className="bi bi-plus" />
						</button>
						{zoomLevel !== 1 && (
							<button className={styles.zoomBtn} onClick={zoomReset} title={t('badgeEditor.zoomReset')}>
								<i className="bi bi-arrow-counterclockwise" />
							</button>
						)}
					</div>
					<button className={styles.exportBtn} onClick={exportSvg}>
						<i className="bi bi-filetype-svg" /> {exportLabel || t('badgeEditor.exportSvg')}
					</button>
				</div>
			</div>

			{/* Right Properties */}
			<PropertiesPanel
				selected={selected}
				props={props}
				onUpdateProp={updateProp}
				onSaveState={saveState}
				canvasBg={canvasBg}
				onUpdateCanvasBg={updateCanvasBg}
				t={t}
			/>

			{/* SVG Output (standalone mode) */}
			{svgOutput && (
				<div className={styles.svgOverlay} onClick={() => setSvgOutput(null)}>
					<div className={styles.svgModal} onClick={(e) => e.stopPropagation()}>
						<h3>Exported SVG</h3>
						<textarea className={styles.svgTextarea} readOnly value={svgOutput} />
						<button onClick={() => setSvgOutput(null)}>Close</button>
					</div>
				</div>
			)}
		</div>
	);
}

BadgeEditor.propTypes = {
	onExport: PropTypes.func,
	exportLabel: PropTypes.string,
};
