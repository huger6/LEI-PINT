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
        // Logo
        if (imagePath != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 32),
            child: Image.asset(
              imagePath!,
              height: 60,
            ),
          ),

        // Título
        Text(
          title,
          style: Theme.of(context).textTheme.headlineLarge,
          textAlign: TextAlign.center,
        ),

        // Subtítulo
        if (subtitle != null) ...[
          const SizedBox(height: 12),
          Text(
            subtitle!,
            style: Theme.of(context).textTheme.bodyMedium,
            textAlign: TextAlign.center,
          ),
        ]
      ],
    );
  }
}
