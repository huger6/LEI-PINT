import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../presentation/state/language_controller.dart';
import '../shared/app_icon/app_icon.dart';
import '../shared/app_icon/app_icon_data.dart';

class MainBadgesCard extends StatelessWidget {
  const MainBadgesCard({
    super.key,
    required this.badgeCount,
    required this.growthPercent,
    this.timeline = const [],
    this.yearlyBadges = const {},
  });

  final int badgeCount;
  final int growthPercent;
  final List<Map<String, dynamic>> timeline;
  final Map<int, int> yearlyBadges;

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    final isPositive = growthPercent >= 0;

    final currentYear = DateTime.now().year;
    final paddedBadges = Map<int, int>.from(yearlyBadges);
    if (paddedBadges.isEmpty) {
      paddedBadges[currentYear - 1] = 0;
      paddedBadges[currentYear] = 0;
    } else if (paddedBadges.length == 1) {
      final onlyYear = paddedBadges.keys.first;
      if (onlyYear >= currentYear) {
        paddedBadges.putIfAbsent(onlyYear - 1, () => 0);
      } else {
        paddedBadges.putIfAbsent(onlyYear + 1, () => 0);
      }
    }
    final years = paddedBadges.keys.toList()..sort();
    final spots = List.generate(years.length, (i) {
      return FlSpot(i.toDouble(), (paddedBadges[years[i]] ?? 0).toDouble());
    });
    final labels = years.map((y) => '$y').toList();

