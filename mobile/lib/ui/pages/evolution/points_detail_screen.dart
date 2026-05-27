import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/sync_manager.dart';
import '../../../presentation/state/dashboard_store.dart';
import '../../widgets/shared/app_bottom_nav_bar.dart';
import '../../widgets/points/points_detail_widgets.dart';

class PointsDetailScreen extends StatelessWidget {
  const PointsDetailScreen({super.key, required this.totalPoints});

  final int totalPoints;

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    final dashStore = context.watch<DashboardStore>();

    final historyItems = dashStore.pointsHistory
        .map((entry) {
          final badge = entry['badge'];
          final badgeTitle = badge is Map
              ? (badge['badge_title'] ?? badge['title'] ?? '').toString()
              : (entry['justification'] ?? '').toString();
          final requirement = entry['requirement'];
          final reqTitle = requirement is Map
              ? (requirement['requirement_title'] ?? '').toString()
              : '';
          final delta = entry['points_delta'] is int
              ? entry['points_delta'] as int
              : int.tryParse(entry['points_delta']?.toString() ?? '') ?? 0;

          return PointsHistoryItem(
            title: badgeTitle.isNotEmpty ? badgeTitle : 'Badge',
            firstDescription: reqTitle,
            secondDescription: entry['justification']?.toString() ?? '',
            gainedPoints: delta,
          );
        })
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
        title: Text(
          tr.tr('pointsTitle'),
          style: const TextStyle(
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
            children: [
              const SizedBox(height: 12),
              PointsHighlight(totalPoints: totalPoints),
              const SizedBox(height: 24),
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
                  tr.tr('topPercentMessage').replaceAll('{percent}', '${dashStore.topPercent}'),
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 15,
                    height: 1.4,
                    color: Color(0xFF36414D),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  tr.tr('history'),
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF21262C),
                  ),
                ),
              ),
              const SizedBox(height: 10),
              if (historyItems.isEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 20),
                  child: Center(
                    child: Text(
                      tr.tr('noPointsHistory'),
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
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  tr.tr('statistics'),
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF21262C),
                  ),
                ),
              ),
              const SizedBox(height: 10),
              DailyEvolutionCard(timeline: dashStore.timeline),
              const SizedBox(height: 12),
              MonthlyEvolutionCard(timeline: dashStore.timeline),
            ],
          ),
        ),
      ),
      bottomNavigationBar: const AppBottomNavBar(currentTab: AppTab.home),
    );
  }
}
