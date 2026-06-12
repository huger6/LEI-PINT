import 'dart:math';

import 'package:flutter/material.dart';

class BadgeVisuals {
  static Color medalColor(String seed) {
    final hue = _seedToHue(seed, offset: 0);
    return HSLColor.fromAHSL(1, hue, 0.58, 0.64).toColor();
  }

  static Color ribbonColor(String seed) {
    final hue = _seedToHue(seed, offset: 67);
    return HSLColor.fromAHSL(1, hue, 0.72, 0.40).toColor();
  }

  static double _seedToHue(String seed, {required int offset}) {
    var hash = 0;
    for (final code in seed.codeUnits) {
      hash = (hash * 31 + code) & 0x7fffffff;
    }

    return (hash + offset) % 360;
  }

  static Color statusColor(String status) {
    final normalized = status.toLowerCase();
    if (normalized.contains('approved') || normalized.contains('aprov')) {
      return const Color(0xFF2E9E4D);
    }
    if (normalized.contains('reject') || normalized.contains('rejeit')) {
      return const Color(0xFFC5392E);
    }
    if (normalized.contains('submit') || normalized.contains('review')) {
      return const Color(0xFFC7A11D);
    }

    return const Color(0xFF4866A2);
  }

  static List<Color> chartPaletteForCount(int count) {
    if (count <= 0) {
      return const [];
    }

    final colors = <Color>[];
    for (var i = 0; i < count; i++) {
      final hue = (220 + i * (360 / max(1, count))) % 360;
      colors.add(HSLColor.fromAHSL(1, hue, 0.62, 0.56).toColor());
    }

    return colors;
  }
}
