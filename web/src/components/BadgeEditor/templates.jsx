import { Circle, Rect, Polygon, IText } from 'fabric';

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

function starPoints(cx, cy, outerR, innerR, points) {
	const pts = [];
	for (let i = 0; i < points * 2; i++) {
		const r = i % 2 === 0 ? outerR : innerR;
		const angle = (Math.PI / points) * i - Math.PI / 2;
		pts.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
	}
	return pts;
}

export const BADGE_TEMPLATES = [
	{
		id: 'classic-circle',
		nameKey: 'badgeEditor.templateClassic',
		icon: (
			<svg viewBox="0 0 40 40" fill="none">
				<circle cx="20" cy="20" r="16" fill="#00B8E0" stroke="#39639C" strokeWidth="2" />
				<text x="20" y="24" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">ABC</text>
			</svg>
		),
	},
	{
		id: 'shield-award',
		nameKey: 'badgeEditor.templateShield',
		icon: (
			<svg viewBox="0 0 40 40" fill="none">
				<path d="M8 10l12-4 12 4v10c0 7-5 12-12 14C13 32 8 27 8 20V10z" fill="#FFCC00" stroke="#39639C" strokeWidth="2" />
				<text x="20" y="24" textAnchor="middle" fill="#39639C" fontSize="7" fontWeight="bold">★</text>
			</svg>
		),
	},
	{
		id: 'hex-badge',
		nameKey: 'badgeEditor.templateHex',
		icon: (
			<svg viewBox="0 0 40 40" fill="none">
				<polygon points="20,4 34,12 34,28 20,36 6,28 6,12" fill="#39639C" stroke="#00B8E0" strokeWidth="2" />
				<text x="20" y="24" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="bold">HEX</text>
			</svg>
		),
	},
	{
		id: 'ribbon',
		nameKey: 'badgeEditor.templateRibbon',
		icon: (
			<svg viewBox="0 0 40 40" fill="none">
				<rect x="6" y="10" width="28" height="20" rx="4" fill="#B3261E" stroke="#fff" strokeWidth="1.5" />
				<text x="20" y="24" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="bold">PRO</text>
			</svg>
		),
	},
	{
		id: 'minimal',
		nameKey: 'badgeEditor.templateMinimal',
		icon: (
			<svg viewBox="0 0 40 40" fill="none">
				<rect x="4" y="4" width="32" height="32" rx="8" fill="#f5f5f5" stroke="#ccc" strokeWidth="1" />
				<text x="20" y="25" textAnchor="middle" fill="#1D1B20" fontSize="10" fontWeight="bold">A</text>
			</svg>
		),
	},
];

