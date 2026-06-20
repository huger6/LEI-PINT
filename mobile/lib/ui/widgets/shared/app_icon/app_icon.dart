import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

class AppIcon extends StatelessWidget {
  const AppIcon(
    this.svgData, {
    super.key,
    this.size = 24.0,
    this.color,
  });

  final String svgData;
  final double size;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final iconColor =
        color ?? IconTheme.of(context).color ?? const Color(0xFF000000);
    final svgSize = size * 0.82;
    return SizedBox(
      width: size,
      height: size,
      child: Center(
        child: SvgPicture.string(
          svgData,
          width: svgSize,
          height: svgSize,
          colorFilter: ColorFilter.mode(iconColor, BlendMode.srcIn),
        ),
      ),
    );
  }
}
