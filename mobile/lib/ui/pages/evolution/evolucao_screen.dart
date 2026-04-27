import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../presentation/state/auth_store.dart';
import '../../widgets/shared/app_bottom_nav_bar.dart';

class EvolucaoScreen extends StatefulWidget {
  const EvolucaoScreen({super.key});

  @override
  State<EvolucaoScreen> createState() => _EvolucaoScreenState();
}

class _EvolucaoScreenState extends State<EvolucaoScreen> {
  static const List<String> _periodOptions = ['Semanal', 'Mensal', 'Anual'];

  String _selectedPeriod = _periodOptions.first;

  @override
  Widget build(BuildContext context) {
    final authStore = context.watch<AuthStore>();
    final user = authStore.currentUser;
    final displayName = user?.fullName.trim().isNotEmpty == true
        ? user!.fullName.trim()
        : (user?.username.trim().isNotEmpty == true
              ? user!.username.trim()
              : 'Consultor');

    return Scaffold(
      backgroundColor: const Color(0xFFE6EBF0),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Olá, $displayName!',
                style: const TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF1E2A35),
                ),
              ),
              const SizedBox(height: 16),
              const _MainBadgesCard(),
              const SizedBox(height: 14),
              GridView.count(
                crossAxisCount: 2,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                childAspectRatio: 1.38,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                children: const [
                  _MiniStatCard(
                    title: 'Badges obtidos',
                    value: '34',
                    icon: Icons.workspace_premium_rounded,
                    accentColor: Color(0xFF66B6E6),
                  ),
                  _MiniStatCard(
                    title: 'Conquistas ativas',
                    value: '12',
                    icon: Icons.emoji_events_outlined,
                    accentColor: Color(0xFF83A9E8),
                  ),
                  _MiniStatCard(
                    title: 'Níveis concluídos',
                    value: '8',
                    icon: Icons.auto_graph_rounded,
                    accentColor: Color(0xFF8BC4D9),
                  ),
                  _MiniStatCard(
                    title: 'Horas investidas',
                    value: '146',
                    icon: Icons.schedule_rounded,
                    accentColor: Color(0xFF96B8CF),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              _PointsBarCard(
                selectedPeriod: _selectedPeriod,
                periodOptions: _periodOptions,
                onPeriodChanged: (value) {
                  if (value == null) {
                    return;
                  }
                  setState(() {
                    _selectedPeriod = value;
                  });
                },
              ),
              const SizedBox(height: 14),
              const _RecentActivitySection(),
              const SizedBox(height: 14),
              const _ApplicationsMetricsSection(),
              const SizedBox(height: 14),
              const _LevelsRadarCard(),
            ],
          ),
        ),
      ),
      bottomNavigationBar: const AppBottomNavBar(currentTab: AppTab.progress),
    );
  }
}

class _MainBadgesCard extends StatelessWidget {
  const _MainBadgesCard();

