import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../injection_container.dart';
import '../../../models/badge_model.dart';
import '../../widgets/shared/app_bottom_nav_bar.dart';
import '../../widgets/badges/explore_badge_card.dart';
import '../../widgets/badges/filter_modal.dart';
import 'badges_page.dart';
import '../notifications/notifications_screen.dart';

class ExploreCompetenciesScreen extends StatefulWidget {
  const ExploreCompetenciesScreen({super.key});

  @override
  State<ExploreCompetenciesScreen> createState() =>
      _ExploreCompetenciesScreenState();
}

class _ExploreCompetenciesScreenState extends State<ExploreCompetenciesScreen> {
  final _searchCtrl = TextEditingController();
  BadgeFilterResult? _activeFilter;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<BadgeStore>().loadBadges();
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  List<BadgeModel> _applyFilters(List<BadgeModel> badges) {
    var result = List<BadgeModel>.from(badges);
    final query = _searchCtrl.text.trim().toLowerCase();

    if (query.isNotEmpty) {
      result = result
          .where(
            (b) =>
                b.title.toLowerCase().contains(query) ||
                b.category.toLowerCase().contains(query),
          )
          .toList();
    }

    final filter = _activeFilter;
    if (filter != null) {
      if (filter.area != null) {
        result = result.where((b) => b.category == filter.area).toList();
      }
      if (filter.level != null) {
        result = result.where((b) => b.level == filter.level).toList();
      }
      if (filter.minPoints != null) {
        result = result.where((b) => b.points >= filter.minPoints!).toList();
      }
      if (filter.maxPoints != null) {
        result = result.where((b) => b.points <= filter.maxPoints!).toList();
      }

      if (filter.sort == 'points') {
        result.sort((a, b) => b.points.compareTo(a.points));
      } else if (filter.sort == 'oldest') {
        result = result.reversed.toList();
      }
    }

    return result;
  }

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    final badgeStore = context.watch<BadgeStore>();
    final allBadges = badgeStore.badges;
    final filtered = _applyFilters(allBadges);

    final areas = allBadges
        .map((b) => b.category)
        .where((c) => c.trim().isNotEmpty)
        .toSet()
        .toList()
      ..sort();
    final levels = allBadges
        .map((b) => b.level)
        .where((l) => l.trim().isNotEmpty)
        .toSet()
        .toList()
      ..sort();

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
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const NotificationsScreen(
                            sourceTab: AppTab.explore,
                          ),
                        ),
                      );
                    },
                    icon: const Icon(Icons.notifications_none, size: 31),
                    color: const Color(0xFF1E2932),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Container(
                height: 52,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x0E000000),
                      blurRadius: 8,
                      offset: Offset(0, 2),
                    ),
                  ],
                ),
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: TextField(
                  controller: _searchCtrl,
                  onChanged: (_) => setState(() {}),
                  textAlignVertical: TextAlignVertical.center,
                  decoration: InputDecoration(
                    hintText: tr.tr('searchBadgeHint'),
                    hintStyle: const TextStyle(
                      color: Color(0xFF9AA4AE),
                      fontWeight: FontWeight.w500,
                      fontSize: 15,
                    ),
                    border: InputBorder.none,
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(vertical: 14),
                    prefixIconConstraints: const BoxConstraints(
                      minWidth: 42,
                      minHeight: 42,
                    ),
                    prefixIcon: const Icon(
                      Icons.search_rounded,
                      size: 24,
                      color: Color(0xFF8B96A1),
                    ),
                    suffixIconConstraints: const BoxConstraints(
                      minWidth: 42,
                      minHeight: 42,
                    ),
                    suffixIcon: IconButton(
                      onPressed: () async {
                        final result = await showFilterModal(
                          context,
                          areas: areas,
                          levels: levels,
                        );
                        if (result != null) {
                          setState(() => _activeFilter = result);
                        }
                      },
                      icon: Icon(
                        Icons.tune_rounded,
                        size: 22,
                        color: _activeFilter != null
                            ? const Color(0xFF5EAEDC)
                            : const Color(0xFF8B96A1),
                      ),
                    ),
                  ),
                  style: const TextStyle(fontSize: 15),
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
              else if (filtered.isEmpty)
                Expanded(child: Center(child: Text(tr.tr('noBadgesAvailable'))))
              else
                Expanded(
                  child: ListView.builder(
                    itemCount: filtered.length,
                    itemBuilder: (context, index) {
                      final badge = filtered[index];
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

                          if (!context.mounted) return;

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
