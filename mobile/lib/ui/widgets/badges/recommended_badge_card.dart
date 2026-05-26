import 'package:flutter/material.dart';

class RecommendedBadgeCard extends StatelessWidget {
  const RecommendedBadgeCard({
    super.key,
    required this.title,
    required this.area,
    required this.medalColor,
    required this.ribbonColor,
    this.onTap,
  });

  final String title;
  final String area;
  final Color medalColor;
  final Color ribbonColor;
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
                child: SizedBox(
                  width: 72,
                  height: 90,
                  child: Stack(
                    alignment: Alignment.topCenter,
                    children: [
                      Positioned(
                        top: 44,
                        child: Row(
                          children: [
                            Icon(Icons.bookmark, color: ribbonColor, size: 26),
                            const SizedBox(width: 2),
                            Icon(Icons.bookmark, color: ribbonColor, size: 26),
                          ],
                        ),
                      ),
                      Container(
                        width: 60,
                        height: 60,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: medalColor,
                          border: Border.all(
                            color: const Color(0xFF876E2C),
                            width: 2,
                          ),
                        ),
                        child: const Icon(
                          Icons.star_rounded,
                          color: Color(0xFFFFF6C7),
                          size: 34,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            Text(
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
            Text(
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
