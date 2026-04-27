import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../../widgets/shared/app_bottom_nav_bar.dart';

class PointsDetailScreen extends StatelessWidget {
  const PointsDetailScreen({super.key, required this.totalPoints});

  final int totalPoints;

  static const int _weeklyDelta = 23;

  static final List<_PointsHistoryItem> _historyItems = [
    const _PointsHistoryItem(
      title: 'Badge Master of API',
      firstDescription: 'Descr 1',
      secondDescription: 'Descr 2',
      gainedPoints: 13,
    ),
    const _PointsHistoryItem(
      title: 'Conclusão de candidatura',
      firstDescription: 'Descr 1',
      secondDescription: 'Descr 2',
      gainedPoints: 13,
    ),
    const _PointsHistoryItem(
      title: 'Validação de requisito',
      firstDescription: 'Descr 1',
      secondDescription: 'Descr 2',
      gainedPoints: 13,
    ),
    const _PointsHistoryItem(
      title: 'Atualização de perfil',
      firstDescription: 'Descr 1',
      secondDescription: 'Descr 2',
      gainedPoints: 13,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        backgroundColor: Colors.grey[100],
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          onPressed: () => Navigator.pop(context),
          icon: const Icon(
            Icons.arrow_back,
            color: Color(0xFF20252B),
            size: 26,
          ),
        ),
        title: const Text(
          'Pontos',
          style: TextStyle(
            color: Color(0xFF20252B),
            fontSize: 30,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _PointsHighlight(totalPoints: totalPoints),
              const SizedBox(height: 16),
              const Text(
                'Histórico',
                style: TextStyle(
                  fontSize: 34,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF21262C),
                ),
              ),
              const SizedBox(height: 10),
              ..._historyItems.map(
                (item) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: _HistoryCard(item: item),
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Estatísticas',
                style: TextStyle(
                  fontSize: 34,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF21262C),
                ),
              ),
              const SizedBox(height: 10),
              const _DailyEvolutionCard(),
              const SizedBox(height: 12),
              const _MonthlyEvolutionCard(),
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF1A2530).withValues(alpha: 0.08),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Text(
                  'Conquistou mais $_weeklyDelta pontos que na última semana. '
                  'Está à frente de 89% dos nossos consultores!',
                  style: const TextStyle(
                    fontSize: 14,
                    height: 1.4,
                    color: Color(0xFF36414D),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: const AppBottomNavBar(currentTab: AppTab.home),
    );
  }
}

class _PointsHighlight extends StatelessWidget {
  const _PointsHighlight({required this.totalPoints});

  final int totalPoints;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 70,
          height: 70,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF6DC1E3), Color(0xFF658CC9)],
            ),
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF1F3954).withValues(alpha: 0.23),
                blurRadius: 12,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: const Icon(
            Icons.star_border_rounded,
            color: Colors.white,
            size: 34,
          ),
        ),
        const SizedBox(width: 14),
        RichText(
          text: TextSpan(
            style: const TextStyle(fontFamily: 'Roboto'),
            children: [
              TextSpan(
                text: '$totalPoints',
                style: const TextStyle(
                  fontSize: 56,
                  color: Color(0xFF56A8D7),
                  fontWeight: FontWeight.w500,
                ),
              ),
              const TextSpan(
                text: ' pontos',
                style: TextStyle(
                  fontSize: 30,
                  color: Color(0xFF27333F),
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _HistoryCard extends StatelessWidget {
  const _HistoryCard({required this.item});

  final _PointsHistoryItem item;

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
                  '${item.firstDescription}  •  ${item.secondDescription}',
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

class _DailyEvolutionCard extends StatelessWidget {
  const _DailyEvolutionCard();

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
      child: SizedBox(height: 180, child: _DailyLineChart()),
    );
  }
}

class _DailyLineChart extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return LineChart(
      LineChartData(
        minX: 0,
        maxX: 5,
        minY: 0,
        maxY: 18,
        borderData: FlBorderData(show: false),
        gridData: FlGridData(
          show: true,
          drawVerticalLine: false,
          horizontalInterval: 3,
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
                const labels = ['Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
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
            spots: const [
              FlSpot(0, 4),
              FlSpot(1, 8),
              FlSpot(2, 6),
              FlSpot(3, 10),
              FlSpot(4, 9),
              FlSpot(5, 12),
            ],
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

class _MonthlyEvolutionCard extends StatelessWidget {
  const _MonthlyEvolutionCard();

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
        height: 185,
        child: BarChart(
          BarChartData(
            maxY: 28,
            borderData: FlBorderData(show: false),
            gridData: FlGridData(
              show: true,
              drawVerticalLine: false,
              horizontalInterval: 7,
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
                    const labels = ['SET', 'OUT', 'NOV', 'DEZ'];
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
            barGroups: [
              BarChartGroupData(
                x: 0,
                barRods: [
                  BarChartRodData(
                    toY: 14,
                    width: 22,
                    borderRadius: BorderRadius.vertical(
                      top: Radius.circular(8),
                    ),
                    color: Color(0xFF8ACCEC),
                  ),
                ],
              ),
              BarChartGroupData(
                x: 1,
                barRods: [
                  BarChartRodData(
                    toY: 18,
                    width: 22,
                    borderRadius: BorderRadius.vertical(
                      top: Radius.circular(8),
                    ),
                    color: Color(0xFF8ACCEC),
                  ),
                ],
              ),
              BarChartGroupData(
                x: 2,
                barRods: [
                  BarChartRodData(
                    toY: 22,
                    width: 22,
                    borderRadius: BorderRadius.vertical(
                      top: Radius.circular(8),
                    ),
                    color: Color(0xFF8ACCEC),
                  ),
                ],
              ),
              BarChartGroupData(
                x: 3,
                barRods: [
                  BarChartRodData(
                    toY: 25,
                    width: 22,
                    borderRadius: BorderRadius.vertical(
                      top: Radius.circular(8),
                    ),
                    color: Color(0xFF8ACCEC),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PointsHistoryItem {
  const _PointsHistoryItem({
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
