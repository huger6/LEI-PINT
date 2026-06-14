import 'package:flutter/material.dart';

import '../../../presentation/state/language_controller.dart';
import '../shared/translated_text.dart';

class ExploreBadgeCard extends StatelessWidget {
  const ExploreBadgeCard({
    super.key,
    required this.title,
    required this.category,
    required this.points,
    required this.level,
    required this.medalColor,
    required this.ribbonColor,
    this.description = '',
    this.imageUrl,
    this.onTap,
    this.isSaved = false,
    this.onSaveToggle,
    this.isSpecial = false,
  });

  final String title;
  final String category;
  final int points;
  final String level;
  final Color medalColor;
  final Color ribbonColor;
  final String description;
  final String? imageUrl;
  final VoidCallback? onTap;
  final bool isSaved;
  final VoidCallback? onSaveToggle;
  final bool isSpecial;

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    return InkWell(
      borderRadius: BorderRadius.circular(15),
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 14),
        padding: const EdgeInsets.fromLTRB(14, 14, 12, 12),
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
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _MedalBadgeIcon(medalColor: medalColor, ribbonColor: ribbonColor, imageUrl: imageUrl),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: TranslatedText(
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
                      if (isSpecial) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF3D6),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(
                              color: const Color(0xFFD4A843),
                              width: 0.8,
                            ),
                          ),
                          child: Text(
                            tr.tr('special'),
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFFB08A2E),
                            ),
                          ),
                        ),
                        const SizedBox(width: 4),
                      ],
                      GestureDetector(
                        onTap: onSaveToggle,
                        child: Icon(
                          isSaved ? Icons.bookmark_rounded : Icons.bookmark_border_rounded,
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
                  _DetailItem(
                    icon: Icons.stars_rounded,
                    value: '${points.toString()} pts',
                  ),
                  if (description.trim().isNotEmpty) ...[
                    const SizedBox(height: 8),
                    TranslatedText(
                      description,
                      style: const TextStyle(
                        fontSize: 13,
                        color: Color(0xFF5B6773),
                        height: 1.3,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  if (isSpecial) ...[
                    const SizedBox(height: 6),
                    const Align(
                      alignment: Alignment.bottomRight,
                      child: CircleAvatar(
                        radius: 12,
                        backgroundColor: Color(0xFFF5C539),
                        child: Icon(
                          Icons.star_rounded,
                          size: 15,
                          color: Color(0xFF856200),
                        ),
                      ),
                    ),
                  ],
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
          child: TranslatedText(
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
  const _MedalBadgeIcon({required this.medalColor, required this.ribbonColor, this.imageUrl});

  final Color medalColor;
  final Color ribbonColor;
  final String? imageUrl;

  @override
  Widget build(BuildContext context) {
    final hasImage = imageUrl != null && imageUrl!.trim().isNotEmpty;

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
              color: hasImage ? Colors.white : medalColor,
              border: Border.all(color: const Color(0xFF876E2C), width: 2),
            ),
            child: hasImage
                ? ClipOval(
                    child: Image.network(
                      imageUrl!,
                      fit: BoxFit.cover,
                      errorBuilder: (_, _, _) => const Icon(
                        Icons.star_rounded,
                        color: Color(0xFFFFF6C7),
                        size: 40,
                      ),
                    ),
                  )
                : const Icon(
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
