import 'package:flutter/material.dart';

import '../../core/sync_manager.dart';
import '../widgets/shared/app_bottom_nav_bar.dart';
import '../widgets/dashboard/certification_donut_card.dart';
import '../widgets/badges/badge_catalog.dart';
import '../widgets/badges/recommended_badge_card.dart';
import '../widgets/dashboard/simple_line_stats_card.dart';
import '../widgets/applications/submission_card.dart';
import '../widgets/dashboard/dashboard_widgets.dart';
import 'badges/badges_page.dart';
import 'notifications/notifications_screen.dart';
import 'evolution/points_detail_screen.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    const pageBackground = Color(0xFFE2E6EB);
    const totalPoints = 1259;

    final submissions = <DashboardSubmissionData>[
      DashboardSubmissionData(
        title: 'Master of sprints',
        status: tr.tr('submissionStatusInReview'),
        statusColor: const Color(0xFFC7A11D),
        timestamp: '3h',
        medalColor: const Color(0xFFD2D5DA),
        ribbonColor: const Color(0xFFAF5353),
      ),
      DashboardSubmissionData(
        title: 'Master of DevOps',
        status: tr.tr('submissionStatusRejected'),
        statusColor: const Color(0xFFD63D2B),
        timestamp: '5d',
        medalColor: const Color(0xFFDFC24C),
        ribbonColor: const Color(0xFFAF5353),
      ),
      DashboardSubmissionData(
        title: 'IBM Front-End Dev',
        status: tr.tr('submissionStatusApproved'),
        statusColor: const Color(0xFF56C640),
        timestamp: '8d',
        medalColor: const Color(0xFFC4C6D6),
        ribbonColor: const Color(0xFF5B84D6),
      ),
    ];

    final recommendedBadges = BadgeCatalog.recommended();
    final catalogBadges = BadgeCatalog.all;

    final donutSegments = [
      DonutSegmentData(
        label: tr.tr('dashboardAreaLowCode'),
        value: 2,
        color: const Color(0xFF5C4FE0),
      ),
      DonutSegmentData(
        label: tr.tr('dashboardAreaDevSecOps'),
        value: 5,
        color: const Color(0xFFC3B1E6),
      ),
      DonutSegmentData(
        label: tr.tr('dashboardAreaUxUi'),
        value: 5,
        color: const Color(0xFF7B4DE4),
      ),
      DonutSegmentData(
        label: tr.tr('dashboardAreaAutomation'),
        value: 8,
        color: const Color(0xFFB9C4E9),
      ),
    ];

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
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                DashboardTopBar(
                  totalPoints: totalPoints,
                  onPointsTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) =>
                            const PointsDetailScreen(totalPoints: totalPoints),
                      ),
                    );
                  },
                  onNotificationsTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) =>
                            const NotificationsScreen(sourceTab: AppTab.home),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 20),
                Text(
                  tr
                      .tr('dashboardGreeting')
                      .replaceAll('{name}', 'José Almeida'),
                  style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF20252B),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  tr.tr('recentSubmissions'),
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF20252B),
                  ),
                ),
                const SizedBox(height: 14),
                ...submissions.map((submission) {
                  final index = submissions.indexOf(submission);
                  final detailBadge =
                      catalogBadges[index % catalogBadges.length];

                  return SubmissionCard(
                    title: submission.title,
                    status: submission.status,
                    statusColor: submission.statusColor,
                    timestamp: submission.timestamp,
                    medalColor: submission.medalColor,
                    ribbonColor: submission.ribbonColor,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => BadgeDetailScreen(badge: detailBadge),
                        ),
                      );
                    },
                  );
                }),
                const SizedBox(height: 8),
                Text(
                  tr.tr('forYou'),
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF20252B),
                  ),
                ),
                const SizedBox(height: 10),
                SizedBox(
                  height: 240,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: recommendedBadges.length,
                    itemBuilder: (context, index) {
                      final badge = recommendedBadges[index];
                      return RecommendedBadgeCard(
                        title: badge.title,
                        area: badge.category,
                        medalColor: badge.medalColor,
                        ribbonColor: badge.ribbonColor,
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => BadgeDetailScreen(badge: badge),
                            ),
                          );
                        },
                      );
                    },
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  tr.tr('keepGoing'),
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF20252B),
                  ),
                ),
                const SizedBox(height: 6),
                RichText(
                  text: TextSpan(
                    style: const TextStyle(
                      fontSize: 17,
                      color: Color(0xFF30353C),
                      height: 1.4,
                    ),
                    children: [
                      TextSpan(text: tr.tr('dashboardTopPercentPrefix')),
                      const TextSpan(
                        text: '5%',
                        style: TextStyle(fontWeight: FontWeight.w800),
                      ),
                      TextSpan(text: tr.tr('dashboardTopPercentMiddle')),
                      TextSpan(
                        text: tr.tr('dashboardTopPercentHighlight'),
                        style: const TextStyle(fontWeight: FontWeight.w800),
                      ),
                      TextSpan(text: tr.tr('dashboardTopPercentSuffix')),
                    ],
                  ),
                ),
                const SimpleLineStatsCard(),
                CertificationDonutCard(totalAreas: 4, segments: donutSegments),
              ],
            ),
          ),
        ),
      ),
      bottomNavigationBar: const AppBottomNavBar(currentTab: AppTab.home),
    );
  }
}
