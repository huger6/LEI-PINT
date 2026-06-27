import 'dart:math';

/// Partially masks an email address for display (e.g. "hu***o@gmail.com").
/// Mirrors the web's `hideEmail()` utility in `web/src/utils/utils.js`.
String maskEmail(String email) {
  final parts = email.split('@');
  if (parts.length != 2 || parts[0].isEmpty || parts[1].isEmpty) return '';

  final user = parts[0];
  final domain = parts[1];

  if (user.length <= 3) {
    final tail = user.length > 1 ? user.substring(user.length - 1) : '';
    return '${user[0]}***$tail@$domain';
  }

  final startLen = (user.length * 0.3).ceil();
  final endLen = max(1, (user.length * 0.1).ceil());

  final start = user.substring(0, startLen);
  final end = user.substring(user.length - endLen);

  return '$start***$end@$domain';
}
