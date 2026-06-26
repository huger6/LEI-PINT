import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_colors.dart';
import '../../../presentation/state/badge_store.dart';
import '../../../presentation/state/language_controller.dart';
import '../../../models/earned_badge_model.dart';
import '../../widgets/badges/my_badges_widgets.dart';
import '../../widgets/profile/badge_gallery_widgets.dart';
import '../../widgets/shared/app_icon/app_icon.dart';
import '../../widgets/shared/app_icon/app_icon_data.dart';

class BadgeGalleryScreen extends StatefulWidget {
  const BadgeGalleryScreen({super.key});

  @override
  State<BadgeGalleryScreen> createState() => _BadgeGalleryScreenState();
}

class _BadgeGalleryScreenState extends State<BadgeGalleryScreen> {
  final TextEditingController _searchController = TextEditingController();
  final Set<int> _featuredIds = {};
  bool _initialized = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final badgeStore = context.read<BadgeStore>();
      badgeStore.loadEarnedBadges();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _initFeaturedIds(List<EarnedBadge> earned) {
    if (_initialized) return;
    _initialized = true;
    for (final item in earned) {
      if (item.award.isFeatured) {
        _featuredIds.add(item.award.id);
      }
    }
  }

  Future<void> _toggleFeatured(EarnedBadge item) async {
    final id = item.award.id;
    final willFeature = !_featuredIds.contains(id);

    // Optimistic UI update.
    setState(() {
      if (willFeature) {
        _featuredIds.add(id);
      } else {
        _featuredIds.remove(id);
      }
    });

    final badgeStore = context.read<BadgeStore>();
    final ok = await badgeStore.toggleBadgeGallery(
      id,
      item.award.verificationLink ?? '',
      willFeature,
    );

    if (!mounted) return;

    if (!ok) {
      // Revert on failure and let the user know.
      setState(() {
        if (willFeature) {
          _featuredIds.remove(id);
        } else {
          _featuredIds.add(id);
        }
      });
      final tr = LanguageScope.of(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(tr.tr('galleryUpdateError')),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final badgeStore = context.watch<BadgeStore>();
    final earned = badgeStore.earnedBadges;

    _initFeaturedIds(earned);

    final query = _searchController.text.trim().toLowerCase();
    final filtered = earned
        .where((e) => e.badge.title.toLowerCase().contains(query))
        .toList(growable: false);

    final featuredCount = earned
        .where((e) => _featuredIds.contains(e.award.id))
        .length;

    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        backgroundColor: Colors.grey[100],
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const AppIcon(
            AppIcons.chevronBackward,
            color: Color(0xFF1E2932),
            size: 20,
          ),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Galeria de Badges',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w800,
            color: Color(0xFF1E2932),
          ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: badgeStore.isLoadingEarned && earned.isEmpty
            ? const Center(child: CircularProgressIndicator())
            : earned.isEmpty
                ? const GalleryEmptyState()
                : Padding(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                    child: Column(
                      children: [
                        GalleryHeader(
                          featuredCount: featuredCount,
                          totalCount: earned.length,
                        ),
                        const SizedBox(height: 14),
                        BadgesSearchBar(
                          controller: _searchController,
                          hintText: 'Procurar badges',
                          onChanged: (_) => setState(() {}),
                        ),
                        const SizedBox(height: 14),
                        if (filtered.isEmpty)
                          const Expanded(
                            child: GalleryEmptyState(isSearchEmpty: true),
                          )
                        else
                          Expanded(
                            child: ListView.builder(
                              itemCount: filtered.length,
                              itemBuilder: (context, index) {
                                final item = filtered[index];
                                final featured =
                                    _featuredIds.contains(item.award.id);

                                return GalleryBadgeCard(
                                  earned: item,
                                  isFeatured: featured,
                                  onToggle: () => _toggleFeatured(item),
                                );
                              },
                            ),
                          ),
                      ],
                    ),
                  ),
      ),
    );
  }
}
