import 'package:flutter/material.dart';

import '../../../models/earned_badge_model.dart';
import '../badges/my_badges_widgets.dart';
import '../shared/app_icon/app_icon.dart';
import '../shared/app_icon/app_icon_data.dart';

class GalleryBadgeCard extends StatelessWidget {
  const GalleryBadgeCard({
    super.key,
    required this.earned,
    required this.isFeatured,
    required this.onToggle,
  });

  final EarnedBadge earned;
  final bool isFeatured;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    final badge = earned.badge;
    final level = badge.level.trim().isNotEmpty ? badge.level : '';
    final points = badge.points > 0 ? badge.points : 0;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 250),
      curve: Curves.easeInOut,
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        border: Border.all(
          color: isFeatured
              ? const Color(0xFF62B7E4)
              : const Color(0xFFE5E8EC),
          width: isFeatured ? 2.0 : 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: isFeatured
                ? const Color(0x2062B7E4)
                : const Color(0x14000000),
            blurRadius: isFeatured ? 12 : 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          BadgeMedalIcon(
            medalColor: badge.medalColor,
            ribbonColor: badge.ribbonColor,
            compact: true,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  badge.title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF172733),
                    height: 1.2,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Wrap(
                  spacing: 8,
                  runSpacing: 4,
                  children: [
                    if (level.isNotEmpty)
                      _InfoChip(
                        icon: AppIcons.progress,
                        text: level,
                      ),
                    if (points > 0)
                      _InfoChip(
                        icon: AppIcons.badgePremium,
                        text: '$points pts',
                      ),
                    _InfoChip(
                      icon: AppIcons.today,
                      text: _formatDate(earned.award.awardedAt),
                    ),
                  ],
                ),
                if (isFeatured) ...[
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE8F5FD),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text(
                      'Na galeria',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF3A8DBF),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: onToggle,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: isFeatured
                    ? const Color(0xFF62B7E4)
                    : const Color(0xFFF0F3F6),
                shape: BoxShape.circle,
                border: Border.all(
                  color: isFeatured
                      ? const Color(0xFF4DA3D4)
                      : const Color(0xFFD4DBE2),
                  width: 1.5,
                ),
              ),
              child: AppIcon(
                isFeatured
                    ? AppIcons.check
                    : AppIcons.add,
                color: isFeatured
                    ? Colors.white
                    : const Color(0xFF6B7C8A),
                size: 22,
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    final day = date.day.toString().padLeft(2, '0');
    final month = date.month.toString().padLeft(2, '0');
    final year = date.year;
    return '$day/$month/$year';
  }
}

class _InfoChip extends StatelessWidget {
  const _InfoChip({required this.icon, required this.text});

  final String icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        AppIcon(icon, size: 14, color: const Color(0xFF445967)),
        const SizedBox(width: 3),
        Flexible(
          child: Text(
            text,
            style: const TextStyle(
              color: Color(0xFF445967),
              fontWeight: FontWeight.w600,
              fontSize: 12,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}

class GalleryHeader extends StatelessWidget {
  const GalleryHeader({
    super.key,
    required this.featuredCount,
    required this.totalCount,
  });

  final int featuredCount;
  final int totalCount;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF4DA3D4), Color(0xFF62B7E4)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(15),
        boxShadow: const [
          BoxShadow(
            color: Color(0x2062B7E4),
            blurRadius: 12,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              AppIcon(
                AppIcons.badge,
                color: Colors.white,
                size: 24,
              ),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Galeria de Badges',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Selecione os badges que pretende tornar públicos na sua galeria pessoal.',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: Colors.white.withValues(alpha: 0.9),
              height: 1.3,
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const AppIcon(
                  AppIcons.eye,
                  color: Colors.white,
                  size: 18,
                ),
                const SizedBox(width: 6),
                Flexible(
                  child: Text(
                    '$featuredCount de $totalCount badges na galeria',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class GalleryEmptyState extends StatelessWidget {
  const GalleryEmptyState({super.key, this.isSearchEmpty = false});

  final bool isSearchEmpty;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AppIcon(
              isSearchEmpty
                  ? AppIcons.search
                  : AppIcons.trophy,
              size: 56,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 12),
            Text(
              isSearchEmpty
                  ? 'Nenhum badge encontrado.'
                  : 'Ainda não obteve nenhum badge.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 15,
                color: Colors.grey[600],
                fontWeight: FontWeight.w600,
              ),
            ),
            if (!isSearchEmpty) ...[
              const SizedBox(height: 6),
              Text(
                'Complete candidaturas para começar a preencher a sua galeria.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13,
                  color: Colors.grey[500],
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
