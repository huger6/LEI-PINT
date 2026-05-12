import 'package:flutter/material.dart';

import '../../../core/sync_manager.dart';
import '../../../models/badge_model.dart';

class BadgeDetailTabButton extends StatelessWidget {
  const BadgeDetailTabButton({
    super.key,
    required this.title,
    required this.isActive,
    required this.onTap,
  });

  final String title;
  final bool isActive;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Text(
              title,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: Color(0xFF202020),
              ),
            ),
          ),
          Container(
            height: 3,
            color: isActive ? const Color(0xFF63B3E0) : const Color(0xFFAEB7C0),
          ),
        ],
      ),
    );
  }
}

class BadgeRequirementsSection extends StatelessWidget {
  const BadgeRequirementsSection({super.key, required this.requirements});

  final List<BadgeRequirement> requirements;

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 10),
      padding: const EdgeInsets.fromLTRB(14, 16, 14, 14),
      decoration: BoxDecoration(
        color: const Color(0xFFDDE2E7),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Text(
              tr.tr('requirements'),
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700),
            ),
          ),
          const SizedBox(height: 14),
          ...requirements.map(
            (requirement) => Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Icon(requirement.icon, color: const Color(0xFF3A444C)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      requirement.text,
                      style: const TextStyle(
                        fontSize: 16,
                        color: Color(0xFF2A2A2A),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Icon(
                    Icons.open_in_new_rounded,
                    color: Color(0xFF4B535A),
                    size: 22,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class LargeBadgeIcon extends StatelessWidget {
  const LargeBadgeIcon({super.key, required this.medalColor, required this.ribbonColor});

  final Color medalColor;
  final Color ribbonColor;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 142,
      height: 190,
      child: Stack(
        alignment: Alignment.topCenter,
        children: [
          Positioned(
            top: 94,
            child: Row(
              children: [
                Icon(Icons.bookmark, color: ribbonColor, size: 50),
                const SizedBox(width: 4),
                Icon(Icons.bookmark, color: ribbonColor, size: 50),
              ],
            ),
          ),
          Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: medalColor,
              border: Border.all(color: const Color(0xFF876E2C), width: 4),
            ),
            child: const Icon(
              Icons.star_rounded,
              color: Color(0xFFFFF6C7),
              size: 72,
            ),
          ),
        ],
      ),
    );
  }
}
