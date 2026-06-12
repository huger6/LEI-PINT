import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../../../core/sync_manager.dart';
import '../../../core/theme/app_colors.dart';

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

class HistoryCard extends StatefulWidget {
  const HistoryCard({super.key, required this.item});

  final PointsHistoryItem item;

  @override
  State<HistoryCard> createState() => _HistoryCardState();
}

class _HistoryCardState extends State<HistoryCard>
    with SingleTickerProviderStateMixin {
  bool _expanded = false;

  Widget _buildIcon(PointsHistoryItem item, bool isPositive) {
    if (item.badgeMedalColor != null) {
      return Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: item.badgeMedalColor!.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            Icon(
              Icons.workspace_premium_rounded,
              color: item.badgeMedalColor,
              size: 26,
            ),
            Positioned(
              right: 4,
              bottom: 4,
              child: Container(
                width: 14,
                height: 14,
                decoration: BoxDecoration(
                  color: isPositive
                      ? const Color(0xFF2E9E4D)
                      : const Color(0xFFD94A2A),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 1.5),
                ),
                child: Icon(
                  isPositive ? Icons.add : Icons.remove,
                  size: 8,
                  color: Colors.white,
                ),
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: isPositive
            ? AppColors.primary.withValues(alpha: 0.1)
            : AppColors.error.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Icon(
        isPositive
            ? Icons.trending_up_rounded
            : Icons.trending_down_rounded,
        color: isPositive ? AppColors.primary : AppColors.error,
        size: 24,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    final item = widget.item;
    final isPositive = item.gainedPoints >= 0;
    final pointsText =
        isPositive ? '+${item.gainedPoints}' : '${item.gainedPoints}';

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: const Color(0xFFECF0F4),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1A2530).withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 14, 14, 14),
            child: Row(
              children: [
                _buildIcon(item, isPositive),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.title,
                        style: const TextStyle(
                          fontSize: 15,
                          color: Color(0xFF1F2B37),
                          fontWeight: FontWeight.w600,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 3),
                      Text(
                        [item.firstDescription, item.secondDescription]
                            .where((s) => s.isNotEmpty)
                            .join(' • '),
                        style: const TextStyle(
                          fontSize: 13,
                          color: Color(0xFF8A929B),
                          fontWeight: FontWeight.w500,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  pointsText,
                  style: TextStyle(
                    fontSize: 22,
                    color: isPositive
                        ? const Color(0xFF2E9E4D)
                        : const Color(0xFFD94A2A),
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(width: 6),
                GestureDetector(
                  onTap: () => setState(() => _expanded = !_expanded),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        _expanded ? tr.tr('seeLess') : tr.tr('seeMore'),
                        style: const TextStyle(
                          color: AppColors.secondary,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(width: 2),
                      AnimatedRotation(
                        turns: _expanded ? 0.5 : 0.0,
                        duration: const Duration(milliseconds: 200),
                        child: const Icon(
                          Icons.keyboard_arrow_down_rounded,
                          color: AppColors.secondary,
                          size: 20,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          AnimatedCrossFade(
            firstChild: const SizedBox(width: double.infinity),
            secondChild: Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF6F8FA),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (item.firstDescription.isNotEmpty) ...[
                      Text(
                        item.firstDescription,
                        style: const TextStyle(
                          fontSize: 13,
                          color: Color(0xFF4A535D),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                    ],
                    if (item.secondDescription.isNotEmpty)
                      Text(
                        item.secondDescription,
                        style: const TextStyle(
                          fontSize: 13,
                          color: Color(0xFF6D7680),
                          fontWeight: FontWeight.w400,
                        ),
                      ),
                    if (item.date.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          const Icon(
                            Icons.schedule_rounded,
                            size: 14,
                            color: Color(0xFF8A929B),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            item.date,
                            style: const TextStyle(
                              fontSize: 12,
                              color: Color(0xFF8A929B),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ),
            crossFadeState:
                _expanded ? CrossFadeState.showSecond : CrossFadeState.showFirst,
            duration: const Duration(milliseconds: 200),
          ),
        ],
      ),
    );
  }
}

class WeeklyPointsChart extends StatelessWidget {
  const WeeklyPointsChart({super.key, required this.pointsHistory});

  final List<Map<String, dynamic>> pointsHistory;

  static const _weekdayLabelsPt = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  static const _weekdayLabelsEn = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  static const _weekdayLabelsEs = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  List<String> _weekdayLabels(BuildContext context) {
    final lang = LanguageScope.of(context).languageCode;
    if (lang.contains('en')) return _weekdayLabelsEn;
    if (lang.contains('es')) return _weekdayLabelsEs;
    return _weekdayLabelsPt;
  }

  Map<int, double> _aggregateByWeekday() {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final weekStart = today.subtract(Duration(days: today.weekday - 1));

    final dailyPoints = <int, double>{};
    for (var i = 0; i < 7; i++) {
      dailyPoints[i] = 0;
    }

    for (final entry in pointsHistory) {
      final createdAt = entry['created_at'];
      if (createdAt == null) continue;

      DateTime? date;
      if (createdAt is String) {
        date = DateTime.tryParse(createdAt);
      }
      if (date == null) continue;

      final entryDay = DateTime(date.year, date.month, date.day);
      if (entryDay.isBefore(weekStart) || entryDay.isAfter(today)) continue;

      final dayIndex = entryDay.weekday - 1;
      final delta = entry['points_delta'];
      final points =
          delta is int ? delta.toDouble() : double.tryParse(delta?.toString() ?? '') ?? 0;
      if (points > 0) {
        dailyPoints[dayIndex] = (dailyPoints[dayIndex] ?? 0) + points;
      }
    }

    return dailyPoints;
  }

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    final labels = _weekdayLabels(context);
    final dailyPoints = _aggregateByWeekday();

    final spots = List.generate(7, (i) {
      return FlSpot(i.toDouble(), dailyPoints[i] ?? 0);
    });

    final maxY = spots.map((s) => s.y).reduce((a, b) => a > b ? a : b);
    final chartMaxY = maxY == 0 ? 10.0 : (maxY * 1.3).ceilToDouble();

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFECF0F4), width: 1),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1A2530).withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            tr.tr('weeklyPoints'),
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: Color(0xFF21262C),
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 170,
            child: LineChart(
                    LineChartData(
                      minX: 0,
                      maxX: 6,
                      minY: 0,
                      maxY: chartMaxY,
                      borderData: FlBorderData(show: false),
                      gridData: FlGridData(
                        show: true,
                        drawVerticalLine: false,
                        horizontalInterval: (chartMaxY / 4).clamp(1, 10000),
                        getDrawingHorizontalLine: (_) => const FlLine(
                          color: Color(0xFFF0F2F5),
                          strokeWidth: 1,
                        ),
                      ),
                      lineTouchData: LineTouchData(
                        touchTooltipData: LineTouchTooltipData(
                          getTooltipColor: (_) => const Color(0xFF2C3E50),
                          tooltipBorderRadius: BorderRadius.circular(8),
                          getTooltipItems: (spots) {
                            return spots.map((spot) {
                              return LineTooltipItem(
                                '${spot.y.toInt()} pts',
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
                        leftTitles: const AxisTitles(
                          sideTitles: SideTitles(showTitles: false),
                        ),
                        bottomTitles: AxisTitles(
                          sideTitles: SideTitles(
                            showTitles: true,
                            reservedSize: 28,
                            interval: 1,
                            getTitlesWidget: (value, _) {
                              final index = value.toInt();
                              if (index < 0 || index >= labels.length) {
                                return const SizedBox.shrink();
                              }
                              return Padding(
                                padding: const EdgeInsets.only(top: 8),
                                child: Text(
                                  labels[index],
                                  style: const TextStyle(
                                    color: Color(0xFF8A929B),
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
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
                          color: AppColors.primary,
                          barWidth: 2.5,
                          isStrokeCapRound: true,
                          dotData: FlDotData(
                            show: true,
                            getDotPainter: (spot, percent, barData, index) =>
                                FlDotCirclePainter(
                              radius: 4.5,
                              color: AppColors.primary,
                              strokeWidth: 2.5,
                              strokeColor: Colors.white,
                            ),
                          ),
                          belowBarData: BarAreaData(
                            show: true,
                            gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [
                                AppColors.primary.withValues(alpha: 0.2),
                                AppColors.primary.withValues(alpha: 0.02),
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

class MonthlyPointsChart extends StatelessWidget {
  const MonthlyPointsChart({super.key, required this.pointsHistory});

  static const _monthNamesPt = [
    'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN',
    'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ',
  ];
  static const _monthNamesEn = [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
  ];
  static const _monthNamesEs = [
    'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN',
    'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC',
  ];

  final List<Map<String, dynamic>> pointsHistory;

  List<String> _monthNames(BuildContext context) {
    final lang = LanguageScope.of(context).languageCode;
    if (lang.contains('en')) return _monthNamesEn;
    if (lang.contains('es')) return _monthNamesEs;
    return _monthNamesPt;
  }

  List<_MonthData> _aggregateByMonth(BuildContext context) {
    final now = DateTime.now();
    final months = List.generate(4, (i) {
      final d = DateTime(now.year, now.month - (3 - i));
      return DateTime(d.year, d.month);
    });

    final monthlyPoints = <String, double>{};
    for (final m in months) {
      monthlyPoints['${m.year}-${m.month}'] = 0;
    }

    for (final entry in pointsHistory) {
      final createdAt = entry['created_at'];
      if (createdAt == null) continue;

      DateTime? date;
      if (createdAt is String) {
        date = DateTime.tryParse(createdAt);
      }
      if (date == null) continue;

      final key = '${date.year}-${date.month}';
      if (monthlyPoints.containsKey(key)) {
        final delta = entry['points_delta'];
        final points =
            delta is int ? delta.toDouble() : double.tryParse(delta?.toString() ?? '') ?? 0;
        if (points > 0) {
          monthlyPoints[key] = (monthlyPoints[key] ?? 0) + points;
        }
      }
    }

    final names = _monthNames(context);
    return months.map((m) {
      final key = '${m.year}-${m.month}';
      return _MonthData(
        label: names[m.month - 1],
        value: monthlyPoints[key] ?? 0,
      );
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    final monthData = _aggregateByMonth(context);
    final maxVal = monthData.map((m) => m.value).reduce((a, b) => a > b ? a : b);
    final maxY = maxVal == 0 ? 10.0 : (maxVal * 1.3).ceilToDouble();

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFECF0F4), width: 1),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1A2530).withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            tr.tr('monthlyPoints'),
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: Color(0xFF21262C),
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 170,
            child: BarChart(
                    BarChartData(
                      maxY: maxY,
                      alignment: BarChartAlignment.spaceAround,
                      borderData: FlBorderData(show: false),
                      gridData: FlGridData(
                        show: true,
                        drawVerticalLine: false,
                        horizontalInterval: (maxY / 4).clamp(1, 10000),
                        getDrawingHorizontalLine: (_) => const FlLine(
                          color: Color(0xFFF0F2F5),
                          strokeWidth: 1,
                        ),
                      ),
                      barTouchData: BarTouchData(
                        touchTooltipData: BarTouchTooltipData(
                          getTooltipColor: (_) => const Color(0xFF2C3E50),
                          tooltipBorderRadius: BorderRadius.circular(8),
                          getTooltipItem: (group, groupIndex, rod, rodIndex) {
                            return BarTooltipItem(
                              '${rod.toY.toInt()} pts',
                              const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w600,
                                fontSize: 13,
                              ),
                            );
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
                        leftTitles: const AxisTitles(
                          sideTitles: SideTitles(showTitles: false),
                        ),
                        bottomTitles: AxisTitles(
                          sideTitles: SideTitles(
                            showTitles: true,
                            reservedSize: 28,
                            getTitlesWidget: (value, _) {
                              final index = value.toInt();
                              if (index < 0 || index >= monthData.length) {
                                return const SizedBox.shrink();
                              }
                              return Padding(
                                padding: const EdgeInsets.only(top: 8),
                                child: Text(
                                  monthData[index].label,
                                  style: const TextStyle(
                                    color: Color(0xFF8A929B),
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                      ),
                      barGroups: List.generate(monthData.length, (i) {
                        return BarChartGroupData(
                          x: i,
                          barRods: [
                            BarChartRodData(
                              toY: monthData[i].value,
                              width: 40,
                              borderRadius: const BorderRadius.vertical(
                                top: Radius.circular(8),
                              ),
                              gradient: const LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                colors: [
                                  AppColors.primary,
                                  Color(0xFF7ED8F0),
                                ],
                              ),
                            ),
                          ],
                        );
                      }),
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

class _MonthData {
  const _MonthData({required this.label, required this.value});
  final String label;
  final double value;
}

class PointsHistoryItem {
  const PointsHistoryItem({
    required this.title,
    required this.firstDescription,
    required this.secondDescription,
    required this.gainedPoints,
    this.date = '',
    this.badgeMedalColor,
    this.badgeRibbonColor,
  });

  final String title;
  final String firstDescription;
  final String secondDescription;
  final int gainedPoints;
  final String date;
  final Color? badgeMedalColor;
  final Color? badgeRibbonColor;
}
