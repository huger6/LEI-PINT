import 'package:flutter/material.dart';

import 'badge_image.dart';
import '../shared/translated_text.dart';

class RecommendedBadgeCard extends StatelessWidget {
  const RecommendedBadgeCard({
    super.key,
    required this.title,
    required this.area,
    required this.medalColor,
    required this.ribbonColor,
    this.imageUrl,
    this.onTap,
  });

  final String title;
  final String area;
  final Color medalColor;
  final Color ribbonColor;

  /// The badge's actual (SVG) artwork; falls back to a generic badge icon.
  final String? imageUrl;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(18),
      onTap: onTap,
      child: Container(
        width: 150,
        margin: const EdgeInsets.only(right: 12),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFFEAEDF2),
          borderRadius: BorderRadius.circular(18),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Expanded(
              child: Center(
                child: BadgeImage(
                  imageUrl: imageUrl,
                  size: 68,
                  fallbackColor: medalColor,
                ),
              ),
            ),
            TranslatedText(
              title,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: Color(0xFF222A30),
                height: 1.2,
              ),
            ),
            const SizedBox(height: 3),
            TranslatedText(
              area,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
            ),
          ],
        ),
      ),
    );
  }
}
