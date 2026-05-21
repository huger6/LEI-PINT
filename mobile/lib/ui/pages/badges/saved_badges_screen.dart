import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../injection_container.dart';
import '../../../models/badge_model.dart';
import '../../widgets/badges/explore_badge_card.dart';
import 'badges_page.dart';

class SavedBadgesScreen extends StatelessWidget {
  const SavedBadgesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final badgeStore = context.watch<BadgeStore>();
    final saved = badgeStore.savedBadges;

    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: const Text(
          'Badges Guardados',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: Color(0xFF1E2932),
          ),
        ),
        backgroundColor: Colors.grey[100],
        foregroundColor: const Color(0xFF1E2932),
        elevation: 0,
      ),
      body: saved.isEmpty
          ? Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.bookmark_border_rounded,
                      size: 64,
                      color: Colors.grey[400],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Nenhum badge guardado',
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                        color: Colors.grey[600],
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Guarde badges para os encontrar facilmente mais tarde.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[500],
                      ),
                    ),
                  ],
                ),
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
              itemCount: saved.length,
              itemBuilder: (context, index) {
                final badge = saved[index];
                return ExploreBadgeCard(
                  title: badge.title,
                  category: badge.category,
                  points: badge.points,
                  level: badge.level,
                  duration: badge.duration,
                  medalColor: badge.medalColor,
                  ribbonColor: badge.ribbonColor,
                  isSaved: true,
                  onSaveToggle: () {
                    badgeStore.toggleFavorite(badge.id);
                  },
                  onTap: () async {
                    final detailed =
                        await badgeStore.getBadgeDetail(badge);
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
    );
  }
}
