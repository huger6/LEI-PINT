import 'dart:ui';

import 'package:flutter/material.dart';

class AuthContentCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;

  const AuthContentCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.fromLTRB(20, 24, 20, 24),
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return ClipRRect(
      borderRadius: BorderRadius.circular(32),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: colorScheme.surface.withValues(alpha: 0.84),
            borderRadius: BorderRadius.circular(32),
            border: Border.all(
              color: colorScheme.primary.withValues(alpha: 0.16),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: colorScheme.secondary.withValues(alpha: 0.12),
                blurRadius: 36,
                offset: const Offset(0, 18),
              ),
            ],
          ),
          child: Padding(padding: padding, child: child),
        ),
      ),
    );
  }
}
