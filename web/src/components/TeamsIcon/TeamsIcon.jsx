// Microsoft Teams logo (white monochrome silhouette) for use on the Teams-purple
// "Message on Teams" button. The "T" is cut out in the Teams purple so it reads
// correctly against the button background.
export default function TeamsIcon({ size = 18, className = '' }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			className={className}
			aria-hidden="true"
			focusable="false"
		>
			{/* person dot */}
			<circle cx="18.1" cy="6" r="2.5" fill="#fff" />
			{/* side panel */}
			<path d="M20.4 9.2h-3.6v6.1a2.7 2.7 0 0 0 2.5 2.69 2.6 2.6 0 0 0 2.2-2.59V10.3a1.1 1.1 0 0 0-1.1-1.1z" fill="#fff" fillOpacity="0.85" />
			{/* main rounded square */}
			<rect x="2.4" y="5.5" width="13" height="13" rx="2.6" fill="#fff" />
			{/* the "T" cut out in Teams purple */}
			<path d="M5.2 8.25h7.5v1.95H10.2v6.2H7.7v-6.2H5.2z" fill="#6264A7" />
		</svg>
	);
}
