import 'package:flutter/material.dart';

class ExploreBadgeCard extends StatelessWidget {
  const ExploreBadgeCard({
    super.key,
    required this.title,
    required this.category,
    required this.points,
    required this.level,
    required this.duration,
    required this.medalColor,
    required this.ribbonColor,
    this.onTap,
    this.isSaved = false,
    this.onSaveToggle,
  });

  final String title;
  final String category;
  final int points;
  final String level;
  final String duration;
  final Color medalColor;
  final Color ribbonColor;
  final VoidCallback? onTap;
  final bool isSaved;
  final VoidCallback? onSaveToggle;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(15),
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 14),
        padding: const EdgeInsets.fromLTRB(14, 14, 12, 12),
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
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _MedalBadgeIcon(medalColor: medalColor, ribbonColor: ribbonColor),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          title,
                          style: const TextStyle(
                            fontSize: 21,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF172733),
                            height: 1.1,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      GestureDetector(
                        onTap: onSaveToggle,
                        child: Icon(
                          isSaved ? Icons.bookmark_border_rounded : Icons.bookmark_add_outlined,
                          color: isSaved ? const Color(0xFF00B8E0) : const Color(0xFF415865),
                          size: 34,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: _DetailItem(
                          icon: Icons.category_outlined,
                          value: category,
                        ),
                      ),
                      Expanded(
                        child: _DetailItem(
                          icon: Icons.stairs_outlined,
                          value: level,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: _DetailItem(
                          icon: Icons.schedule_rounded,
                          value: duration,
                        ),
                      ),
                      Expanded(
                        child: _DetailItem(
                          icon: Icons.stars_rounded,
                          value: points.toString(),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  const Align(
                    alignment: Alignment.bottomRight,
                    child: CircleAvatar(
                      radius: 12,
                      backgroundColor: Color(0xFFF5C539),
                      child: Icon(
                        Icons.workspace_premium_outlined,
                        size: 15,
                        color: Color(0xFF856200),
                      ),
                    ),
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

class _DetailItem extends StatelessWidget {
  const _DetailItem({required this.icon, required this.value});

  final IconData icon;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 17, color: const Color(0xFF3F5662)),
        const SizedBox(width: 8),
        Flexible(
          child: Text(
            value,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: Color(0xFF1F2E38),
            ),
          ),
        ),
      ],
    );
  }
}

class _MedalBadgeIcon extends StatelessWidget {
  const _MedalBadgeIcon({required this.medalColor, required this.ribbonColor});

  final Color medalColor;
  final Color ribbonColor;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 82,
      height: 132,
      child: Stack(
        alignment: Alignment.topCenter,
        children: [
          Positioned(
            top: 53,
            child: Row(
              children: [
                Icon(Icons.bookmark, color: ribbonColor, size: 27),
                const SizedBox(width: 3),
                Icon(Icons.bookmark, color: ribbonColor, size: 27),
              ],
            ),
          ),
          Container(
            width: 68,
            height: 68,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: medalColor,
              border: Border.all(color: const Color(0xFF876E2C), width: 2),
            ),
            child: const Icon(
              Icons.star_rounded,
              color: Color(0xFFFFF6C7),
              size: 40,
            ),
          ),
        ],
      ),
    );
  }
}
