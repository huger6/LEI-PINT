import {
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
	Tooltip,
	Legend,
} from 'recharts';
import styles from './PieDonutChart.module.css';

const DEFAULT_COLORS = ['#00B8E0', '#39639C', '#04CE00', '#CFA600', '#B3261E'];

/**
 * Pie/donut chart for showing proportional distribution (e.g. application states).
 * @param {Array} data - Chart data entries.
 * @param {Object} [options] - Chart.js configuration overrides.
 */
export default function PieDonutChart({
	data = [],
	nameKey,
	valueKey,
	valueName,
	colors = DEFAULT_COLORS,
	isDonut = false,
	height = 300,
	onClick,
}) {
	return (
		<div className={styles.chartWrapper}>
			<ResponsiveContainer width="100%" height={height}>
				<PieChart>
					<Pie
						data={data}
						dataKey={valueKey}
						nameKey={nameKey}
						cx="50%"
						cy="50%"
						outerRadius="75%"
						innerRadius={isDonut ? '45%' : 0}
						paddingAngle={isDonut ? 3 : 0}
						onClick={onClick}
					>
						{data.map((_, index) => (
							<Cell
								key={`cell-${index}`}
								fill={colors[index % colors.length]}
							/>
						))}
					</Pie>
					<Tooltip
						formatter={(value, _name, entry) => [value, entry?.payload?.[nameKey] ?? valueName]}
					/>
					<Legend
						verticalAlign="bottom"
						align="center"
						iconType="circle"
						iconSize={10}
					/>
				</PieChart>
			</ResponsiveContainer>
		</div>
	);
}
