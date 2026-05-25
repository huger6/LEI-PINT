import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../../../core/sync_manager.dart';

class PointsHighlight extends StatelessWidget {
  const PointsHighlight({super.key, required this.totalPoints});

  final int totalPoints;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF6DC1E3), Color(0xFF658CC9)],
            ),
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF1F3954).withValues(alpha: 0.23),
                blurRadius: 14,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: const Icon(
            Icons.workspace_premium_rounded,
            color: Colors.white,
            size: 40,
          ),
        ),
        const SizedBox(height: 14),
        Text(
          '$totalPoints',
          style: const TextStyle(
            fontSize: 52,
            color: Color(0xFF56A8D7),
            fontWeight: FontWeight.w700,
          ),
        ),
        Text(
          LanguageScope.of(context).tr('pointsLabel'),
          style: const TextStyle(
            fontSize: 20,
            color: Color(0xFF5A6774),
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}

class HistoryCard extends StatelessWidget {
  const HistoryCard({super.key, required this.item});

  final PointsHistoryItem item;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(14, 14, 12, 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1A2530).withValues(alpha: 0.08),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: const Color(0xFFD6EEF8),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(
              Icons.trending_up_rounded,
              color: Color(0xFF5A78A8),
              size: 24,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.title,
                  style: const TextStyle(
                    fontSize: 16,
                    color: Color(0xFF1F2B37),
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${item.firstDescription}  -  ${item.secondDescription}',
                  style: const TextStyle(
                    fontSize: 14,
                    color: Color(0xFF666F7A),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          Text(
            '+${item.gainedPoints}',
            style: const TextStyle(
              fontSize: 34,
              color: Color(0xFF53BB38),
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(width: 10),
          InkWell(
            onTap: () {},
            borderRadius: BorderRadius.circular(8),
            child: const Padding(
              padding: EdgeInsets.symmetric(horizontal: 2, vertical: 8),
              child: Row(
                children: [
                  Text(
                    'Ver mais',
                    style: TextStyle(
                      color: Color(0xFF4A6793),
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  SizedBox(width: 2),
                  Icon(
                    Icons.keyboard_arrow_down_rounded,
                    color: Color(0xFF7A8490),
                    size: 20,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class DailyEvolutionCard extends StatelessWidget {
  const DailyEvolutionCard({super.key, this.timeline = const []});

  final List<Map<String, dynamic>> timeline;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1A2530).withValues(alpha: 0.08),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: SizedBox(
        height: 180,
        child: DailyLineChart(timeline: timeline),
      ),
    );
  }
}

class DailyLineChart extends StatelessWidget {
  const DailyLineChart({super.key, this.timeline = const []});

  static const _monthNames = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
  ];

  final List<Map<String, dynamic>> timeline;

  @override
  Widget build(BuildContext context) {
    final recent = timeline.length > 6
        ? timeline.sublist(timeline.length - 6)
        : timeline;

    final spots = List.generate(recent.length, (i) {
      final val = (recent[i]['cumulative_badges'] ??
              recent[i]['cumulative_certifications'] ??
              0) as num;
      return FlSpot(i.toDouble(), val.toDouble());
    });

    final labels = recent.map((row) {
      final m = row['month'];
      if (m is int && m >= 1 && m <= 12) return _monthNames[m - 1];
      return m?.toString() ?? '';
    }).toList();

    if (spots.isEmpty) {
      return const Center(
        child: Text(
          'Sem dados dispon\u00edveis.',
          style: TextStyle(
            color: Color(0xFF8CA0B2),
            fontWeight: FontWeight.w600,
          ),
        ),
      );
    }

    final maxY = spots.map((s) => s.y).reduce((a, b) => a > b ? a : b);
    final chartMaxY = (maxY * 1.3).ceilToDouble().clamp(1, 10000);

    return LineChart(
      LineChartData(
        minX: 0,
        maxX: (spots.length - 1).toDouble(),
        minY: 0,
        maxY: chartMaxY.toDouble(),
        borderData: FlBorderData(show: false),
        gridData: FlGridData(
          show: true,
          drawVerticalLine: false,
          horizontalInterval: (chartMaxY / 4).clamp(1, 1000),
          getDrawingHorizontalLine: (_) =>
              const FlLine(color: Color(0xFFE7ECF1), strokeWidth: 1),
        ),
        lineTouchData: LineTouchData(enabled: false),
        titlesData: FlTitlesData(
          topTitles: const AxisTitles(
            sideTitles: SideTitles(showTitles: false),
          ),
          rightTitles: const AxisTitles(
            sideTitles: SideTitles(showTitles: false),
          ),
          leftTitles: const AxisTitles(
            sideTitles: SideTitles(showTitles: false),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 24,
              interval: 1,
              getTitlesWidget: (value, _) {
                final index = value.toInt();
                if (index < 0 || index >= labels.length) {
                  return const SizedBox.shrink();
                }
                return Text(
                  labels[index],
                  style: const TextStyle(
                    color: Color(0xFF6D7680),
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                );
              },
            ),
          ),
        ),
        lineBarsData: [
          LineChartBarData(
            spots: spots,
            isCurved: true,
            color: const Color(0xFF5EB3DC),
            barWidth: 3,
            isStrokeCapRound: true,
            dotData: FlDotData(
              show: true,
              getDotPainter: (spot, percent, barData, index) =>
                  FlDotCirclePainter(
                    radius: 4,
                    color: const Color(0xFF5EB3DC),
                    strokeWidth: 0,
                  ),
            ),
            belowBarData: BarAreaData(
              show: true,
              gradient: const LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Color(0x445EB3DC), Color(0x0A5EB3DC)],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class MonthlyEvolutionCard extends StatelessWidget {
  const MonthlyEvolutionCard({super.key, this.timeline = const []});

  static const _monthNames = [
    'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN',
    'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ',
  ];

  final List<Map<String, dynamic>> timeline;

  @override
  Widget build(BuildContext context) {
    final recent = timeline.length > 4
        ? timeline.sublist(timeline.length - 4)
        : timeline;

    final barValues = recent.map((row) {
      final val = (row['cumulative_badges'] ??
              row['cumulative_certifications'] ??
              0) as num;
      return val.toDouble();
    }).toList();

    final labels = recent.map((row) {
      final m = row['month'];
      if (m is int && m >= 1 && m <= 12) return _monthNames[m - 1];
      return m?.toString() ?? '';
    }).toList();

    final maxY = barValues.isEmpty
        ? 28.0
        : (barValues.reduce((a, b) => a > b ? a : b) * 1.3)
            .ceilToDouble()
            .clamp(1, 10000);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1A2530).withValues(alpha: 0.08),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: SizedBox(
        height: 185,
        child: barValues.isEmpty
            ? const Center(
                child: Text(
                  'Sem dados dispon\u00edveis.',
                  style: TextStyle(
                    color: Color(0xFF8CA0B2),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              )
            : BarChart(
                BarChartData(
                  maxY: maxY.toDouble(),
                  borderData: FlBorderData(show: false),
                  gridData: FlGridData(
                    show: true,
                    drawVerticalLine: false,
                    horizontalInterval: (maxY / 4).clamp(1, 1000),
                    getDrawingHorizontalLine: (_) =>
                        const FlLine(color: Color(0xFFE7ECF1), strokeWidth: 1),
                  ),
                  barTouchData: BarTouchData(enabled: false),
                  titlesData: FlTitlesData(
                    topTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    rightTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    leftTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 24,
                        getTitlesWidget: (value, _) {
                          final index = value.toInt();
                          if (index < 0 || index >= labels.length) {
                            return const SizedBox.shrink();
                          }
                          return Text(
                            labels[index],
                            style: const TextStyle(
                              color: Color(0xFF6D7680),
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                  barGroups: List.generate(barValues.length, (i) {
                    return BarChartGroupData(
                      x: i,
                      barRods: [
                        BarChartRodData(
                          toY: barValues[i],
                          width: 22,
                          borderRadius: const BorderRadius.vertical(
                            top: Radius.circular(8),
                          ),
                          color: const Color(0xFF8ACCEC),
                        ),
                      ],
                    );
                  }),
                ),
              ),
      ),
    );
  }
}

class PointsHistoryItem {
  const PointsHistoryItem({
    required this.title,
    required this.firstDescription,
    required this.secondDescription,
    required this.gainedPoints,
  });

  final String title;
  final String firstDescription;
  final String secondDescription;
  final int gainedPoints;
}
