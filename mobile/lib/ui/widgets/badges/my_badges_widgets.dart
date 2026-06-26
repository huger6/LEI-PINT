import 'package:flutter/material.dart';

import '../../../models/badge_model.dart';
import '../../../presentation/state/language_controller.dart';
import 'badge_image.dart';
import '../shared/translated_text.dart';
import '../shared/app_icon/app_icon.dart';
import '../shared/app_icon/app_icon_data.dart';

class BadgesSearchBar extends StatelessWidget {
  const BadgesSearchBar({
    super.key,
    required this.controller,
    required this.hintText,
    required this.onChanged,
  });

  final TextEditingController controller;
  final String hintText;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      onChanged: onChanged,
      decoration: InputDecoration(
        hintText: hintText,
        prefixIcon: const AppIcon(AppIcons.search),
      ),
      style: const TextStyle(fontSize: 14),
    );
  }
}

class AchievedBadgeCard extends StatelessWidget {
  const AchievedBadgeCard({
    super.key,
    required this.badge,
    required this.completionDate,
    this.fallbackLevel = '',
    this.fallbackPoints = 0,
    this.onTap,
    this.onShare,
    this.onDownload,
    this.expirationDate,
  });

  final BadgeModel badge;
  final DateTime completionDate;
  final String fallbackLevel;
  final int fallbackPoints;
  final VoidCallback? onTap;
  final VoidCallback? onShare;
  final VoidCallback? onDownload;
  final DateTime? expirationDate;

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    final level = badge.level.trim().isNotEmpty ? badge.level : fallbackLevel;
    final points = badge.points > 0 ? badge.points : fallbackPoints;

    final isSpecial = badge.isSpecial;

