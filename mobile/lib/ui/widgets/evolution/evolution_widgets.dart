import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

class MainBadgesCard extends StatelessWidget {
  const MainBadgesCard({
    super.key,
    required this.badgeCount,
    required this.growthPercent,
    this.timeline = const [],
  });

  final int badgeCount;
  final int growthPercent;
  final List<Map<String, dynamic>> timeline;

  List<FlSpot> _buildSpots() {
    if (timeline.isEmpty) return const [];
    final recent = timeline.length > 7
        ? timeline.sublist(timeline.length - 7)
        : timeline;
    return List.generate(recent.length, (i) {
      final val = (recent[i]['cumulative_badges'] ??
              recent[i]['cumulative_certifications'] ??
              0) as num;
      return FlSpot(i.toDouble(), val.toDouble());
    });
  }

  List<String> _buildLabels() {
    const monthNames = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
    ];
    if (timeline.isEmpty) return const [];
    final recent = timeline.length > 7
        ? timeline.sublist(timeline.length - 7)
        : timeline;
    return recent.map((row) {
      final m = row['month'];
      if (m is int && m >= 1 && m <= 12) return monthNames[m - 1];
      return m?.toString() ?? '';
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final isPositive = growthPercent >= 0;
    final spots = _buildSpots();
    final labels = _buildLabels();
    final maxY = spots.isEmpty
        ? 40.0
        : (spots.map((s) => s.y).reduce((a, b) => a > b ? a : b) * 1.3)
            .ceilToDouble();

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
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
          const Text(
            'Badges adquiridos',
            style: TextStyle(
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
                Icon(
                  isPositive
                      ? Icons.trending_up_rounded
                      : Icons.trending_down_rounded,
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
            child: spots.isEmpty
                ? const Center(
                    child: Text(
                      'Sem dados de evolução.',
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
                            reservedSize: 24,
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
  });

  final String title;
  final String value;
  final IconData icon;
  final Color accentColor;

  @override
  Widget build(BuildContext context) {
    return Container(
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
                    child: Icon(icon, color: accentColor, size: 22),
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
    );
  }
}

class PointsBarCard extends StatelessWidget {
  const PointsBarCard({
    super.key,
    required this.selectedPeriod,
    required this.periodOptions,
    required this.onPeriodChanged,
    this.pointsHistory = const [],
  });

  static const _monthNames = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
  ];

  final String selectedPeriod;
  final List<String> periodOptions;
  final ValueChanged<String?> onPeriodChanged;
  final List<Map<String, dynamic>> pointsHistory;

  Map<String, double> _aggregateByMonth() {
    final buckets = <String, double>{};
    for (final entry in pointsHistory) {
      final raw = entry['created_at'] ?? entry['createdAt'];
      DateTime? date;
      if (raw is String) date = DateTime.tryParse(raw);
      if (date == null) continue;
      final key = '${date.year}-${date.month.toString().padLeft(2, '0')}';
      final delta = ((entry['points_delta'] ?? entry['pointsDelta'] ?? 0) as num).toDouble();
      buckets[key] = (buckets[key] ?? 0) + delta;
    }
    final keys = buckets.keys.toList()..sort();
    final recent = keys.length > 6 ? keys.sublist(keys.length - 6) : keys;
    return {for (final k in recent) k: buckets[k]!};
  }

  Map<String, double> _aggregateByWeek() {
    final now = DateTime.now();
    final weekStart = now.subtract(Duration(days: now.weekday % 7));
    final labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    final buckets = {for (final l in labels) l: 0.0};
    for (final entry in pointsHistory) {
      final raw = entry['created_at'] ?? entry['createdAt'];
      DateTime? date;
      if (raw is String) date = DateTime.tryParse(raw);
      if (date == null) continue;
      if (date.isBefore(weekStart)) continue;
      final dayIdx = date.weekday % 7;
      buckets[labels[dayIdx]] = (buckets[labels[dayIdx]] ?? 0) +
          ((entry['points_delta'] ?? entry['pointsDelta'] ?? 0) as num).toDouble();
    }
    return buckets;
  }

  Map<String, double> _aggregateByYear() {
    final buckets = <String, double>{};
    for (final entry in pointsHistory) {
      final raw = entry['created_at'] ?? entry['createdAt'];
      DateTime? date;
      if (raw is String) date = DateTime.tryParse(raw);
      if (date == null) continue;
      final key = '${date.year}';
      final delta = ((entry['points_delta'] ?? entry['pointsDelta'] ?? 0) as num).toDouble();
      buckets[key] = (buckets[key] ?? 0) + delta;
    }
    final keys = buckets.keys.toList()..sort();
    final recent = keys.length > 5 ? keys.sublist(keys.length - 5) : keys;
    return {for (final k in recent) k: buckets[k]!};
  }

  @override
  Widget build(BuildContext context) {
    Map<String, double> aggregated;
    switch (selectedPeriod) {
      case 'Semanal':
        aggregated = _aggregateByWeek();
        break;
      case 'Anual':
        aggregated = _aggregateByYear();
        break;
      default:
        aggregated = _aggregateByMonth();
    }

    final labels = aggregated.keys.map((k) {
      if (selectedPeriod == 'Mensal' && k.contains('-')) {
        final m = int.tryParse(k.split('-').last) ?? 0;
        return (m >= 1 && m <= 12) ? _monthNames[m - 1] : k;
      }
      return k;
    }).toList();

    final values = aggregated.values.toList();
    final maxVal = values.isEmpty
        ? 10.0
        : values.reduce((a, b) => a > b ? a : b);
    final chartMax = (maxVal * 1.3).ceilToDouble().clamp(1, 100000);

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
              const Text(
                'Pontos',
                style: TextStyle(
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
                    value: selectedPeriod,
                    icon: const Icon(Icons.keyboard_arrow_down_rounded),
                    items: periodOptions
                        .map(
                          (period) => DropdownMenuItem<String>(
                            value: period,
                            child: Text(period),
                          ),
                        )
                        .toList(),
                    onChanged: onPeriodChanged,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 180,
            child: values.every((v) => v == 0)
                ? const Center(
                    child: Text(
                      'Sem dados disponíveis.',
                      style: TextStyle(
                        color: Color(0xFF8CA0B2),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  )
                : BarChart(
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
                                    color: Color(0xFF7A8FA2),
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                      ),
                      barGroups: List.generate(values.length, (index) {
                        final highIdx = values.indexOf(
                          values.reduce((a, b) => a > b ? a : b),
                        );
                        return BarChartGroupData(
                          x: index,
                          barsSpace: 0,
                          barRods: [
                            BarChartRodData(
                              toY: values[index],
                              width: 18,
                              borderRadius: BorderRadius.circular(8),
                              color: index == highIdx
                                  ? const Color(0xFF85D2FF)
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
  });

  final String title;
  final String timeAgo;
  final IconData icon;
}

class RecentActivitySection extends StatelessWidget {
  const RecentActivitySection({super.key, required this.activities});

  final List<ActivityItem> activities;

  @override
  Widget build(BuildContext context) {
    if (activities.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Atividade recente',
          style: TextStyle(
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
              return Container(
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
                      child: Icon(
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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Candidaturas',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: Color(0xFF2A3A47),
          ),
        ),
        const SizedBox(height: 10),
        ApplicationMetricCard(
          title: 'Percentagem aprova\u00e7\u00e3o',
          value: '$approvalPercent%',
          icon: Icons.check_circle_outline_rounded,
          accentColor: const Color(0xFF6FC391),
        ),
        const SizedBox(height: 8),
        ApplicationMetricCard(
          title: 'Candidaturas efetuadas',
          value: '$totalApplications',
          icon: Icons.description_outlined,
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
  final IconData icon;
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
            child: Icon(icon, color: accentColor, size: 22),
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

    if (entries.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
        decoration: BoxDecoration(
          color: const Color(0xFFF7FBFF),
          borderRadius: BorderRadius.circular(18),
        ),
        child: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Progresso por Learning Path',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: Color(0xFF2B3B48),
              ),
            ),
            SizedBox(height: 30),
            Center(
              child: Text(
                'Sem dados dispon\u00edveis.',
                style: TextStyle(
                  color: Color(0xFF8CA0B2),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            SizedBox(height: 30),
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
          const Text(
            'Progresso por Learning Path',
            style: TextStyle(
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
