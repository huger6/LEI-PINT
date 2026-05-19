import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../presentation/state/dashboard_store.dart';
import '../../widgets/shared/app_bottom_nav_bar.dart';
import '../../widgets/points/points_detail_widgets.dart';

class PointsDetailScreen extends StatelessWidget {
  const PointsDetailScreen({super.key, required this.totalPoints});

  final int totalPoints;

  @override
  Widget build(BuildContext context) {
    final dashStore = context.watch<DashboardStore>();

    final historyItems = dashStore.recentSubmissions
        .map(
          (s) => PointsHistoryItem(
            title: s.badge.title,
            firstDescription: s.badge.category,
            secondDescription: s.status,
            gainedPoints: s.badge.points,
          ),
        )
        .toList(growable: false);

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
              PointsHighlight(totalPoints: totalPoints),
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
              if (historyItems.isEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 20),
                  child: Center(
                    child: Text(
                      'Sem histórico de pontos.',
                      style: TextStyle(
                        fontSize: 15,
                        color: Colors.grey[600],
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                )
              else
                ...historyItems.map(
                  (item) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: HistoryCard(item: item),
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
              DailyEvolutionCard(timeline: dashStore.timeline),
              const SizedBox(height: 12),
              MonthlyEvolutionCard(timeline: dashStore.timeline),
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
                  'Está no top ${dashStore.topPercent}% dos nossos consultores!',
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
