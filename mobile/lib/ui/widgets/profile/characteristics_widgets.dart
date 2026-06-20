import 'package:flutter/material.dart';

import '../../../presentation/state/language_controller.dart';
import '../shared/app_icon/app_icon.dart';
import '../shared/translated_text.dart';

class CharacteristicChip extends StatelessWidget {
  const CharacteristicChip({
    super.key,
    required this.label,
    required this.icon,
    this.isPrimary = false,
  });

  final String label;
  final String icon;
  final bool isPrimary;

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: isPrimary ? const Color(0xFFDAEAF7) : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: isPrimary
            ? Border.all(color: const Color(0xFF5D9FD1), width: 1.5)
            : null,
        boxShadow: const [
          BoxShadow(
            color: Color(0x12000000),
            blurRadius: 6,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: isPrimary
                  ? const Color(0xFF5D9FD1)
                  : const Color(0xFFD5EAF6),
              shape: BoxShape.circle,
            ),
            child: AppIcon(
              icon,
              color: isPrimary ? Colors.white : const Color(0xFF4D9ECC),
              size: 20,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: TranslatedText(
              label,
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: isPrimary
                    ? const Color(0xFF1A3A5C)
                    : const Color(0xFF1E2932),
              ),
            ),
          ),
          if (isPrimary)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: const Color(0xFF5D9FD1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                tr.tr('primary'),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class CharacteristicSectionHeader extends StatelessWidget {
  const CharacteristicSectionHeader({
    super.key,
    required this.title,
    required this.icon,
  });

  final String title;
  final String icon;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 18, bottom: 8),
      child: Row(
        children: [
          AppIcon(icon, color: const Color(0xFF5D9FD1), size: 20),
          const SizedBox(width: 8),
          Text(
            title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: Color(0xFF1E2932),
            ),
          ),
        ],
      ),
    );
  }
}
