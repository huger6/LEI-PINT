import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../injection_container.dart';
import '../widgets/shared/app_bottom_nav_bar.dart';
import '../widgets/dashboard/certification_donut_card.dart';
import '../widgets/badges/recommended_badge_card.dart';
import '../widgets/dashboard/simple_line_stats_card.dart';
import '../widgets/applications/submission_card.dart';
import '../widgets/dashboard/dashboard_widgets.dart';
import '../widgets/celebrations/celebration_overlay.dart';
import 'applications/application_detail_screen.dart';
import 'badges/badges_page.dart';
import 'goals/goals_screen.dart';
import 'notifications/notifications_screen.dart';
import 'evolution/points_detail_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen>
    with WidgetsBindingObserver {
  bool _celebrationChecked = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final authStore = context.read<AuthStore>();
      context.read<DashboardStore>().loadDashboard(authStore.currentUser);
      context.read<BadgeStore>().loadEarnedBadges();
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      final authStore = context.read<AuthStore>();
      context.read<DashboardStore>().loadDashboard(authStore.currentUser);
    }
  }

  String _timeGreeting(String Function(String) tr) {
    final hour = DateTime.now().hour;
    if (hour >= 6 && hour < 12) return tr('goodMorning');
    if (hour >= 12 && hour < 20) return tr('goodAfternoon');
    return tr('goodEvening');
  }

  String _motivationMessage(String Function(String) tr, int topPercent) {
    if (topPercent <= 0) return tr('motivationNotRanked');
    if (topPercent <= 10) return tr('motivationTop10');
    if (topPercent <= 25) return tr('motivationTop25');
    if (topPercent <= 50) return tr('motivationTop50');
    if (topPercent <= 75) return tr('motivationTop75');
    return tr('motivationBottom');
  }

  void _maybeCelebrate(BuildContext context, BadgeStore badgeStore) {
    if (_celebrationChecked) return;
    final milestone = badgeStore.pendingCelebration;
    if (milestone == null) return;
    _celebrationChecked = true;

    final tr = LanguageScope.of(context);
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await showCelebrationOverlay(
        context,
        milestone: milestone,
        title: tr.tr(milestone.titleKey),
        description: tr.tr(milestone.descriptionKey),
        badgeCount: milestone.badgeCount,
      );
      if (context.mounted) {
        badgeStore.consumeCelebration();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    final authStore = context.watch<AuthStore>();
    final dashStore = context.watch<DashboardStore>();
    final notifStore = context.watch<NotificationStore>();
    final badgeStore = context.watch<BadgeStore>();

    if (!badgeStore.isLoadingEarned) {
      _maybeCelebrate(context, badgeStore);
    }

    const pageBackground = Color(0xFFE2E6EB);

    final userName = authStore.currentUser?.fullName.trim().isNotEmpty == true
        ? authStore.currentUser!.fullName.trim()
        : (authStore.currentUser?.username.trim().isNotEmpty == true
              ? authStore.currentUser!.username.trim()
              : tr.tr('consultantFallback'));

    final totalPoints = dashStore.totalPoints > 0
        ? dashStore.totalPoints
        : (authStore.currentUser?.totalPoints ?? 0);

    final greeting = '${_timeGreeting(tr.tr)}, $userName!';

    final segmentColors = AppColors.chartDonutPalette;

    final donutSegments = dashStore.areaMetrics
        .asMap()
        .entries
        .map(
          (entry) => DonutSegmentData(
            label: entry.value.label,
            value: entry.value.count,
            color: segmentColors[entry.key % segmentColors.length],
          ),
        )
        .toList(growable: false);

    return Scaffold(
      backgroundColor: const Color(0xFFE0DBED),
      body: SafeArea(
        child: Container(
          margin: const EdgeInsets.all(12),
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          decoration: BoxDecoration(
            color: pageBackground,
            borderRadius: BorderRadius.circular(28),
          ),
          child: dashStore.isLoading && dashStore.recentSubmissions.isEmpty
              ? const Center(child: CircularProgressIndicator())
              : SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      DashboardTopBar(
                        totalPoints: totalPoints,
                        hasUnread: notifStore.unreadCount > 0,
                        onGoalsTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const GoalsScreen(),
                            ),
                          );
                        },
                        onPointsTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) =>
                                  PointsDetailScreen(totalPoints: totalPoints),
                            ),
                          );
                        },
                        onNotificationsTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const NotificationsScreen(
                                sourceTab: AppTab.home,
                              ),
                            ),
                          );
                        },
                      ),
                      const SizedBox(height: 20),

                      // Greeting
                      Text(
                        greeting,
                        style: const TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF20252B),
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),

                      // Recent submissions
                      if (dashStore.recentSubmissions.isNotEmpty) ...[
                        const SizedBox(height: 16),
                        Text(
                          tr.tr('recentSubmissions'),
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF20252B),
                          ),
                        ),
                        const SizedBox(height: 10),
                        ...dashStore.recentSubmissions.map((submission) {
                          return SubmissionCard(
                            title: submission.badge.title,
                            status: tr.tr(submission.status),
                            statusColor: submission.statusColor,
                            timestamp: submission.timestamp,
                            medalColor: submission.badge.medalColor,
                            ribbonColor: submission.badge.ribbonColor,
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => ApplicationDetailScreen(
                                    application: submission.application,
                                  ),
                                ),
                              );
                            },
                          );
                        }),
                      ],

                      // Recommended badges carousel
                      if (dashStore.recommendedBadges.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        Text(
                          tr.tr('forYou'),
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF20252B),
                          ),
                        ),
                        const SizedBox(height: 10),
                        SizedBox(
                          height: 200,
                          child: ListView.builder(
                            scrollDirection: Axis.horizontal,
                            itemCount: dashStore.recommendedBadges.length,
                            itemBuilder: (context, index) {
                              final badge =
                                  dashStore.recommendedBadges[index];
                              return RecommendedBadgeCard(
                                title: badge.title,
                                area: badge.category,
                                medalColor: badge.medalColor,
                                ribbonColor: badge.ribbonColor,
                                onTap: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) =>
                                          BadgeDetailScreen(badge: badge),
                                    ),
                                  );
                                },
                              );
                            },
                          ),
                        ),
                      ],

                      // Keep going / top percent
                      const SizedBox(height: 16),
                      Text(
                        _motivationMessage(tr.tr, dashStore.topPercent),
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF20252B),
                        ),
                      ),
                      const SizedBox(height: 6),
                      RichText(
                        text: TextSpan(
                          style: const TextStyle(
                            fontSize: 15,
                            color: Color(0xFF30353C),
                            height: 1.4,
                          ),
                          children: [
                            TextSpan(
                              text: tr.tr('dashboardTopPercentPrefix'),
                            ),
                            TextSpan(
                              text: '${dashStore.topPercent}%',
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            TextSpan(
                              text: tr.tr('dashboardTopPercentMiddle'),
                            ),
                            TextSpan(
                              text: tr.tr('dashboardTopPercentHighlight'),
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            TextSpan(
                              text: tr.tr('dashboardTopPercentSuffix'),
                            ),
                          ],
                        ),
                      ),

                      // Stats line chart
                      SimpleLineStatsCard(
                        completedBadges: dashStore.completedBadges,
                        growthPercent: dashStore.growthPercent,
                        monthlyBadgeCounts: dashStore.monthlyBadgeCounts,
                      ),

                      // Donut chart
                      if (donutSegments.isNotEmpty)
                        CertificationDonutCard(
                          totalAreas: donutSegments.length,
                          segments: donutSegments,
                        ),
                    ],
                  ),
                ),
        ),
      ),
      bottomNavigationBar: const AppBottomNavBar(currentTab: AppTab.home),
    );
  }
}
