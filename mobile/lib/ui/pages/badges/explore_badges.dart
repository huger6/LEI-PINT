import 'package:flutter/material.dart';

import '../utils/badge_catalog.dart';
import '../widgets/app_bottom_nav_bar.dart';
import '../widgets/dashboard/explore_badge_card.dart';
import '../widgets/modals/filter_modal.dart';
import 'badge_detail_screen.dart';

class ExploreCompetenciesScreen extends StatelessWidget {
  const ExploreCompetenciesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final badges = BadgeCatalog.all;

    return Scaffold(
      backgroundColor: Colors.grey[100],
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
          child: Column(
            children: [
              Row(
                children: [
                  const Expanded(
                    child: Text(
                      'Explora novas competências',
                      style: TextStyle(
                        fontSize: 23,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF212D36),
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: () {},
                    icon: const Icon(Icons.campaign_outlined, size: 31),
                    color: const Color(0xFF1E2932),
                  ),
                  IconButton(
                    onPressed: () {},
                    icon: const Icon(
                      Icons.notifications_none_rounded,
                      size: 31,
                    ),
                    color: const Color(0xFF1E2932),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Container(
                height: 74,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x12000000),
                      blurRadius: 10,
                      offset: Offset(0, 2),
                    ),
                  ],
                ),
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: TextField(
                  textAlignVertical: TextAlignVertical.center,
                  decoration: InputDecoration(
                    hintText: 'Procura o teu badge',
                    border: InputBorder.none,
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(vertical: 18),
                    prefixIconConstraints: const BoxConstraints(
                      minWidth: 44,
                      minHeight: 44,
                    ),
                    prefixIcon: const Icon(
                      Icons.search_rounded,
                      size: 32,
                      color: Color(0xFF55616A),
                    ),
                    suffixIconConstraints: const BoxConstraints(
                      minWidth: 44,
                      minHeight: 44,
                    ),
                    suffixIcon: IconButton(
                      onPressed: () => showFilterModal(context),
                      icon: const Icon(
                        Icons.tune_rounded,
                        size: 30,
                        color: Color(0xFF55616A),
                      ),
                    ),
                  ),
                  style: const TextStyle(fontSize: 20),
                ),
              ),
              const SizedBox(height: 14),
              Expanded(
                child: ListView.builder(
                  itemCount: badges.length,
                  itemBuilder: (context, index) {
                    final badge = badges[index];
                    return ExploreBadgeCard(
                      title: badge.title,
                      category: badge.category,
                      points: badge.points,
                      level: badge.level,
                      duration: badge.duration,
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
            ],
          ),
        ),
      ),
      bottomNavigationBar: const AppBottomNavBar(currentTab: AppTab.explorar),
    );
  }
}
