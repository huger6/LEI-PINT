import 'package:flutter/material.dart';

import '../../../core/sync_manager.dart';

class PasswordStrengthIndicator extends StatelessWidget {
  const PasswordStrengthIndicator({
    super.key,
    required this.password,
  });

  final String password;

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    if (password.isEmpty) return const SizedBox.shrink();

    final pending = <String>[];

    if (password.length < 8) pending.add(tr.tr('pwReqMinChars'));
    if (!RegExp(r'[A-Z]').hasMatch(password)) pending.add(tr.tr('pwReqUppercase'));
    if (!RegExp(r'[a-z]').hasMatch(password)) pending.add(tr.tr('pwReqLowercase'));
    if (!RegExp(r'[0-9]').hasMatch(password)) pending.add(tr.tr('pwReqNumber'));
    if (!RegExp(r'[^a-zA-Z0-9]').hasMatch(password)) pending.add(tr.tr('pwReqSpecialChar'));

    if (pending.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.only(top: 6, bottom: 2),
      child: Text(
        pending.join(', '),
        style: const TextStyle(
          fontSize: 12,
          color: Color(0xFFB3261E),
          height: 1.3,
        ),
      ),
    );
  }
}
