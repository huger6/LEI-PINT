import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

class QuickMetricCard extends StatelessWidget {
  const QuickMetricCard({
    super.key,
    required this.value,
    required this.label,
    required this.icon,
  });

  final String value;
  final String label;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 84,
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        boxShadow: const [
          BoxShadow(
            color: Color(0x18000000),
            blurRadius: 8,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            value,
            style: const TextStyle(
              fontSize: 30,
              fontWeight: FontWeight.w800,
              color: Color(0xFF59A9D9),
              height: 1,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 16, color: const Color(0xFF5C6977)),
              const SizedBox(width: 4),
              Flexible(
                child: Text(
                  label,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Color(0xFF43505D),
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class BadgesStatsCard extends StatelessWidget {
  const BadgesStatsCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        boxShadow: const [
          BoxShadow(
            color: Color(0x15000000),
            blurRadius: 8,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Badges Obtidos',
            style: TextStyle(
              fontSize: 19,
              fontWeight: FontWeight.w800,
              color: Color(0xFF3C4453),
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            height: 220,
            child: LineChart(
              LineChartData(
                minX: 0,
                maxX: 5,
                minY: 0,
                maxY: 21,
                borderData: FlBorderData(show: false),
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  horizontalInterval: 7,
                  getDrawingHorizontalLine: (_) =>
                      const FlLine(color: Color(0xFFE8EDF2), strokeWidth: 1),
                ),
                titlesData: FlTitlesData(
                  topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      interval: 7,
                      reservedSize: 30,
                      getTitlesWidget: (value, meta) {
                        return Text(
                          value.toInt().toString(),
                          style: const TextStyle(
                            color: Color(0xFF718192),
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        );
                      },
                    ),
                  ),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      interval: 1,
                      reservedSize: 24,
                      getTitlesWidget: (value, meta) {
                        const months = [
                          'Jan',
                          'Fev',
                          'Mar',
                          'Abr',
                          'Mai',
                          'Jun',
                        ];
                        final index = value.toInt();
                        if (index < 0 || index >= months.length) {
                          return const SizedBox.shrink();
                        }
                        return Padding(
                          padding: const EdgeInsets.only(top: 6),
                          child: Text(
                            months[index],
                            style: const TextStyle(
                              color: Color(0xFF5D6978),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),
                extraLinesData: ExtraLinesData(
                  verticalLines: [
                    VerticalLine(
                      x: 3,
                      color: const Color(0xFFAFB8C3),
                      strokeWidth: 1.4,
                      dashArray: [6, 4],
                    ),
                  ],
                ),
                lineBarsData: [
                  LineChartBarData(
                    spots: const [
                      FlSpot(0, 13),
                      FlSpot(1, 9),
                      FlSpot(2, 8),
                      FlSpot(3, 16),
                      FlSpot(4, 14),
                      FlSpot(5, 9),
                    ],
                    isCurved: true,
                    color: const Color(0xFFE57D97),
                    barWidth: 3,
                    isStrokeCapRound: true,
                    belowBarData: BarAreaData(show: false),
                    dotData: FlDotData(
                      show: true,
                      checkToShowDot: (spot, barData) => spot.x == 3,
                      getDotPainter: (spot, percent, barData, index) {
                        return FlDotCirclePainter(
                          radius: 5,
                          color: const Color(0xFFE57D97),
                          strokeWidth: 2,
                          strokeColor: Colors.white,
                        );
                      },
                    ),
                  ),
                  LineChartBarData(
                    spots: const [
                      FlSpot(0, 9),
                      FlSpot(1, 12),
                      FlSpot(2, 8),
                      FlSpot(3, 7),
                      FlSpot(4, 10),
                      FlSpot(5, 7),
                    ],
                    isCurved: true,
                    color: const Color(0xFF494CE6),
                    barWidth: 3,
                    isStrokeCapRound: true,
                    belowBarData: BarAreaData(show: false),
                    dotData: const FlDotData(show: false),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: const [
              LegendItem(color: Color(0xFFE57D97), label: 'Os seus dados'),
              SizedBox(width: 28),
              LegendItem(
                color: Color(0xFF494CE6),
                label: 'M\u00e9dia dos consultores',
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class LegendItem extends StatelessWidget {
  const LegendItem({super.key, required this.color, required this.label});

  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 5),
        Text(
          label,
          style: const TextStyle(
            color: Color(0xFF5E6C7A),
            fontWeight: FontWeight.w600,
            fontSize: 11,
          ),
        ),
      ],
    );
  }
}

class ProfileMenuTile extends StatelessWidget {
  const ProfileMenuTile({
    super.key,
    required this.icon,
    required this.label,
    this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        boxShadow: const [
          BoxShadow(
            color: Color(0x13000000),
            blurRadius: 8,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        leading: Container(
          width: 40,
          height: 40,
          decoration: const BoxDecoration(
            color: Color(0xFFD5EAF6),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: const Color(0xFF4D9ECC), size: 20),
        ),
        title: Text(
          label,
          style: const TextStyle(
            color: Color(0xFF1E2932),
            fontWeight: FontWeight.w700,
          ),
        ),
        trailing: const Icon(
          Icons.chevron_right_rounded,
          color: Color(0xFF8B96A1),
        ),
        onTap: onTap,
      ),
    );
  }
}
