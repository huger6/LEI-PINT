import { useEffect, useRef } from 'react';

const SNAP_THRESHOLD = 8;
const GUIDE_COLOR = '#ff4081';
const GUIDE_DASH = [6, 4];

export default function useSnapGuidelines(fabricRef, canvasW, canvasH) {
	const guides = useRef({ showV: false, showH: false });

	useEffect(() => {
		const fc = fabricRef.current;
		if (!fc) return;

		const cx = canvasW / 2;
		const cy = canvasH / 2;

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

		const onModified = () => {
			guides.current.showV = false;
			guides.current.showH = false;
			fc.requestRenderAll();
		};

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
