import 'package:flutter/material.dart';

import '../../../core/sync_manager.dart';
import '../shared/translated_text.dart';
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
                    child: TranslatedText(
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

class BadgeInfoChip extends StatelessWidget {
  const BadgeInfoChip({super.key, required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 4),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFFDDE2E7),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: const Color(0xFF3F5662)),
          const SizedBox(width: 5),
          Flexible(
            child: TranslatedText(
              label,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: Color(0xFF2A3640),
              ),
              overflow: TextOverflow.ellipsis,
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

class BadgeInfoTag extends StatelessWidget {
  const BadgeInfoTag({super.key, required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    // Cap the tag width so a long area name ellipsizes instead of overflowing
    // the screen when laid out inside a Wrap.
    final maxWidth = MediaQuery.of(context).size.width * 0.8;

    return ConstrainedBox(
      constraints: BoxConstraints(maxWidth: maxWidth),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFDDE2E8)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 15, color: const Color(0xFF4A5C6A)),
            const SizedBox(width: 6),
            Flexible(
              child: TranslatedText(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF2A3640),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class BadgeSectionCard extends StatelessWidget {
  const BadgeSectionCard({super.key, required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w700,
              color: Color(0xFF1A1F25),
            ),
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

class BadgeDetailRow extends StatelessWidget {
  const BadgeDetailRow({super.key, required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          SizedBox(
            width: 80,
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Color(0xFF7A8894),
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1E2932),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
