import {
	ResponsiveContainer,
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
} from 'recharts';
import styles from './LineAreaChart.module.css';

export default function LineAreaChart({
	data = [],
	xAxisKey,
	yAxisKey,
	strokeColor = '#00B8E0',
	fillColor = 'rgba(0, 184, 224, 0.15)',
	height = 300,
	onClick,
}) {
	return (
		<div className={styles.chartWrapper}>
			<ResponsiveContainer width="100%" height={height}>
				<AreaChart
					data={data}
					margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
					onClick={onClick}
				>
					<CartesianGrid strokeDasharray="3 3" />
					<XAxis dataKey={xAxisKey} />
					<YAxis />
					<Tooltip />
					<Area
						type="monotone"
						dataKey={yAxisKey}
						stroke={strokeColor}
						strokeWidth={2}
						fill={fillColor}
						activeDot={{ r: 5, strokeWidth: 2 }}
					/>
				</AreaChart>
			</ResponsiveContainer>
		</div>
	);
}