    final maxVal = spots.map((s) => s.y).reduce((a, b) => a > b ? a : b);
    final maxY = maxVal > 0
        ? (maxVal * 1.3).ceilToDouble().clamp(1.0, 100000.0)
        : 5.0;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 20),
      decoration: BoxDecoration(
        color: const Color(0xFFF7FBFF),
        borderRadius: BorderRadius.circular(20),
        boxShadow: const [
          BoxShadow(
            color: Color(0x1B4A5C6D),
            blurRadius: 14,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            tr.tr('badgesByYear'),
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: Color(0xFF2E3A46),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Flexible(
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Text(
                    '$badgeCount',
                    style: const TextStyle(
                      fontSize: 40,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF21303D),
                      height: 1,
                    ),
                  ),
                ),
              ),
              if (growthPercent != 0) ...[
                const SizedBox(width: 12),
                AppIcon(
                  isPositive
                      ? AppIcons.progress
                      : AppIcons.progress,
                  color: isPositive
                      ? const Color(0xFF2FB45A)
                      : const Color(0xFFD63D2B),
                  size: 26,
                ),
                const SizedBox(width: 4),
                Flexible(
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      '${growthPercent.abs()}%',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        color: isPositive
                            ? const Color(0xFF2FB45A)
                            : const Color(0xFFD63D2B),
                      ),
                    ),
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 6),
          SizedBox(
            height: 190,
            child: LineChart(
                    LineChartData(
                      minX: 0,
                      maxX: (spots.length - 1).toDouble(),
                      minY: 0,
                      maxY: maxY,
                      borderData: FlBorderData(show: false),
                      gridData: FlGridData(
                        show: true,
                        drawVerticalLine: false,
                        horizontalInterval: (maxY / 4).clamp(1, 100),
                        getDrawingHorizontalLine: (value) => const FlLine(
                          color: Color(0xFFE2EAF2),
                          strokeWidth: 1,
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
                            interval: 1,
                            reservedSize: 32,
                            getTitlesWidget: (value, meta) {
                              final index = value.toInt();
                              if (index < 0 || index >= labels.length) {
                                return const SizedBox.shrink();
                              }
                              return Padding(
                                padding: const EdgeInsets.only(top: 8),
                                child: Text(
                                  labels[index],
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: Color(0xFF8CA0B2),
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
                          color: const Color(0xFF568FC2),
                          barWidth: 4,
                          isStrokeCapRound: true,
                          dotData: const FlDotData(show: false),
                          belowBarData: BarAreaData(
                            show: true,
                            gradient: const LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [
                                Color(0x664E91C3),
                                Color(0x114E91C3),
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

class MiniStatCard extends StatelessWidget {
  const MiniStatCard({
    super.key,
    required this.title,
    required this.value,
    required this.icon,
    required this.accentColor,
    this.onTap,
  });

  final String title;
  final String value;
  final String icon;
  final Color accentColor;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 10),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FBFF),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Color(0xFF334453),
            ),
          ),
          const Spacer(),
          Row(
            children: [
              Stack(
                clipBehavior: Clip.none,
                children: [
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: accentColor.withValues(alpha: 0.2),
                      shape: BoxShape.circle,
                    ),
                  ),
                  Positioned(
                    right: -2,
                    top: -3,
                    child: Container(
                      width: 14,
                      height: 14,
                      decoration: BoxDecoration(
                        color: accentColor.withValues(alpha: 0.4),
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                  Positioned.fill(
                    child: AppIcon(icon, color: accentColor, size: 22),
                  ),
                ],
              ),
              const Spacer(),
              Flexible(
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerRight,
                  child: Text(
                    value,
                    style: const TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF263746),
                    ),
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

class PointsBarCard extends StatefulWidget {
  const PointsBarCard({
    super.key,
    required this.selectedPeriod,
    required this.periodOptions,
    required this.onPeriodChanged,
    this.pointsHistory = const [],
  });

  final String selectedPeriod;
  final List<String> periodOptions;
  final ValueChanged<String?> onPeriodChanged;
  final List<Map<String, dynamic>> pointsHistory;

  @override
  State<PointsBarCard> createState() => _PointsBarCardState();
}

class _PointsBarCardState extends State<PointsBarCard> {
  static const _monthKeys = [
    'monthShortJan', 'monthShortFeb', 'monthShortMar', 'monthShortApr',
    'monthShortMay', 'monthShortJun', 'monthShortJul', 'monthShortAug',
    'monthShortSep', 'monthShortOct', 'monthShortNov', 'monthShortDec',
  ];

  static const _periodTranslationKeys = {
    'weekly': 'periodWeekly',
    'monthly': 'periodMonthly',
    'yearly': 'periodYearly',
  };

  int _selectedBarIndex = -1;

  DateTime? _parseDate(dynamic raw) {
    if (raw is String) return DateTime.tryParse(raw);
    return null;
  }

  double _delta(Map<String, dynamic> entry) {
    return ((entry['points_delta'] ?? entry['pointsDelta'] ?? 0) as num).toDouble();
  }

  Map<String, double> _aggregateByWeek() {
    final now = DateTime.now();
    final buckets = <String, double>{};
    for (var i = 4; i >= 0; i--) {
      final weekEnd = now.subtract(Duration(days: 7 * i));
      final weekStart = weekEnd.subtract(const Duration(days: 6));
      final label = '${weekStart.day.toString().padLeft(2, '0')}/${weekStart.month.toString().padLeft(2, '0')}';
      buckets[label] = 0;
      for (final entry in widget.pointsHistory) {
        final date = _parseDate(entry['created_at'] ?? entry['createdAt']);
        if (date == null) continue;
        final dateDay = DateTime(date.year, date.month, date.day);
        final startDay = DateTime(weekStart.year, weekStart.month, weekStart.day);
        final endDay = DateTime(weekEnd.year, weekEnd.month, weekEnd.day);
        if (!dateDay.isBefore(startDay) && !dateDay.isAfter(endDay)) {
          buckets[label] = (buckets[label] ?? 0) + _delta(entry);
        }
      }
    }
    return buckets;
  }

  Map<String, double> _aggregateByMonth() {
    final now = DateTime.now();
    final buckets = <String, double>{};
    for (var m = 1; m <= 12; m++) {
      final key = '${now.year}-${m.toString().padLeft(2, '0')}';
      buckets[key] = 0;
    }
    for (final entry in widget.pointsHistory) {
      final date = _parseDate(entry['created_at'] ?? entry['createdAt']);
      if (date == null) continue;
      final key = '${date.year}-${date.month.toString().padLeft(2, '0')}';
      if (buckets.containsKey(key)) {
        buckets[key] = (buckets[key] ?? 0) + _delta(entry);
      }
    }
    return buckets;
  }

  Map<String, double> _aggregateByYear() {
    final buckets = <String, double>{};
    for (final entry in widget.pointsHistory) {
      final date = _parseDate(entry['created_at'] ?? entry['createdAt']);
      if (date == null) continue;
      final key = '${date.year}';
      buckets[key] = (buckets[key] ?? 0) + _delta(entry);
    }
    if (buckets.isEmpty) return buckets;
    final sortedKeys = buckets.keys.toList()..sort();
    final firstYear = int.tryParse(sortedKeys.first) ?? DateTime.now().year;
    final currentYear = DateTime.now().year;
    final result = <String, double>{};
    for (var y = firstYear; y <= currentYear; y++) {
      result['$y'] = buckets['$y'] ?? 0;
    }
    return result;
  }

  @override
  void didUpdateWidget(covariant PointsBarCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.selectedPeriod != widget.selectedPeriod) {
      _selectedBarIndex = -1;
    }
  }

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);

    Map<String, double> aggregated;
    switch (widget.selectedPeriod) {
      case 'weekly':
        aggregated = _aggregateByWeek();
        break;
      case 'yearly':
        aggregated = _aggregateByYear();
        break;
      default:
        aggregated = _aggregateByMonth();
    }

    // Keep a single zero bucket so the chart renders a "0" baseline rather than
    // a blank / "no data" placeholder when there is no points history yet.
    if (aggregated.isEmpty) {
      aggregated = {'${DateTime.now().year}': 0};
    }

    final rawKeys = aggregated.keys.toList();
    final labels = rawKeys.map((k) {
      if (widget.selectedPeriod == 'monthly' && k.contains('-')) {
        final m = int.tryParse(k.split('-').last) ?? 0;
        return (m >= 1 && m <= 12) ? tr.tr(_monthKeys[m - 1]) : k;
      }
      return k;
    }).toList();

    final values = aggregated.values.toList();
    final maxVal = values.isEmpty
        ? 10.0
        : values.reduce((a, b) => a > b ? a : b);
    final chartMax = (maxVal * 1.3).ceilToDouble().clamp(1, 100000);

    final selectedLabel = _selectedBarIndex >= 0 && _selectedBarIndex < labels.length
        ? labels[_selectedBarIndex]
        : null;
    final selectedValue = _selectedBarIndex >= 0 && _selectedBarIndex < values.length
        ? values[_selectedBarIndex]
        : null;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                tr.tr('pointsTitle'),
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF2B3B48),
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F6FB),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: widget.selectedPeriod,
                    icon: const AppIcon(AppIcons.keyboardArrowDown),
                    items: widget.periodOptions
                        .map(
                          (period) => DropdownMenuItem<String>(
                            value: period,
                            child: Text(tr.tr(_periodTranslationKeys[period] ?? period)),
                          ),
                        )
                        .toList(),
                    onChanged: widget.onPeriodChanged,
                  ),
                ),
              ),
            ],
          ),
          if (selectedLabel != null && selectedValue != null) ...[
            const SizedBox(height: 8),
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFFF0F7FF),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFB8D8F0)),
              ),
              child: Row(
                children: [
                  const AppIcon(AppIcons.starPoints, size: 18, color: Color(0xFF00B8E0)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: RichText(
                      text: TextSpan(
                        style: const TextStyle(fontSize: 13, color: Color(0xFF2B3B48)),
                        children: [
                          TextSpan(
                            text: '$selectedLabel: ',
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                          TextSpan(
                            text: '${selectedValue.toInt()} ${tr.tr('pointsLabel')}',
                            style: const TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF00B8E0)),
                          ),
                        ],
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: () => setState(() => _selectedBarIndex = -1),
                    child: const AppIcon(AppIcons.close, size: 16, color: Color(0xFF8CA0B2)),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 12),
          SizedBox(
            height: 180,
            child: BarChart(
                    BarChartData(
                      maxY: chartMax.toDouble(),
                      alignment: BarChartAlignment.spaceAround,
                      gridData: FlGridData(
                        show: true,
                        drawVerticalLine: false,
                        horizontalInterval: (chartMax / 4).clamp(1, 10000),
                        getDrawingHorizontalLine: (_) =>
                            const FlLine(color: Color(0xFFE7EEF5), strokeWidth: 1),
                      ),
                      borderData: FlBorderData(show: false),
                      barTouchData: BarTouchData(
                        enabled: true,
                        touchTooltipData: BarTouchTooltipData(
                          getTooltipColor: (_) => Colors.transparent,
                          tooltipPadding: EdgeInsets.zero,
                          getTooltipItem: (_, _, _, _) => null,
                        ),
                        touchCallback: (event, response) {
                          if (event is FlTapUpEvent && response?.spot != null) {
                            final idx = response!.spot!.touchedBarGroupIndex;
                            setState(() {
                              _selectedBarIndex = _selectedBarIndex == idx ? -1 : idx;
                            });
                          }
                        },
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
                            getTitlesWidget: (value, meta) {
                              final index = value.toInt();
                              if (index < 0 || index >= labels.length) {
                                return const SizedBox.shrink();
                              }
                              return Padding(
                                padding: const EdgeInsets.only(top: 6),
                                child: Text(
                                  labels[index],
                                  style: TextStyle(
                                    color: index == _selectedBarIndex
                                        ? const Color(0xFF00B8E0)
                                        : const Color(0xFF7A8FA2),
                                    fontSize: widget.selectedPeriod == 'monthly' ? 10 : 12,
                                    fontWeight: index == _selectedBarIndex
                                        ? FontWeight.w800
                                        : FontWeight.w600,
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                      ),
                      barGroups: List.generate(values.length, (index) {
                        final isSelected = index == _selectedBarIndex;
                        return BarChartGroupData(
                          x: index,
                          barsSpace: 0,
                          barRods: [
                            BarChartRodData(
                              toY: values[index],
                              width: widget.selectedPeriod == 'monthly' ? 14 : 18,
                              borderRadius: BorderRadius.circular(8),
                              color: isSelected
                                  ? const Color(0xFF00B8E0)
                                  : const Color(0xFF7E9DB7),
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

class ActivityItem {
  const ActivityItem({
    required this.title,
    required this.timeAgo,
    required this.icon,
    this.onTap,
  });

  final String title;
  final String timeAgo;
  final String icon;
  final VoidCallback? onTap;
}

class RecentActivitySection extends StatelessWidget {
  const RecentActivitySection({super.key, required this.activities});

  final List<ActivityItem> activities;

  @override
  Widget build(BuildContext context) {
    if (activities.isEmpty) return const SizedBox.shrink();

    final tr = LanguageScope.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          tr.tr('recentActivity'),
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: Color(0xFF2A3A47),
          ),
        ),
        const SizedBox(height: 10),
        SizedBox(
          height: 118,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: activities.length,
            separatorBuilder: (_, _) => const SizedBox(width: 10),
            itemBuilder: (context, index) {
              final activity = activities[index];
              return GestureDetector(
                onTap: activity.onTap,
                child: Container(
                width: 176,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFD9E0E8),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 42,
                      height: 42,
                      decoration: const BoxDecoration(
                        color: Color(0xFFBCC8D4),
                        shape: BoxShape.circle,
                      ),
                      child: AppIcon(
                        activity.icon,
                        color: const Color(0xFF2B3945),
                      ),
                    ),
                    const Spacer(),
                    Text(
                      activity.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF263541),
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      activity.timeAgo,
                      style: const TextStyle(
                        color: Color(0xFF516271),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

class ApplicationsMetricsSection extends StatelessWidget {
  const ApplicationsMetricsSection({
    super.key,
    required this.approvalPercent,
    required this.totalApplications,
  });

  final int approvalPercent;
  final int totalApplications;

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          tr.tr('applications'),
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: Color(0xFF2A3A47),
          ),
        ),
        const SizedBox(height: 10),
        ApplicationMetricCard(
          title: tr.tr('approvalPercentage'),
          value: '$approvalPercent%',
          icon: AppIcons.checkCircle,
          accentColor: const Color(0xFF6FC391),
        ),
        const SizedBox(height: 8),
        ApplicationMetricCard(
          title: tr.tr('submittedApplications'),
          value: '$totalApplications',
          icon: AppIcons.paper,
          accentColor: const Color(0xFF93A8C8),
        ),
      ],
    );
  }
}

class ApplicationMetricCard extends StatelessWidget {
  const ApplicationMetricCard({
    super.key,
    required this.title,
    required this.value,
    required this.icon,
    required this.accentColor,
  });

  final String title;
  final String value;
  final String icon;
  final Color accentColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FBFE),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: accentColor.withValues(alpha: 0.2),
              shape: BoxShape.circle,
            ),
            child: AppIcon(icon, color: accentColor, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              title,
              style: const TextStyle(
                fontSize: 15,
                color: Color(0xFF324250),
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          Flexible(
            flex: 0,
            child: FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                value,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF22323F),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class LevelsRadarCard extends StatelessWidget {
  const LevelsRadarCard({super.key, this.lpProgress = const []});

  final List<Map<String, dynamic>> lpProgress;

  @override
  Widget build(BuildContext context) {
    final entries = lpProgress.where((lp) {
      final title = lp['path_title']?.toString() ?? '';
      return title.isNotEmpty;
    }).toList();

    final tr = LanguageScope.of(context);

    if (entries.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
        decoration: BoxDecoration(
          color: const Color(0xFFF7FBFF),
          borderRadius: BorderRadius.circular(18),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              tr.tr('learningPathProgress'),
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: Color(0xFF2B3B48),
              ),
            ),
            const SizedBox(height: 30),
            const Center(
              child: Text(
                '0',
                style: TextStyle(
                  color: Color(0xFF8CA0B2),
                  fontWeight: FontWeight.w800,
                  fontSize: 40,
                ),
              ),
            ),
            const SizedBox(height: 30),
          ],
        ),
      );
    }

    final radarEntries = entries.map((lp) {
      final percent = (lp['percent'] ?? lp['progress_percent'] ?? 0) as num;
      return RadarEntry(value: percent.toDouble());
    }).toList();

    final titles = entries.map((lp) {
      final title = lp['path_title']?.toString() ?? '';
      return title.length > 10 ? '${title.substring(0, 10)}...' : title;
    }).toList();

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
      decoration: BoxDecoration(
        color: const Color(0xFFF7FBFF),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            tr.tr('learningPathProgress'),
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: Color(0xFF2B3B48),
            ),
          ),
          const SizedBox(height: 14),
          SizedBox(
            height: 250,
            child: RadarChart(
              RadarChartData(
                radarShape: RadarShape.polygon,
                tickCount: 5,
                tickBorderData: const BorderSide(color: Color(0xFFD9E5F0)),
                gridBorderData: const BorderSide(color: Color(0xFFD9E5F0)),
                radarBorderData: const BorderSide(color: Color(0xFFD0DCE8)),
                titleTextStyle: const TextStyle(
                  color: Color(0xFF516273),
                  fontWeight: FontWeight.w700,
                  fontSize: 11,
                ),
                ticksTextStyle: const TextStyle(
                  color: Colors.transparent,
                  fontSize: 10,
                ),
                getTitle: (index, angle) {
                  if (index < 0 || index >= titles.length) {
                    return RadarChartTitle(text: '', angle: angle);
                  }
                  return RadarChartTitle(text: titles[index], angle: angle);
                },
                dataSets: [
                  RadarDataSet(
                    dataEntries: radarEntries,
                    fillColor: const Color(0x665B9ED2),
                    borderColor: const Color(0xFF4E8BBF),
                    borderWidth: 2.6,
                    entryRadius: 3.5,
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

class BadgesPerAreaCard extends StatelessWidget {
  const BadgesPerAreaCard({super.key, required this.areaCounts});

  final Map<String, int> areaCounts;

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);

    if (areaCounts.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
        decoration: BoxDecoration(
          color: const Color(0xFFF7FBFF),
          borderRadius: BorderRadius.circular(18),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              tr.tr('badgesPerArea'),
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: Color(0xFF2B3B48),
              ),
            ),
            const SizedBox(height: 30),
            const Center(
              child: Text(
                '0',
                style: TextStyle(
                  color: Color(0xFF8CA0B2),
                  fontWeight: FontWeight.w800,
                  fontSize: 40,
                ),
              ),
            ),
            const SizedBox(height: 30),
          ],
        ),
      );
    }

    final sorted = areaCounts.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    final maxVal = sorted.first.value;

    final barColors = AppColors.chartBarPalette;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 16),
      decoration: BoxDecoration(
        color: AppColors.chartBackground,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            tr.tr('badgesPerArea'),
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppColors.chartBarTitle,
            ),
          ),
          const SizedBox(height: 14),
          ...sorted.asMap().entries.map((entry) {
            final area = entry.value.key;
            final count = entry.value.value;
            final ratio = maxVal > 0 ? count / maxVal : 0.0;
            final color = barColors[entry.key % barColors.length];

            return Padding(
              padding: EdgeInsets.only(
                bottom: entry.key < sorted.length - 1 ? 10 : 0,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          area,
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF334453),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '$count',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF263746),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: LinearProgressIndicator(
                      value: ratio,
                      minHeight: 10,
                      backgroundColor: const Color(0xFFE2EAF2),
                      valueColor: AlwaysStoppedAnimation<Color>(color),
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}
