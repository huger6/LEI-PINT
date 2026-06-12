import 'package:flutter/material.dart';

class NavLink extends StatelessWidget {
  final String text;
  final String linkText;
  final VoidCallback onPressed;

  const NavLink({
    super.key,
    required this.text,
    required this.linkText,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(text, style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(width: 4),
          GestureDetector(
            onTap: onPressed,
            child: Text(
              linkText,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.primary,
                fontWeight: FontWeight.w600,
                decoration: TextDecoration.underline,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
