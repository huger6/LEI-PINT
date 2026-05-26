import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../presentation/state/auth_store.dart';
import '../../../presentation/state/badge_store.dart';
import '../../../presentation/state/dashboard_store.dart';
import '../../widgets/shared/app_bottom_nav_bar.dart';
import '../../widgets/evolution/evolution_widgets.dart';

class EvolucaoScreen extends StatefulWidget {
  const EvolucaoScreen({super.key});

  @override
  State<EvolucaoScreen> createState() => _EvolucaoScreenState();
}

class _EvolucaoScreenState extends State<EvolucaoScreen> {
  static const List<String> _periodOptions = ['Semanal', 'Mensal', 'Anual'];

  String _selectedPeriod = _periodOptions.first;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final authStore = context.read<AuthStore>();
      context.read<BadgeStore>().loadEarnedBadges(forceRefresh: true);
      context.read<DashboardStore>().loadDashboard(authStore.currentUser);
    });
  }

  @override
  Widget build(BuildContext context) {
    final authStore = context.watch<AuthStore>();
    final badgeStore = context.watch<BadgeStore>();
    final dashStore = context.watch<DashboardStore>();

    final user = authStore.currentUser;
    final displayName = user?.fullName.trim().isNotEmpty == true
        ? user!.fullName.trim()
        : (user?.username.trim().isNotEmpty == true
              ? user!.username.trim()
              : 'Consultor');

    final earnedBadges = badgeStore.earnedBadges;
    final badgeCount = earnedBadges.length;
    final activeBadges = earnedBadges
        .where((e) => !e.award.isExpired)
        .length;
    final uniqueLevels = earnedBadges
        .map((e) => e.badge.level)
        .where((l) => l.trim().isNotEmpty)
        .toSet()
        .length;

    final recentActivities = dashStore.recentSubmissions
        .map(
          (s) => ActivityItem(
            title: s.badge.title,
            timeAgo: 'Há ${s.timestamp}',
            icon: Icons.workspace_premium_rounded,
          ),
        )
        .toList(growable: false);

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
              MainBadgesCard(
                badgeCount: badgeCount,
                growthPercent: dashStore.growthPercent,
                timeline: dashStore.timeline,
              ),
              const SizedBox(height: 14),
              GridView.count(
                crossAxisCount: 2,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                childAspectRatio: 1.38,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                children: [
                  MiniStatCard(
                    title: 'Badges obtidos',
                    value: '$badgeCount',
                    icon: Icons.workspace_premium_rounded,
                    accentColor: const Color(0xFF66B6E6),
                  ),
                  MiniStatCard(
                    title: 'Conquistas ativas',
                    value: '$activeBadges',
                    icon: Icons.emoji_events_outlined,
                    accentColor: const Color(0xFF83A9E8),
                  ),
                  MiniStatCard(
                    title: 'Níveis concluídos',
                    value: '$uniqueLevels',
                    icon: Icons.auto_graph_rounded,
                    accentColor: const Color(0xFF8BC4D9),
                  ),
                  MiniStatCard(
                    title: 'Pontos totais',
                    value: '${dashStore.totalPoints > 0 ? dashStore.totalPoints : (user?.totalPoints ?? 0)}',
                    icon: Icons.stars_rounded,
                    accentColor: const Color(0xFF96B8CF),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              PointsBarCard(
                selectedPeriod: _selectedPeriod,
                periodOptions: _periodOptions,
                pointsHistory: dashStore.pointsHistory,
                onPeriodChanged: (value) {
                  if (value == null) return;
                  setState(() {
                    _selectedPeriod = value;
                  });
                },
              ),
              const SizedBox(height: 14),
              RecentActivitySection(activities: recentActivities),
              const SizedBox(height: 14),
              ApplicationsMetricsSection(
                approvalPercent: dashStore.growthPercent,
                totalApplications: dashStore.totalApplications,
              ),
              const SizedBox(height: 14),
              LevelsRadarCard(lpProgress: dashStore.lpProgress),
            ],
          ),
        ),
      ),
      bottomNavigationBar: const AppBottomNavBar(currentTab: AppTab.progress),
    );
  }
}
