import 'package:flutter/material.dart';

import '../widgets/shared/app_bottom_nav_bar.dart';
import '../widgets/dashboard/certification_donut_card.dart';
import '../widgets/badges/badge_catalog.dart';
import '../widgets/badges/recommended_badge_card.dart';
import '../widgets/dashboard/simple_line_stats_card.dart';
import '../widgets/applications/submission_card.dart';
import 'badges/badges_page.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    const pageBackground = Color(0xFFE2E6EB);

    final submissions = <_SubmissionData>[
      const _SubmissionData(
        title: 'Master of sprints',
        status: 'Em avaliação',
        statusColor: Color(0xFFC7A11D),
        timestamp: '3h',
        medalColor: Color(0xFFD2D5DA),
        ribbonColor: Color(0xFFAF5353),
      ),
      const _SubmissionData(
        title: 'Master of DevOps',
        status: 'Rejeitado',
        statusColor: Color(0xFFD63D2B),
        timestamp: '5d',
        medalColor: Color(0xFFDFC24C),
        ribbonColor: Color(0xFFAF5353),
      ),
      const _SubmissionData(
        title: 'IBM Front-End Dev',
        status: 'Aprovado',
        statusColor: Color(0xFF56C640),
        timestamp: '8d',
        medalColor: Color(0xFFC4C6D6),
        ribbonColor: Color(0xFF5B84D6),
      ),
    ];

    final recommendedBadges = BadgeCatalog.recommended();
    final catalogBadges = BadgeCatalog.all;

    const donutSegments = [
      DonutSegmentData(label: 'LowCode', value: 2, color: Color(0xFF5C4FE0)),
      DonutSegmentData(label: 'DevSecOps', value: 5, color: Color(0xFFC3B1E6)),
      DonutSegmentData(
        label: 'Design UX/UI',
        value: 5,
        color: Color(0xFF7B4DE4),
      ),
      DonutSegmentData(label: 'Automação', value: 8, color: Color(0xFFB9C4E9)),
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
                const _DashboardTopBar(),
                const SizedBox(height: 20),
                const Text(
                  'Boa tarde, José Almeida!',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF20252B),
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Submissões recentes',
                  style: TextStyle(
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
                const Text(
                  'Para si',
                  style: TextStyle(
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
                const Text(
                  'Continua assim!',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF20252B),
                  ),
                ),
                const SizedBox(height: 6),
                RichText(
                  text: const TextSpan(
                    style: TextStyle(
                      fontSize: 17,
                      color: Color(0xFF30353C),
                      height: 1.4,
                    ),
                    children: [
                      TextSpan(text: 'Estás no top '),
                      TextSpan(
                        text: '5%',
                        style: TextStyle(fontWeight: FontWeight.w800),
                      ),
                      TextSpan(text: ' de mais '),
                      TextSpan(
                        text: 'badges conquistados',
                        style: TextStyle(fontWeight: FontWeight.w800),
                      ),
                      TextSpan(text: ' na última semana.'),
                    ],
                  ),
                ),
                const SimpleLineStatsCard(),
                const CertificationDonutCard(
                  totalAreas: 4,
                  segments: donutSegments,
                ),
              ],
            ),
          ),
        ),
      ),
      bottomNavigationBar: const AppBottomNavBar(currentTab: AppTab.inicio),
    );
  }
}

class _DashboardTopBar extends StatelessWidget {
  const _DashboardTopBar();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF6DC1E3), Color(0xFF658CC9)],
            ),
            borderRadius: BorderRadius.circular(14),
          ),
          child: const Row(
            children: [
              Text(
                '1259',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                  fontSize: 17,
                ),
              ),
              SizedBox(width: 8),
              Icon(
                Icons.workspace_premium_rounded,
                color: Colors.white,
                size: 20,
              ),
            ],
          ),
        ),
        const Spacer(),
        Container(
          width: 42,
          height: 42,
          decoration: const BoxDecoration(
            color: Color(0xFFD2DAE2),
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.campaign_outlined, color: Color(0xFF20252B)),
        ),
        const SizedBox(width: 8),
        Stack(
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: const BoxDecoration(
                color: Color(0xFFD2DAE2),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.notifications_outlined,
                color: Color(0xFF20252B),
              ),
            ),
            Positioned(
              right: 8,
              top: 8,
              child: Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: Color(0xFFDE5A6A),
                  shape: BoxShape.circle,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(width: 8),
        const CircleAvatar(
          radius: 21,
          backgroundColor: Color(0xFFC9D6E2),
          child: Icon(Icons.person, color: Color(0xFF1F242A), size: 24),
        ),
      ],
    );
  }
}

class _SubmissionData {
  const _SubmissionData({
    required this.title,
    required this.status,
    required this.statusColor,
    required this.timestamp,
    required this.medalColor,
    required this.ribbonColor,
  });

  final String title;
  final String status;
  final Color statusColor;
  final String timestamp;
  final Color medalColor;
  final Color ribbonColor;
}
