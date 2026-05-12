import 'package:flutter/material.dart';

import '../../../models/application_summary_model.dart';
import '../../../models/badge_model.dart';
import '../../widgets/badges/badge_catalog.dart';

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
    return Container(
      height: 46,
      padding: const EdgeInsets.symmetric(horizontal: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFD8E8F3),
        borderRadius: BorderRadius.circular(15),
      ),
      child: TextField(
        controller: controller,
        onChanged: onChanged,
        textAlignVertical: TextAlignVertical.center,
        decoration: InputDecoration(
          hintText: hintText,
          border: InputBorder.none,
          isDense: true,
          contentPadding: const EdgeInsets.symmetric(vertical: 10),
          prefixIcon: const Icon(
            Icons.search_rounded,
            color: Color(0xFF41525E),
            size: 26,
          ),
          suffixIcon: IconButton(
            onPressed: () {},
            icon: const Icon(
              Icons.tune_rounded,
              color: Color(0xFF41525E),
              size: 24,
            ),
          ),
        ),
      ),
    );
  }
}

class AchievedBadgeCard extends StatelessWidget {
  const AchievedBadgeCard({
    super.key,
    required this.badge,
    required this.completionDate,
    required this.fallbackLevel,
    required this.fallbackPoints,
  });

  final BadgeModel badge;
  final DateTime completionDate;
  final String fallbackLevel;
  final int fallbackPoints;

  @override
  Widget build(BuildContext context) {
    final level = badge.level.trim().isNotEmpty ? badge.level : fallbackLevel;
    final points = badge.points > 0 ? badge.points : fallbackPoints;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        boxShadow: const [
          BoxShadow(
            color: Color(0x14000000),
            blurRadius: 8,
            offset: Offset(0, 2),
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
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          '$level  $points',
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF213241),
                            fontSize: 13,
                          ),
                        ),
                        const SizedBox(width: 3),
                        const Icon(
                          Icons.workspace_premium_outlined,
                          size: 17,
                          color: Color(0xFF445967),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(
                          Icons.calendar_month_rounded,
                          size: 17,
                          color: Color(0xFF445967),
                        ),
                        const SizedBox(width: 5),
                        Text(
                          _formatDate(completionDate),
                          style: const TextStyle(
                            color: Color(0xFF445967),
                            fontWeight: FontWeight.w600,
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
                  onPressed: () {},
                  icon: const Icon(Icons.download_rounded, size: 18),
                  label: const Text('Comprovativo'),
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
                  onPressed: () {},
                  icon: const Icon(Icons.share_outlined, size: 18),
                  label: const Text('Partilhar'),
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
  });

  final BadgeModel badge;
  final ApplicationStateVisual state;
  final String date;
  final String updateText;

  @override
  Widget build(BuildContext context) {
    return Container(
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
                ),
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
                    Text(
                      state.label,
                      style: TextStyle(
                        color: state.color,
                        fontWeight: FontWeight.w700,
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
  all('Todos'),
  approved('Aprovadas'),
  inReview('Em an\u00e1lise'),
  rejected('Rejeitadas');

  const ApplicationFilter(this.label);

  final String label;
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

List<ApplicationSummaryModel> mockApplications() {
  return [
    ApplicationSummaryModel(
      applicationGuid: 'mock-1',
      applicationState: 'Approved',
      badge: BadgeCatalog.all[0],
      submittedAt: DateTime.now().subtract(const Duration(days: 2)),
    ),
    ApplicationSummaryModel(
      applicationGuid: 'mock-2',
      applicationState: 'In review',
      badge: BadgeCatalog.all[1],
      submittedAt: DateTime.now().subtract(const Duration(hours: 3)),
    ),
    ApplicationSummaryModel(
      applicationGuid: 'mock-3',
      applicationState: 'Rejected',
      badge: BadgeCatalog.all[2],
      submittedAt: DateTime.now().subtract(const Duration(hours: 23)),
    ),
  ];
}
