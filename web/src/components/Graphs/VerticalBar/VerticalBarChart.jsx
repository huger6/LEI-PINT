import {
	ResponsiveContainer,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
} from 'recharts';
import styles from './VerticalBarChart.module.css';

/**
 * Vertical bar chart for comparing values across categories.
 * @param {Array} data - Chart data entries.
 * @param {Object} [options] - Chart.js configuration overrides.
 */
export default function VerticalBarChart({
	data = [],
	xAxisKey,
	yAxisKey,
	valueName,
	barColor = '#00B8E0',
	height = 300,
	onClick,
}) {
	return (
		<div className={styles.chartWrapper}>
			<ResponsiveContainer width="100%" height={height}>
				<BarChart
					data={data}
					margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
					onClick={onClick}
				>
					<CartesianGrid strokeDasharray="3 3" vertical={false} />
					<XAxis dataKey={xAxisKey} />
					<YAxis />
					<Tooltip />
					<Bar
						dataKey={yAxisKey}
						name={valueName || yAxisKey}
						fill={barColor}
						radius={[6, 6, 0, 0]}
						maxBarSize={48}
					/>
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}
