import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/sync_manager.dart';
import '../../../injection_container.dart';
import '../../widgets/shared/app_bottom_nav_bar.dart';
import '../../widgets/badges/explore_badge_card.dart';
import '../../widgets/badges/filter_modal.dart';
import 'badges_page.dart';

class ExploreCompetenciesScreen extends StatefulWidget {
  const ExploreCompetenciesScreen({super.key});

  @override
  State<ExploreCompetenciesScreen> createState() =>
      _ExploreCompetenciesScreenState();
}

class _ExploreCompetenciesScreenState extends State<ExploreCompetenciesScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<BadgeStore>().loadBadges();
    });
  }

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    final badgeStore = context.watch<BadgeStore>();
    final badges = badgeStore.badges;

    return Scaffold(
      backgroundColor: Colors.grey[100],
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
          child: Column(
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      tr.tr('exploreCompetenciesTitle'),
                      style: const TextStyle(
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
                    hintText: tr.tr('searchBadgeHint'),
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
              if (badgeStore.isLoading)
                const Expanded(
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (badgeStore.errorMessage != null)
                Expanded(
                  child: Center(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                      child: Text(
                        badgeStore.errorMessage!,
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
                )
              else if (badges.isEmpty)
                Expanded(
                  child: Center(child: Text(tr.tr('noBadgesAvailable'))),
                )
              else
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
                        onTap: () async {
                          final detailed = await context
                              .read<BadgeStore>()
                              .getBadgeDetail(badge);

                          if (!context.mounted) {
                            return;
                          }

                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) =>
                                  BadgeDetailScreen(badge: detailed ?? badge),
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
      bottomNavigationBar: const AppBottomNavBar(currentTab: AppTab.explore),
    );
  }
}
