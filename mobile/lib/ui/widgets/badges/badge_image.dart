import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../shared/app_icon/app_icon.dart';
import '../shared/app_icon/app_icon_data.dart';

/// Renders a badge's artwork.
///
/// Badge artwork is stored as a `data:image/svg+xml` URI with URL-encoded SVG
/// markup. When the badge has no image it falls back to a generic badge icon.
class BadgeImage extends StatelessWidget {
  const BadgeImage({
    super.key,
    required this.imageUrl,
    this.size = 64,
    this.fallbackColor,
  });

  final String? imageUrl;
  final double size;

  /// Tint applied to the fallback `badge` icon (keeps per-badge identity).
  final Color? fallbackColor;

  @override
  Widget build(BuildContext context) {
    final raw = imageUrl?.trim() ?? '';
    if (raw.isEmpty) return _fallback();

    final svg = _extractSvg(raw);
    if (svg == null) return _fallback();

    return SvgPicture.string(
      svg,
      width: size,
      height: size,
      fit: BoxFit.contain,
    );
  }

  /// Decodes a `data:image/svg+xml,...` URI into raw SVG markup.
  /// Returns `null` when the format is unrecognised.
  static String? _extractSvg(String uri) {
    if (!uri.startsWith('data:image/svg+xml')) return null;

    final commaIndex = uri.indexOf(',');
    if (commaIndex == -1) return null;

    try {
      return Uri.decodeFull(uri.substring(commaIndex + 1));
    } catch (_) {
      return null;
    }
  }

  Widget _fallback() {
    return AppIcon(
      AppIcons.badge,
      size: size,
      color: fallbackColor ?? const Color(0xFF8CA0B2),
    );
  }
}
