import 'package:flutter/material.dart';

class AuthHeader extends StatelessWidget {
  final String title;
  final String? subtitle;
  final String? imagePath;

  const AuthHeader({
    Key? key,
    required this.title,
    this.subtitle,
    this.imagePath,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        if (imagePath != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 28),
            child: Container(
              width: 92,
              height: 92,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(
                  context,
                ).colorScheme.surface.withValues(alpha: 0.9),
                borderRadius: BorderRadius.circular(28),
                border: Border.all(
                  color: Theme.of(
                    context,
                  ).colorScheme.primary.withValues(alpha: 0.18),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Theme.of(
                      context,
                    ).colorScheme.primary.withValues(alpha: 0.12),
                    blurRadius: 24,
                    offset: const Offset(0, 12),
                  ),
                ],
              ),
              child: Image.asset(
                imagePath!,
                fit: BoxFit.contain,
                errorBuilder: (context, error, stackTrace) {
                  return Icon(
                    Icons.image_not_supported_outlined,
                    size: 40,
                    color: Theme.of(context).colorScheme.outline,
                  );
                },
              ),
            ),
          ),

        Text(
          title,
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.w700,
            letterSpacing: -0.4,
          ),
          textAlign: TextAlign.center,
        ),

        if (subtitle != null) ...[
          const SizedBox(height: 12),
          Text(
            subtitle!,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Theme.of(
                context,
              ).colorScheme.onSurface.withValues(alpha: 0.72),
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ],
    );
  }
}
