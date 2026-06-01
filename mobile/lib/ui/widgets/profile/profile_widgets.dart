import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../../../models/earned_badge_model.dart';

class QuickMetricCard extends StatelessWidget {
  const QuickMetricCard({
    super.key,
    required this.value,
    required this.label,
    required this.icon,
    this.onTap,
  });

  final String value;
  final String label;
  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
      constraints: const BoxConstraints(minHeight: 84),
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
        mainAxisSize: MainAxisSize.min,
        children: [
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 30,
                fontWeight: FontWeight.w800,
                color: Color(0xFF59A9D9),
                height: 1,
              ),
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
    ),
    );
  }
}

class BadgesStatsCard extends StatelessWidget {
  const BadgesStatsCard({
    super.key,
    required this.earnedBadges,
    this.userCreatedAt,
  });

  final List<EarnedBadge> earnedBadges;
  final DateTime? userCreatedAt;

  static const _monthNames = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
  ];

  List<_MonthPoint> _buildCumulativeData() {
    final now = DateTime.now();
    final start = userCreatedAt ?? now.subtract(const Duration(days: 180));

    final activeBadges = earnedBadges
        .where((e) => !e.award.isExpired)
        .toList()
      ..sort((a, b) => a.award.awardedAt.compareTo(b.award.awardedAt));

    final monthCount = <String, int>{};
    for (final badge in activeBadges) {
      final d = badge.award.awardedAt;
      final key = '${d.year}-${d.month.toString().padLeft(2, '0')}';
      monthCount[key] = (monthCount[key] ?? 0) + 1;
    }

    final months = <_MonthPoint>[];
    var cursor = DateTime(start.year, start.month);
    final end = DateTime(now.year, now.month);
    var cumulative = 0;

    while (!cursor.isAfter(end)) {
      final key =
          '${cursor.year}-${cursor.month.toString().padLeft(2, '0')}';
      cumulative += monthCount[key] ?? 0;
      months.add(_MonthPoint(
        month: cursor.month,
        year: cursor.year,
        count: cumulative,
      ));
      cursor = DateTime(cursor.year, cursor.month + 1);
    }

    if (months.length > 6) {
      return months.sublist(months.length - 6);
    }
    return months;
  }

  @override
  Widget build(BuildContext context) {
    final data = _buildCumulativeData();

    final spots = List.generate(data.length, (i) {
      return FlSpot(i.toDouble(), data[i].count.toDouble());
    });

    final labels = data.map((d) => _monthNames[d.month - 1]).toList();

    final maxY = spots.isEmpty
        ? 5.0
        : (spots.map((s) => s.y).reduce((a, b) => a > b ? a : b) * 1.3)
            .ceilToDouble()
            .clamp(1, 1000);

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
          Row(
            children: [
              const Text(
                'Badges Obtidos',
                style: TextStyle(
                  fontSize: 19,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF3C4453),
                ),
              ),
              const Spacer(),
              Text(
                '${earnedBadges.where((e) => !e.award.isExpired).length} ativos',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF5D9FD1),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          SizedBox(
            height: 180,
            child: spots.isEmpty || spots.every((s) => s.y == 0)
                ? const Center(
                    child: Text(
                      'Sem dados de evolu\u00e7\u00e3o.',
                      style: TextStyle(
                        color: Color(0xFF8CA0B2),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  )
                : LineChart(
                    LineChartData(
                      minX: 0,
                      maxX: (spots.length - 1).toDouble(),
                      minY: 0,
                      maxY: maxY.toDouble(),
                      borderData: FlBorderData(show: false),
                      gridData: FlGridData(
                        show: true,
                        drawVerticalLine: false,
                        horizontalInterval: (maxY / 3).clamp(1, 100),
                        getDrawingHorizontalLine: (_) => const FlLine(
                          color: Color(0xFFE8EDF2),
                          strokeWidth: 1,
                        ),
                      ),
                      lineTouchData: LineTouchData(
                        touchTooltipData: LineTouchTooltipData(
                          getTooltipColor: (_) => const Color(0xFF2C3E50),
                          tooltipBorderRadius: BorderRadius.circular(8),
                          getTooltipItems: (touchedSpots) {
                            return touchedSpots.map((spot) {
                              return LineTooltipItem(
                                '${spot.y.toInt()} badges',
                                const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 13,
                                ),
                              );
                            }).toList();
                          },
                        ),
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
                            interval: (maxY / 3).clamp(1, 100),
                            reservedSize: 30,
                            getTitlesWidget: (value, meta) {
                              if (value != value.roundToDouble()) {
                                return const SizedBox.shrink();
                              }
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
                              final index = value.toInt();
                              if (index < 0 || index >= labels.length) {
                                return const SizedBox.shrink();
                              }
                              return Padding(
                                padding: const EdgeInsets.only(top: 6),
                                child: Text(
                                  labels[index],
                                  style: const TextStyle(
                                    color: Color(0xFF5D6978),
                                    fontWeight: FontWeight.w600,
                                    fontSize: 12,
                                  ),
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
                          curveSmoothness: 0.3,
                          color: const Color(0xFF5D9FD1),
                          barWidth: 2.5,
                          isStrokeCapRound: true,
                          dotData: FlDotData(
                            show: true,
                            getDotPainter: (spot, percent, barData, index) =>
                                FlDotCirclePainter(
                              radius: 4,
                              color: const Color(0xFF5D9FD1),
                              strokeWidth: 2,
                              strokeColor: Colors.white,
                            ),
                          ),
                          belowBarData: BarAreaData(
                            show: true,
                            gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [
                                const Color(0xFF5D9FD1).withValues(alpha: 0.18),
                                const Color(0xFF5D9FD1).withValues(alpha: 0.02),
                              ],
                            ),
                          ),
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

class _MonthPoint {
  const _MonthPoint({
    required this.month,
    required this.year,
    required this.count,
  });
  final int month;
  final int year;
  final int count;
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
