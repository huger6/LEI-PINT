import 'package:flutter/material.dart';

class EmailSignatureBadgeMedalIcon extends StatelessWidget {
  const EmailSignatureBadgeMedalIcon({
    super.key,
    required this.medalColor,
    required this.ribbonColor,
    this.size = 56,
  });

  final Color medalColor;
  final Color ribbonColor;
  final double size;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size * 1.2,
      child: Stack(
        alignment: Alignment.topCenter,
        children: [
          Positioned(
            top: size * 0.5,
            child: Row(
              children: [
                Icon(Icons.bookmark, color: ribbonColor, size: size * 0.35),
                const SizedBox(width: 2),
                Icon(Icons.bookmark, color: ribbonColor, size: size * 0.35),
              ],
            ),
          ),
          Container(
            width: size * 0.7,
            height: size * 0.7,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: medalColor,
              border: Border.all(color: const Color(0xFF876E2C), width: 1.5),
            ),
            child: Icon(
              Icons.star_rounded,
              color: const Color(0xFFFFF6C7),
              size: size * 0.4,
            ),
          ),
        ],
      ),
    );
  }
}
