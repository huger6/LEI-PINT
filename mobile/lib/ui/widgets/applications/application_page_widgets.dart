import 'package:flutter/material.dart';

import '../../../models/badge_model.dart';

class ApplicationSectionTitle extends StatelessWidget {
  const ApplicationSectionTitle({
    super.key,
    required this.number,
    required this.title,
  });

  final int number;
  final String title;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        CircleAvatar(
          radius: 13,
          backgroundColor: ApplicationColors.primaryAction,
          child: Text(
            number.toString(),
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w700,
            color: ApplicationColors.primaryText,
          ),
        ),
      ],
    );
  }
}

class SelectedBadgeCard extends StatelessWidget {
  const SelectedBadgeCard({super.key, required this.badge});

  final BadgeModel badge;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        SelectedBadgeMedal(
          medalColor: badge.medalColor,
          ribbonColor: badge.ribbonColor,
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                badge.title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  color: ApplicationColors.primaryText,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                '${badge.category} - ${badge.level}',
                style: const TextStyle(
                  color: ApplicationColors.mutedText,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
        const Icon(
          Icons.lock_outline_rounded,
          color: ApplicationColors.iconMuted,
          size: 16,
        ),
      ],
    );
  }
}

class SelectedBadgeMedal extends StatelessWidget {
  const SelectedBadgeMedal({
    super.key,
    required this.medalColor,
    required this.ribbonColor,
  });

  final Color medalColor;
  final Color ribbonColor;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 46,
      height: 58,
      child: Stack(
        alignment: Alignment.topCenter,
        children: [
          Positioned(
            top: 27,
            child: Row(
              children: [
                Icon(Icons.bookmark, color: ribbonColor, size: 15),
                const SizedBox(width: 2),
                Icon(Icons.bookmark, color: ribbonColor, size: 15),
              ],
            ),
          ),
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: medalColor,
              border: Border.all(color: const Color(0xFF876E2C), width: 1.2),
            ),
            child: const Icon(
              Icons.star_rounded,
              color: Color(0xFFFFF6C7),
              size: 20,
            ),
          ),
        ],
      ),
    );
  }
}

class ApplicationCardContainer extends StatelessWidget {
  const ApplicationCardContainer({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10),
      decoration: BoxDecoration(
        color: ApplicationColors.cardBackground,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: ApplicationColors.cardBorder),
      ),
      child: child,
    );
  }
}

class ApplicationColors {
  static const Color pageBackground = Color(0xFFE8EEF3);
  static const Color cardBackground = Colors.white;
  static const Color cardBorder = Color(0xFFD2DCE6);
  static const Color dashedBorder = Color(0xFF9DB3C6);
  static const Color primaryAction = Color(0xFF5EAEDC);
  static const Color buttonDisabled = Color(0xFFAFC4D3);
  static const Color primaryText = Color(0xFF1D2A35);
  static const Color secondaryText = Color(0xFF394B59);
  static const Color mutedText = Color(0xFF61717F);
  static const Color iconMuted = Color(0xFF556571);
}
