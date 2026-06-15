import { useEffect, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Canvas, Circle, Rect, Polygon, IText } from 'fabric';
import Tooltip from '../Tooltip/Tooltip';
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
	const canvasRef = useRef(null);
	const fabricRef = useRef(null);
	const [selected, setSelected] = useState(null);
	const [props, setProps] = useState({});
	const [svgOutput, setSvgOutput] = useState(null);

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
		fc.on('object:modified', (e) => syncSelection(e.target));

		return () => {
			fc.dispose();
			fabricRef.current = null;
		};
	}, []);

	const syncSelection = useCallback((obj) => {
		if (!obj) return;
		setSelected(obj);
		setProps({
			fill: obj.fill || '#000000',
			stroke: obj.stroke || '',
			strokeWidth: obj.strokeWidth || 0,
			opacity: Math.round((obj.opacity ?? 1) * 100),
			fontSize: obj.fontSize || 24,
			fontWeight: obj.fontWeight || 'normal',
			fontStyle: obj.fontStyle || 'normal',
			isText: obj instanceof IText,
		});
	}, []);

	const addShape = (type) => {
		const fc = fabricRef.current;
		if (!fc) return;
		const cx = CANVAS_W / 2;
		const cy = CANVAS_H / 2;
		let obj;

		switch (type) {
			case 'circle':
				obj = new Circle({
					radius: 100,
					left: cx,
					top: cy,
					originX: 'center',
					originY: 'center',
					fill: '#00B8E0',
					stroke: '#39639C',
					strokeWidth: 3,
				});
				break;
			case 'hexagon': {
				const pts = hexagonPoints(0, 0, 110);
				obj = new Polygon(pts, {
					left: cx,
					top: cy,
					originX: 'center',
					originY: 'center',
					fill: '#39639C',
					stroke: '#00B8E0',
					strokeWidth: 3,
				});
				break;
			}
			case 'shield': {
				const pts = shieldPoints(0, 0, 200, 240);
				obj = new Polygon(pts, {
					left: cx,
					top: cy,
					originX: 'center',
					originY: 'center',
					fill: '#FFCC00',
					stroke: '#39639C',
					strokeWidth: 3,
				});
				break;
			}
			case 'rect':
				obj = new Rect({
					width: 180,
					height: 180,
					left: cx,
					top: cy,
					originX: 'center',
					originY: 'center',
					fill: '#04CE00',
					stroke: '#39639C',
					strokeWidth: 3,
					rx: 12,
					ry: 12,
				});
				break;
			default:
				return;
		}

		fc.add(obj);
		fc.setActiveObject(obj);
		fc.requestRenderAll();
	};

	const addText = () => {
		const fc = fabricRef.current;
		if (!fc) return;
		const txt = new IText('Badge', {
			left: CANVAS_W / 2,
			top: CANVAS_H / 2,
			originX: 'center',
			originY: 'center',
			fontSize: 32,
			fontFamily: 'Inter, sans-serif',
			fill: '#1D1B20',
			fontWeight: 'bold',
		});
		fc.add(txt);
		fc.setActiveObject(txt);
		fc.requestRenderAll();
	};

	const updateProp = (key, value) => {
		const fc = fabricRef.current;
		if (!fc || !selected) return;

		if (key === 'opacity') {
			selected.set('opacity', value / 100);
		} else {
			selected.set(key, value);
		}

		fc.requestRenderAll();
		setProps((p) => ({ ...p, [key]: value }));
	};

	const deleteSelected = () => {
		const fc = fabricRef.current;
		if (!fc || !selected) return;
		fc.remove(selected);
		fc.discardActiveObject();
		fc.requestRenderAll();
	};

	const clearCanvas = () => {
		const fc = fabricRef.current;
		if (!fc) return;
		fc.clear();
		fc.backgroundColor = '#ffffff';
		fc.requestRenderAll();
		setSelected(null);
		setProps({});
	};

	const bringToFront = () => {
		const fc = fabricRef.current;
		if (!fc || !selected) return;
		fc.bringObjectToFront(selected);
		fc.requestRenderAll();
	};

	const sendToBack = () => {
		const fc = fabricRef.current;
		if (!fc || !selected) return;
		fc.sendObjectToBack(selected);
		fc.requestRenderAll();
	};

	const exportSvg = () => {
		const fc = fabricRef.current;
		if (!fc) return;
		const svg = fc.toSVG();
		// When embedded (e.g. BadgeImagePicker) hand the SVG back to the parent;
		// otherwise keep the standalone preview-modal behaviour.
		if (onExport) {
			onExport(svg);
			return;
		}
		setSvgOutput(svg);
	};

	return (
		<div className={styles.editor}>
			{/* ── Left Toolbar ── */}
			<div className={styles.toolbar}>
				<div className={styles.panel}>
					<p className={styles.panelTitle}>Badge Shapes</p>
					<div className={styles.shapeGrid}>
						<button className={styles.shapeBtn} onClick={() => addShape('circle')}>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
								<circle cx="12" cy="12" r="9" />
							</svg>
							Circle
						</button>
						<button className={styles.shapeBtn} onClick={() => addShape('hexagon')}>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
								<polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" />
							</svg>
							Hexagon
						</button>
						<button className={styles.shapeBtn} onClick={() => addShape('shield')}>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
								<path d="M3 5l9-3 9 3v6c0 5.25-3.75 9.75-9 11.25C6.75 20.75 3 16.25 3 11V5z" />
							</svg>
							Shield
						</button>
						<button className={styles.shapeBtn} onClick={() => addShape('rect')}>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
								<rect x="3" y="3" width="18" height="18" rx="3" />
							</svg>
							Rectangle
						</button>
					</div>
				</div>

				<div className={styles.panel}>
					<p className={styles.panelTitle}>Text</p>
					<button className={styles.textBtn} onClick={addText}>
						<i className="bi bi-fonts" /> Add Text
					</button>
				</div>

				<div className={styles.panel}>
					<p className={styles.panelTitle}>Actions</p>
					<div className={styles.actionRow}>
						<Tooltip text="Bring to Front">
							<button
								className={styles.actionBtn}
								onClick={bringToFront}
								disabled={!selected}
							>
								<i className="bi bi-front" /> Front
							</button>
						</Tooltip>
						<Tooltip text="Send to Back">
							<button
								className={styles.actionBtn}
								onClick={sendToBack}
								disabled={!selected}
							>
								<i className="bi bi-back" /> Back
							</button>
						</Tooltip>
					</div>
					<div className={styles.actionRow}>
						<button
							className={styles.dangerBtn}
							onClick={deleteSelected}
							disabled={!selected}
						>
							<i className="bi bi-trash" /> Delete
						</button>
						<button className={styles.dangerBtn} onClick={clearCanvas}>
							<i className="bi bi-x-circle" /> Clear
						</button>
					</div>
				</div>
			</div>

			{/* ── Canvas ── */}
			<div className={styles.canvasArea}>
				<div className={styles.canvasWrapper}>
					<canvas ref={canvasRef} />
				</div>
				<div className={styles.exportBar}>
					<button className={styles.exportBtn} onClick={exportSvg}>
						<i className="bi bi-filetype-svg" /> {exportLabel || 'Export SVG'}
					</button>
				</div>
			</div>

			{/* ── Right Properties Panel ── */}
			<div className={styles.properties}>
				{selected ? (
					<>
						<div className={styles.propGroup}>
							<p className={styles.panelTitle}>Fill & Stroke</p>
							<div className={styles.propRow}>
								<span className={styles.propLabel}>Fill</span>
								<input
									type="color"
									className={styles.colorInput}
									value={props.fill || '#000000'}
									onChange={(e) => updateProp('fill', e.target.value)}
								/>
							</div>
							<div className={styles.propRow}>
								<span className={styles.propLabel}>Stroke</span>
								<input
									type="color"
									className={styles.colorInput}
									value={props.stroke || '#000000'}
									onChange={(e) => updateProp('stroke', e.target.value)}
								/>
							</div>
							<div className={styles.propRow}>
								<span className={styles.propLabel}>Stroke W.</span>
								<input
									type="number"
									className={styles.numberInput}
									min={0}
									max={20}
									value={props.strokeWidth || 0}
									onChange={(e) => updateProp('strokeWidth', Number(e.target.value))}
								/>
							</div>
						</div>

						<div className={styles.propGroup}>
							<p className={styles.panelTitle}>Opacity</p>
							<div className={styles.propRow}>
								<input
									type="range"
									className={styles.rangeSlider}
									min={0}
									max={100}
									value={props.opacity ?? 100}
									onChange={(e) => updateProp('opacity', Number(e.target.value))}
								/>
								<span className={styles.propLabel}>{props.opacity ?? 100}%</span>
							</div>
						</div>

						{props.isText && (
							<div className={styles.propGroup}>
								<p className={styles.panelTitle}>Typography</p>
								<div className={styles.propRow}>
									<span className={styles.propLabel}>Size</span>
									<input
										type="number"
										className={styles.numberInput}
										min={8}
										max={120}
										value={props.fontSize || 24}
										onChange={(e) => updateProp('fontSize', Number(e.target.value))}
									/>
								</div>
								<div className={styles.propRow}>
									<span className={styles.propLabel}>Style</span>
									<div className={styles.toggleGroup}>
										<button
											className={
												props.fontWeight === 'bold'
													? styles.toggleBtnActive
													: styles.toggleBtn
											}
											onClick={() =>
												updateProp(
													'fontWeight',
													props.fontWeight === 'bold' ? 'normal' : 'bold'
												)
											}
										>
											B
										</button>
										<button
											className={
												props.fontStyle === 'italic'
													? styles.toggleBtnActive
													: styles.toggleBtn
											}
											onClick={() =>
												updateProp(
													'fontStyle',
													props.fontStyle === 'italic' ? 'normal' : 'italic'
												)
											}
										>
											I
										</button>
									</div>
								</div>
								<div className={styles.propRow}>
									<span className={styles.propLabel}>Color</span>
									<input
										type="color"
										className={styles.colorInput}
										value={props.fill || '#000000'}
										onChange={(e) => updateProp('fill', e.target.value)}
									/>
								</div>
							</div>
						)}
					</>
				) : (
					<div className={styles.propGroup}>
						<p className={styles.noSelection}>
							Select an object on the canvas to edit its properties
						</p>
					</div>
				)}
			</div>

			{/* ── SVG Output Modal ── */}
			{svgOutput && (
				<div className={styles.svgOverlay} onClick={() => setSvgOutput(null)}>
					<div className={styles.svgModal} onClick={(e) => e.stopPropagation()}>
						<h3>Exported SVG</h3>
						<textarea
							className={styles.svgTextarea}
							readOnly
							value={svgOutput}
						/>
						<button onClick={() => setSvgOutput(null)}>Close</button>
					</div>
				</div>
			)}
		</div>
	);
}

BadgeEditor.propTypes = {
	// When provided, the export button hands the SVG string to the parent
	// instead of opening the standalone preview modal.
	onExport: PropTypes.func,
	exportLabel: PropTypes.string,
};
