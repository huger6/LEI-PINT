import 'package:flutter/material.dart';

import '../../../models/badge_model.dart';
import '../../../presentation/state/language_controller.dart';

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
        prefixIcon: const Icon(Icons.search_rounded),
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
  });

  final BadgeModel badge;
  final DateTime completionDate;
  final String fallbackLevel;
  final int fallbackPoints;
  final VoidCallback? onTap;
  final VoidCallback? onShare;
  final VoidCallback? onDownload;

  @override
  Widget build(BuildContext context) {
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
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(
                            badge.title,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF172733),
                              height: 1.1,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Flexible(
                          flex: 0,
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              if (isSpecial) ...[
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFFFF3D6),
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(color: const Color(0xFFD4A843), width: 0.8),
                                  ),
                                  child: Text(
                                    LanguageScope.of(context).tr('special'),
                                    style: const TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w700,
                                      color: Color(0xFFB08A2E),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 6),
                              ],
                              Text(
                                '$level  $points',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFF213241),
                                  fontSize: 13,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(width: 3),
                              Icon(
                                isSpecial
                                    ? Icons.star_rounded
                                    : Icons.workspace_premium_outlined,
                                size: 17,
                                color: isSpecial
                                    ? const Color(0xFFD4A843)
                                    : const Color(0xFF445967),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    if (badge.category.trim().isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          const Icon(
                            Icons.category_outlined,
                            size: 17,
                            color: Color(0xFF445967),
                          ),
                          const SizedBox(width: 5),
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
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(
                          Icons.calendar_month_rounded,
                          size: 17,
                          color: Color(0xFF445967),
                        ),
                        const SizedBox(width: 5),
                        Flexible(
                          child: Text(
                            _formatDate(completionDate),
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
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: onDownload,
                  icon: const Icon(Icons.download_rounded, size: 18),
                  label: FittedBox(
                    child: Text(LanguageScope.of(context).tr('proofDocument')),
                  ),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF263542),
                    side: const BorderSide(color: Color(0xFFC2CDD7)),
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
                  icon: const Icon(Icons.share_outlined, size: 18),
                  label: FittedBox(
                    child: Text(LanguageScope.of(context).tr('share')),
                  ),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF263542),
                    side: const BorderSide(color: Color(0xFFC2CDD7)),
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
                      const Icon(
                        Icons.category_outlined,
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
                    const Icon(
                      Icons.calendar_month_rounded,
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
    this.compact = false,
  });

  final Color medalColor;
  final Color ribbonColor;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final medalSize = compact ? 44.0 : 58.0;
    final ribbonIconSize = compact ? 18.0 : 22.0;
    final iconSize = compact ? 25.0 : 33.0;
    final topOffset = compact ? 35.0 : 45.0;

    return SizedBox(
      width: compact ? 54 : 72,
      height: compact ? 78 : 94,
      child: Stack(
        alignment: Alignment.topCenter,
        children: [
          Positioned(
            top: topOffset,
            child: Row(
              children: [
                Icon(Icons.bookmark, color: ribbonColor, size: ribbonIconSize),
                const SizedBox(width: 2),
                Icon(Icons.bookmark, color: ribbonColor, size: ribbonIconSize),
              ],
            ),
          ),
          Container(
            width: medalSize,
            height: medalSize,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: medalColor,
              border: Border.all(color: const Color(0xFF7A7A7A), width: 1.4),
            ),
            child: Icon(
              Icons.star_rounded,
              color: Colors.white,
              size: iconSize,
            ),
          ),
        ],
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

