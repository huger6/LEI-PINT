import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../shared/app_icon/app_icon.dart';
import '../shared/app_icon/app_icon_data.dart';

/// Renders a badge's artwork.
///
/// Badge artwork is vector-only (the web designer exports SVG and uploads are
/// restricted to SVG), so the real image is loaded with [SvgPicture.network].
/// When the badge has no image — or while it loads / fails to load — it falls
/// back to the same generic `badge` icon used by the web front-office, so the
/// app never shows placeholder/mock medals.
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
    final url = imageUrl?.trim() ?? '';
    if (url.isEmpty) return _fallback();

    return SvgPicture.network(
      url,
      width: size,
      height: size,
      fit: BoxFit.contain,
      // Shown while loading and if the request fails (e.g. offline).
      placeholderBuilder: (_) => _fallback(),
    );
  }

  Widget _fallback() {
    return AppIcon(
      AppIcons.badge,
      size: size,
      color: fallbackColor ?? const Color(0xFF8CA0B2),
    );
  }
}