  @override
  Widget build(BuildContext context) {
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
            children: const [
              Text(
                '34',
                style: TextStyle(
                  fontSize: 40,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF21303D),
                  height: 1,
                ),
              ),
              SizedBox(width: 12),
              Icon(
                Icons.trending_up_rounded,
                color: Color(0xFF2FB45A),
                size: 26,
              ),
              SizedBox(width: 4),
              Text(
                '32%',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF2FB45A),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          SizedBox(
            height: 190,
            child: LineChart(
              LineChartData(
                minX: 0,
                maxX: 6,
                minY: 0,
                maxY: 40,
                borderData: FlBorderData(show: false),
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  horizontalInterval: 10,
                  getDrawingHorizontalLine: (value) =>
                      const FlLine(color: Color(0xFFE2EAF2), strokeWidth: 1),
                ),
                extraLinesData: ExtraLinesData(
                  verticalLines: [
                    VerticalLine(
                      x: 4,
                      color: Color(0xFF83A7C6),
                      strokeWidth: 1.6,
                      dashArray: [7, 4],
                    ),
                  ],
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
                        const labels = [
                          'Mar',
                          'Abr',
                          'Mai',
                          'Jun',
                          'Jul',
                          'Ago',
                          'Set',
                        ];
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
                    spots: const [
                      FlSpot(0, 8),
                      FlSpot(1, 16),
                      FlSpot(2, 14),
                      FlSpot(3, 24),
                      FlSpot(4, 22),
                      FlSpot(5, 31),
                      FlSpot(6, 34),
                    ],
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
                        colors: [Color(0x664E91C3), Color(0x114E91C3)],
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

class _MiniStatCard extends StatelessWidget {
  const _MiniStatCard({
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
              Text(
                value,
                style: const TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF263746),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _PointsBarCard extends StatelessWidget {
  const _PointsBarCard({
    required this.selectedPeriod,
    required this.periodOptions,
    required this.onPeriodChanged,
  });

  final String selectedPeriod;
  final List<String> periodOptions;
  final ValueChanged<String?> onPeriodChanged;

  @override
  Widget build(BuildContext context) {
    const values = [5.0, 7.0, 9.5, 10.0, 8.2, 6.3, 4.2];

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
            child: BarChart(
              BarChartData(
                maxY: 12,
                alignment: BarChartAlignment.spaceAround,
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  horizontalInterval: 3,
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
                        const days = [
                          'Dom',
                          'Seg',
                          'Ter',
                          'Qua',
                          'Qui',
                          'Sex',
                          'Sab',
                        ];
                        final index = value.toInt();
                        if (index < 0 || index >= days.length) {
                          return const SizedBox.shrink();
                        }
                        return Padding(
                          padding: const EdgeInsets.only(top: 6),
                          child: Text(
                            days[index],
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
                  final value = values[index];
                  final isHighlighted = index == 3;

                  return BarChartGroupData(
                    x: index,
                    barsSpace: 0,
                    barRods: [
                      BarChartRodData(
                        toY: value,
                        width: 18,
                        borderRadius: BorderRadius.circular(8),
                        color: isHighlighted
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

class _RecentActivitySection extends StatelessWidget {
  const _RecentActivitySection();

  @override
  Widget build(BuildContext context) {
    const activities = [
      ('Master of APIs', 'Há 3 horas', Icons.military_tech_rounded),
      ('Cloud Defender', 'Há 1 dia', Icons.workspace_premium_rounded),
      ('Agile Champion', 'Há 2 dias', Icons.emoji_events_rounded),
      ('Data Strategist', 'Há 4 dias', Icons.stars_rounded),
    ];

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
                      child: Icon(activity.$3, color: const Color(0xFF2B3945)),
                    ),
                    const Spacer(),
                    Text(
                      activity.$1,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF263541),
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      activity.$2,
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

class _ApplicationsMetricsSection extends StatelessWidget {
  const _ApplicationsMetricsSection();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: const [
        Text(
          'Candidaturas',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: Color(0xFF2A3A47),
          ),
        ),
        SizedBox(height: 10),
        _ApplicationMetricCard(
          title: 'Tempo médio validação',
          value: '2,4 dias',
          icon: Icons.av_timer_rounded,
          accentColor: Color(0xFF6AA9D4),
        ),
        SizedBox(height: 8),
        _ApplicationMetricCard(
          title: 'Percentagem aprovação',
          value: '87%',
          icon: Icons.check_circle_outline_rounded,
          accentColor: Color(0xFF6FC391),
        ),
        SizedBox(height: 8),
        _ApplicationMetricCard(
          title: 'Candidaturas efetuadas',
          value: '41',
          icon: Icons.description_outlined,
          accentColor: Color(0xFF93A8C8),
        ),
      ],
    );
  }
}

class _ApplicationMetricCard extends StatelessWidget {
  const _ApplicationMetricCard({
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
          Text(
            value,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w800,
              color: Color(0xFF22323F),
            ),
          ),
        ],
      ),
    );
  }
}

class _LevelsRadarCard extends StatelessWidget {
  const _LevelsRadarCard();

  @override
  Widget build(BuildContext context) {
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
            'Badges por níveis',
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
                ),
                ticksTextStyle: const TextStyle(
                  color: Colors.transparent,
                  fontSize: 10,
                ),
                getTitle: (index, angle) {
                  const titles = ['A', 'B', 'C', 'D', 'E'];
                  return RadarChartTitle(text: titles[index], angle: angle);
                },
                dataSets: [
                  RadarDataSet(
                    dataEntries: const [
                      RadarEntry(value: 4.1),
                      RadarEntry(value: 3.4),
                      RadarEntry(value: 4.7),
                      RadarEntry(value: 2.8),
                      RadarEntry(value: 3.9),
                    ],
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