    return InkWell(
      borderRadius: BorderRadius.circular(15),
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.fromLTRB(12, 12, 12, 10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(15),
          border: isSpecial
              ? Border.all(color: const Color(0xFFD4A843), width: 1.6)
              : null,
          boxShadow: [
            BoxShadow(
              color: isSpecial
                  ? const Color(0x20D4A843)
                  : const Color(0x14000000),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                BadgeMedalIcon(
                  medalColor: badge.medalColor,
                  ribbonColor: badge.ribbonColor,
                  imageUrl: badge.imageUrl,
                  compact: true,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: TranslatedText(
                              badge.title,
                              style: const TextStyle(
                                fontSize: 17,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF172733),
                                height: 1.15,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (isSpecial) ...[
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 6,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFFF3D6),
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(
                                  color: const Color(0xFFD4A843),
                                  width: 0.8,
                                ),
                              ),
                              child: Text(
                                tr.tr('special'),
                                style: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFFB08A2E),
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 8),
                      // Metadata renders as a Wrap of compact chips so it
                      // reflows onto new lines on narrow screens. Each chip is
                      // capped to the column width so a single long label
                      // (e.g. a long area name) ellipsizes instead of
                      // overflowing.
                      LayoutBuilder(
                        builder: (context, constraints) {
                          final maxChipWidth = constraints.maxWidth;
                          return Wrap(
                            spacing: 6,
                            runSpacing: 6,
                            children: [
                              if (level.trim().isNotEmpty)
                                _BadgeMetaChip(
                                  icon: isSpecial
                                      ? AppIcons.star
                                      : AppIcons.badgePremium,
                                  label: level,
                                  iconColor: isSpecial
                                      ? const Color(0xFFD4A843)
                                      : const Color(0xFF445967),
                                  maxWidth: maxChipWidth,
                                ),
                              if (points > 0)
                                _BadgeMetaChip(
                                  icon: AppIcons.trophy,
                                  label: '$points ${tr.tr('pointsLabel')}',
                                  maxWidth: maxChipWidth,
                                ),
                              if (badge.category.trim().isNotEmpty)
                                _BadgeMetaChip(
                                  icon: AppIcons.area,
                                  label: badge.category,
                                  maxWidth: maxChipWidth,
                                ),
                              _BadgeMetaChip(
                                icon: AppIcons.today,
                                label: _formatDate(completionDate),
                                maxWidth: maxChipWidth,
                              ),
                              if (expirationDate != null)
                                _BadgeMetaChip(
                                  icon: AppIcons.closeCircle,
                                  label: '${tr.tr('expiresOn')} ${_formatDate(expirationDate!)}',
                                  iconColor: const Color(0xFFB05B2E),
                                  maxWidth: maxChipWidth,
                                ),
                            ],
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: onDownload,
                    icon: const AppIcon(AppIcons.download, size: 18),
                    label: FittedBox(
                      child: Text(tr.tr('proofDocument')),
                    ),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF263542),
                      side: const BorderSide(color: Color(0xFFC2CDD7)),
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      textStyle: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: onShare,
                    icon: const AppIcon(AppIcons.share, size: 18),
                    label: FittedBox(
                      child: Text(tr.tr('share')),
                    ),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF263542),
                      side: const BorderSide(color: Color(0xFFC2CDD7)),
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      textStyle: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
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

/// Compact icon + label pill used inside [AchievedBadgeCard]'s metadata wrap.
/// It shrinks its label to fit and never forces its parent to overflow.
class _BadgeMetaChip extends StatelessWidget {
  const _BadgeMetaChip({
    required this.icon,
    required this.label,
    required this.maxWidth,
    this.iconColor = const Color(0xFF445967),
  });

  final String icon;
  final String label;

  /// Upper bound (the parent column width) the chip may occupy. The label
  /// ellipsizes within whatever space is left after the icon and paddings.
  final double maxWidth;
  final Color iconColor;

  @override
  Widget build(BuildContext context) {
    return ConstrainedBox(
      constraints: BoxConstraints(maxWidth: maxWidth),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: const Color(0xFFF1F5F8),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            AppIcon(icon, size: 15, color: iconColor),
            const SizedBox(width: 4),
            Flexible(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Color(0xFF3A4A57),
                  fontWeight: FontWeight.w600,
                  fontSize: 12.5,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class ApplicationCard extends StatelessWidget {
  const ApplicationCard({
    super.key,
    required this.badge,
    required this.state,
    required this.date,
    required this.updateText,
    this.onTap,
  });

  final BadgeModel badge;
  final ApplicationStateVisual state;
  final String date;
  final String updateText;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(15),
      onTap: onTap,
      child: Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        border: Border.all(
          color: state.color.withValues(alpha: 0.7),
          width: 1.7,
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x10000000),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          BadgeMedalIcon(
            medalColor: badge.medalColor,
            ribbonColor: badge.ribbonColor,
            imageUrl: badge.imageUrl,
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
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1E2A35),
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                if (badge.category.trim().isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const AppIcon(
                        AppIcons.area,
                        size: 16,
                        color: Color(0xFF445967),
                      ),
                      const SizedBox(width: 4),
                      Flexible(
                        child: Text(
                          badge.category,
                          style: const TextStyle(
                            color: Color(0xFF445967),
                            fontWeight: FontWeight.w600,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 4),
                Row(
                  children: [
                    const AppIcon(
                      AppIcons.today,
                      size: 16,
                      color: Color(0xFF445967),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      date,
                      style: const TextStyle(
                        color: Color(0xFF445967),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: state.color,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Flexible(
                      child: Text(
                        state.label,
                        style: TextStyle(
                          color: state.color,
                          fontWeight: FontWeight.w700,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(
                      Icons.sync_rounded,
                      size: 16,
                      color: Color(0xFF4F6170),
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        updateText,
                        style: const TextStyle(
                          color: Color(0xFF4F6170),
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
      ),
    );
  }
}

class BadgeMedalIcon extends StatelessWidget {
  const BadgeMedalIcon({
    super.key,
    required this.medalColor,
    required this.ribbonColor,
    this.imageUrl,
    this.compact = false,
  });

  final Color medalColor;
  final Color ribbonColor;

  /// The badge's actual (SVG) artwork. When absent, a generic badge icon
  /// matching the web front-office is shown instead of a mock medal.
  final String? imageUrl;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final medalSize = compact ? 48.0 : 64.0;

    return SizedBox(
      width: compact ? 54 : 72,
      height: compact ? 78 : 94,
      child: Align(
        alignment: Alignment.topCenter,
        child: BadgeImage(
          imageUrl: imageUrl,
          size: medalSize,
          fallbackColor: medalColor,
        ),
      ),
    );
  }
}

enum ApplicationFilter {
  all('filterAll'),
  approved('filterApproved'),
  inReview('filterInReview'),
  rejected('filterRejected');

  const ApplicationFilter(this.labelKey);

  /// Source-string key resolved through [LanguageScope] at render time.
  final String labelKey;
}

class ApplicationStateVisual {
  const ApplicationStateVisual({
    required this.label,
    required this.color,
    required this.filter,
  });

  final String label;
  final Color color;
  final ApplicationFilter filter;
}

