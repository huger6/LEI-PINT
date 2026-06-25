import { useEffect, useRef } from 'react';

const SNAP_THRESHOLD = 8;
const GUIDE_COLOR = '#ff4081';
const GUIDE_DASH = [6, 4];

// Hook that snaps dragged objects to the canvas center axes and draws guide lines.
export default function useSnapGuidelines(fabricRef, canvasW, canvasH) {
	// Tracks whether the vertical and horizontal guide lines should be drawn.
	const guides = useRef({ showV: false, showH: false });

	// Registers snap and draw handlers on the Fabric canvas for center-axis snapping.
	useEffect(() => {
		const fc = fabricRef.current;
		if (!fc) return;

		const cx = canvasW / 2;
		const cy = canvasH / 2;

		// Snaps a moving object to the canvas center axes when within the threshold.
		const onMoving = (e) => {
			const obj = e.target;
			if (!obj) return;
			const center = obj.getCenterPoint();
			let snapped = false;

			if (Math.abs(center.x - cx) < SNAP_THRESHOLD) {
				obj.set('left', cx - (center.x - (obj.left || 0)));
				guides.current.showV = true;
				snapped = true;
			} else {
				guides.current.showV = false;
			}

			if (Math.abs(center.y - cy) < SNAP_THRESHOLD) {
				obj.set('top', cy - (center.y - (obj.top || 0)));
				guides.current.showH = true;
				snapped = true;
			} else {
				guides.current.showH = false;
			}

			if (snapped) obj.setCoords();
		};

		// Hides all guide lines after an object finishes moving.
		const onModified = () => {
			guides.current.showV = false;
			guides.current.showH = false;
			fc.requestRenderAll();
		};

		// Draws the visible snap guide lines on the canvas overlay context.
		const drawGuides = () => {
			const ctx = fc.contextTop;
			if (!ctx) return;
			fc.clearContext(ctx);

			if (guides.current.showV) {
				ctx.save();
				ctx.strokeStyle = GUIDE_COLOR;
				ctx.lineWidth = 1;
				ctx.setLineDash(GUIDE_DASH);
				ctx.beginPath();
				ctx.moveTo(cx, 0);
				ctx.lineTo(cx, canvasH);
				ctx.stroke();
				ctx.restore();
			}

			if (guides.current.showH) {
				ctx.save();
				ctx.strokeStyle = GUIDE_COLOR;
				ctx.lineWidth = 1;
				ctx.setLineDash(GUIDE_DASH);
				ctx.beginPath();
				ctx.moveTo(0, cy);
				ctx.lineTo(canvasW, cy);
				ctx.stroke();
				ctx.restore();
			}
		};

		fc.on('object:moving', onMoving);
		fc.on('object:modified', onModified);
		fc.on('after:render', drawGuides);

		return () => {
			fc.off('object:moving', onMoving);
			fc.off('object:modified', onModified);
			fc.off('after:render', drawGuides);
		};
	}, [fabricRef, canvasW, canvasH]);
}
