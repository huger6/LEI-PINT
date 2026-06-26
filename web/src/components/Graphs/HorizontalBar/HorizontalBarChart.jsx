import {
	ResponsiveContainer,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
} from 'recharts';
import styles from './HorizontalBarChart.module.css';

/**
 * Horizontal bar chart for comparing categorical data (e.g. badges per area).
 * @param {Array} data - Chart data entries.
 * @param {Object} [options] - Chart.js configuration overrides.
 */
// Renders a horizontal (vertical-layout) bar chart using Recharts.
export default function HorizontalBarChart({
	data = [],
	xAxisKey,
	yAxisKey,
	barColor = '#39639C',
	height = 400,
	onClick,
}) {
	return (
		<div className={styles.chartWrapper}>
			<ResponsiveContainer width="100%" height={height}>
				<BarChart
					data={data}
					layout="vertical"
					margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
					onClick={onClick}
				>
					<CartesianGrid strokeDasharray="3 3" horizontal={false} />
					<XAxis type="number" />
					<YAxis
						type="category"
						dataKey={yAxisKey}
						width={120}
					/>
					<Tooltip />
					<Bar
						dataKey={xAxisKey}
						fill={barColor}
						radius={[0, 6, 6, 0]}
						maxBarSize={32}
					/>
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}