export function applyTemplate(templateId, fc, W, H) {
	fc.clear();
	fc.backgroundColor = '#ffffff';
	const cx = W / 2;
	const cy = H / 2;

	switch (templateId) {
		case 'classic-circle': {
			fc.backgroundColor = '#f0f8ff';
			const outer = new Circle({
				radius: 180, left: cx, top: cy,
				originX: 'center', originY: 'center',
				fill: '#00B8E0', stroke: '#39639C', strokeWidth: 6,
			});
			const inner = new Circle({
				radius: 140, left: cx, top: cy,
				originX: 'center', originY: 'center',
				fill: '#0098C0', stroke: '#ffffff', strokeWidth: 3,
			});
			const title = new IText('BADGE', {
				left: cx, top: cy - 20,
				originX: 'center', originY: 'center',
				fontSize: 48, fontFamily: 'Montserrat, sans-serif',
				fill: '#ffffff', fontWeight: 'bold', textAlign: 'center',
			});
			const subtitle = new IText('CERTIFIED', {
				left: cx, top: cy + 30,
				originX: 'center', originY: 'center',
				fontSize: 20, fontFamily: 'Inter, sans-serif',
				fill: '#ffffff', fontWeight: '400', textAlign: 'center',
				charSpacing: 200,
			});
			fc.add(outer, inner, title, subtitle);
			break;
		}
		case 'shield-award': {
			const shield = new Polygon(shieldPoints(0, 0, 280, 340), {
				left: cx, top: cy,
				originX: 'center', originY: 'center',
				fill: '#FFCC00', stroke: '#39639C', strokeWidth: 5,
			});
			const star = new Polygon(starPoints(0, 0, 50, 20, 5), {
				left: cx, top: cy - 40,
				originX: 'center', originY: 'center',
				fill: '#39639C', stroke: '#1D1B20', strokeWidth: 1,
			});
			const label = new IText('AWARD', {
				left: cx, top: cy + 40,
				originX: 'center', originY: 'center',
				fontSize: 36, fontFamily: 'Oswald, sans-serif',
				fill: '#39639C', fontWeight: 'bold', textAlign: 'center',
			});
			fc.add(shield, star, label);
			break;
		}
		case 'hex-badge': {
			fc.backgroundColor = '#1a1a2e';
			const hex = new Polygon(hexagonPoints(0, 0, 190), {
				left: cx, top: cy,
				originX: 'center', originY: 'center',
				fill: '#39639C', stroke: '#00B8E0', strokeWidth: 5,
			});
			const hexInner = new Polygon(hexagonPoints(0, 0, 150), {
				left: cx, top: cy,
				originX: 'center', originY: 'center',
				fill: 'transparent', stroke: '#00B8E0', strokeWidth: 2,
			});
			const txt = new IText('TECH', {
				left: cx, top: cy - 10,
				originX: 'center', originY: 'center',
				fontSize: 52, fontFamily: 'Poppins, sans-serif',
				fill: '#ffffff', fontWeight: 'bold', textAlign: 'center',
			});
			const sub = new IText('SPECIALIST', {
				left: cx, top: cy + 40,
				originX: 'center', originY: 'center',
				fontSize: 18, fontFamily: 'Inter, sans-serif',
				fill: '#00B8E0', fontWeight: '400', textAlign: 'center',
				charSpacing: 300,
			});
			fc.add(hex, hexInner, txt, sub);
			break;
		}
		case 'ribbon': {
			fc.backgroundColor = '#fafafa';
			const banner = new Rect({
				width: 360, height: 200,
				left: cx, top: cy,
				originX: 'center', originY: 'center',
				fill: '#B3261E', stroke: '#8C1D15', strokeWidth: 3,
				rx: 16, ry: 16,
			});
			const stripe = new Rect({
				width: 360, height: 6,
				left: cx, top: cy - 60,
				originX: 'center', originY: 'center',
				fill: '#ffffff',
			});
			const stripe2 = new Rect({
				width: 360, height: 6,
				left: cx, top: cy + 60,
				originX: 'center', originY: 'center',
				fill: '#ffffff',
			});
			const txt = new IText('PRO', {
				left: cx, top: cy - 10,
				originX: 'center', originY: 'center',
				fontSize: 64, fontFamily: 'Playfair Display, serif',
				fill: '#ffffff', fontWeight: 'bold', textAlign: 'center',
			});
			const sub = new IText('LEVEL', {
				left: cx, top: cy + 45,
				originX: 'center', originY: 'center',
				fontSize: 22, fontFamily: 'Montserrat, sans-serif',
				fill: '#ffffff', fontWeight: '400', textAlign: 'center',
				charSpacing: 400,
			});
			fc.add(banner, stripe, stripe2, txt, sub);
			break;
		}
		case 'minimal': {
			const bg = new Rect({
				width: 380, height: 380,
				left: cx, top: cy,
				originX: 'center', originY: 'center',
				fill: '#f5f5f5', stroke: '#e0e0e0', strokeWidth: 2,
				rx: 40, ry: 40,
			});
			const txt = new IText('A+', {
				left: cx, top: cy - 10,
				originX: 'center', originY: 'center',
				fontSize: 100, fontFamily: 'Inter, sans-serif',
				fill: '#1D1B20', fontWeight: 'bold', textAlign: 'center',
			});
			const sub = new IText('excellence', {
				left: cx, top: cy + 65,
				originX: 'center', originY: 'center',
				fontSize: 24, fontFamily: 'Inter, sans-serif',
				fill: '#888888', fontWeight: '400', textAlign: 'center',
				fontStyle: 'italic',
			});
			fc.add(bg, txt, sub);
			break;
		}
		default:
			break;
	}
	fc.requestRenderAll();
}
