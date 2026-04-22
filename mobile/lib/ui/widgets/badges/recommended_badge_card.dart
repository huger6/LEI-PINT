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
      borderRadius: BorderRadius.circular(20),
      onTap: onTap,
      child: Container(
        width: 175,
        margin: const EdgeInsets.only(right: 12),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFFDDE3E9),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Center(
                child: SizedBox(
                  width: 78,
                  height: 98,
                  child: Stack(
                    alignment: Alignment.topCenter,
                    children: [
                      Positioned(
                        top: 50,
                        child: Row(
                          children: [
                            Icon(Icons.bookmark, color: ribbonColor, size: 30),
                            const SizedBox(width: 3),
                            Icon(Icons.bookmark, color: ribbonColor, size: 30),
                          ],
                        ),
                      ),
                      Container(
                        width: 68,
                        height: 68,
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
                          size: 40,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            Text(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w700,
                color: Color(0xFF222A30),
              ),
            ),
            const SizedBox(height: 2),
            Text(
              area,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 15, color: Color(0xFF343B42)),
            ),
          ],
        ),
      ),
    );
  }
}
