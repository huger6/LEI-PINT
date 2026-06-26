import 'package:flutter/material.dart';
import '../badges/badge_image.dart';

class EmailSignatureBadgeMedalIcon extends StatelessWidget {
  const EmailSignatureBadgeMedalIcon({
    super.key,
    required this.medalColor,
    required this.ribbonColor,
    this.imageUrl,
    this.size = 56,
  });

  final Color medalColor;
  final Color ribbonColor;

  /// The badge's actual (SVG) artwork; falls back to a generic badge icon.
  final String? imageUrl;
  final double size;

  @override
  Widget build(BuildContext context) {
    return BadgeImage(
      imageUrl: imageUrl,
      size: size,
      fallbackColor: medalColor,
    );
  }
}
