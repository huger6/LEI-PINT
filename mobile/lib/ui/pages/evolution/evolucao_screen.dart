import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../presentation/state/auth_store.dart';
import '../../../presentation/state/badge_store.dart';
import '../../../presentation/state/dashboard_store.dart';
import '../../../presentation/state/language_controller.dart';
import '../../../core/routes/app_router.dart';
import '../../widgets/shared/app_bottom_nav_bar.dart';
import '../../widgets/evolution/evolution_widgets.dart';
import '../applications/application_detail_screen.dart';
import 'points_detail_screen.dart';
import '../../widgets/shared/app_icon/app_icon.dart';
import '../../widgets/shared/app_icon/app_icon_data.dart';

class EvolucaoScreen extends StatefulWidget {
  const EvolucaoScreen({super.key});

  @override
  State<EvolucaoScreen> createState() => _EvolucaoScreenState();
}

class _EvolucaoScreenState extends State<EvolucaoScreen> {
  static const List<String> _periodOptions = ['weekly', 'monthly', 'yearly'];

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
    final tr = LanguageScope.of(context);
    final authStore = context.watch<AuthStore>();
    final badgeStore = context.watch<BadgeStore>();
    final dashStore = context.watch<DashboardStore>();

    final user = authStore.currentUser;
    final displayName = user?.fullName.trim().isNotEmpty == true
        ? user!.fullName.trim()
        : (user?.username.trim().isNotEmpty == true
              ? user!.username.trim()
              : tr.tr('consultantFallback'));

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

    final yearlyBadges = <int, int>{};
    for (final eb in earnedBadges) {
      final year = eb.award.awardedAt.year;
      yearlyBadges[year] = (yearlyBadges[year] ?? 0) + 1;
    }

    final areaCounts = <String, int>{};
    for (final eb in earnedBadges) {
      final area = eb.badge.category.trim();
      if (area.isNotEmpty) {
        areaCounts[area] = (areaCounts[area] ?? 0) + 1;
      }
    }

    final recentActivities = dashStore.recentSubmissions
        .map(
          (s) => ActivityItem(
            title: s.badge.title,
            timeAgo: tr.tr('timeAgoValue').replaceAll('{time}', s.timestamp),
            icon: AppIcons.badgePremium,
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) =>
                      ApplicationDetailScreen(application: s.application),
                ),
              );
            },
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
                // Translate a clean word and append the name outside the
                // translated string (same pattern as the dashboard greeting),
                // so the placeholder is never mangled by the translator.
                '${tr.tr('evolutionHello')}, $displayName!',
                style: const TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF1E2A35),
                ),
              ),
              const SizedBox(height: 14),
              GestureDetector(
                onTap: () => context.push(AppRouter.evolutionTimeline),
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x12000000),
                        blurRadius: 8,
                        offset: Offset(0, 3),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: const Color(0xFF66B6E6).withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: AppIcon(
                          AppIcons.evolution,
                          size: 20,
                          color: const Color(0xFF3B8DBD),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          tr.tr('timelineTitle'),
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF1E2A35),
                          ),
                        ),
                      ),
                      AppIcon(
                        AppIcons.chevronForward,
                        size: 22,
                        color: const Color(0xFF8A95A0),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 14),
              MainBadgesCard(
                badgeCount: badgeCount,
                growthPercent: dashStore.growthPercent,
                timeline: dashStore.timeline,
                yearlyBadges: yearlyBadges,
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
                    title: tr.tr('badgesObtained'),
                    value: '$badgeCount',
                    icon: AppIcons.badgePremium,
                    accentColor: const Color(0xFF66B6E6),
                    onTap: () => context.go(AppRouter.myBadges),
                  ),
                  MiniStatCard(
                    title: tr.tr('activeAchievements'),
                    value: '$activeBadges',
                    icon: AppIcons.trophy,
                    accentColor: const Color(0xFF83A9E8),
                  ),
                  MiniStatCard(
                    title: tr.tr('levelsCompleted'),
                    value: '$uniqueLevels',
                    icon: AppIcons.evolution,
                    accentColor: const Color(0xFF8BC4D9),
                  ),
                  MiniStatCard(
                    title: tr.tr('totalPoints'),
                    value: '${dashStore.totalPoints > 0 ? dashStore.totalPoints : (user?.totalPoints ?? 0)}',
                    icon: AppIcons.starPoints,
                    accentColor: const Color(0xFF96B8CF),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => PointsDetailScreen(
                            totalPoints: dashStore.totalPoints > 0
                                ? dashStore.totalPoints
                                : (user?.totalPoints ?? 0),
                          ),
                        ),
                      );
                    },
                  ),
                ],
              ),
              const SizedBox(height: 14),
              GestureDetector(
                onTap: () => context.push(AppRouter.store),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF5D9FD1), Color(0xFF83A9E8)],
                    ),
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x20000000),
                        blurRadius: 8,
                        offset: Offset(0, 3),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.25),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.card_giftcard_rounded,
                            size: 22, color: Colors.white),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              tr.tr('storeRewardsStore'),
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                                color: Colors.white,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              tr.tr('storeSpendPoints'),
                              style: TextStyle(
                                fontSize: 13,
                                color: Colors.white.withValues(alpha: 0.85),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Icon(Icons.chevron_right_rounded,
                          color: Colors.white, size: 24),
                    ],
                  ),
                ),
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
              BadgesPerAreaCard(areaCounts: areaCounts),
            ],
          ),
        ),
      ),
      bottomNavigationBar: const AppBottomNavBar(currentTab: AppTab.progress),
    );
  }
}
