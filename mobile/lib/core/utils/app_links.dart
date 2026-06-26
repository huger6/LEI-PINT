import 'dart:io';

import 'package:flutter_dotenv/flutter_dotenv.dart';

/// Centralized resolver for public web (front-office) links of the badge
/// platform. Single source of truth so badge/verification URLs always point to
/// our own web app instead of an unrelated corporate page.
///
/// Resolution order for the base URL:
/// 1. `FRONTEND_URL` env entry (production / configured builds).
/// 2. Derived from `API_BASE_URL` by stripping the trailing `/api[/vN]` segment
///    (the web app and API are served from the same host in this project).
/// 3. Local dev fallback on the API host (`10.0.2.2` on Android emulator).
abstract final class AppLinks {
  /// Public web base URL, without a trailing slash. Never returns an external
  /// corporate domain.
  static String get frontendBaseUrl {
    final configured = dotenv.env['FRONTEND_URL']?.trim();
    if (configured != null && configured.isNotEmpty) {
      return _stripTrailingSlash(configured);
    }

    final apiBase = dotenv.env['API_BASE_URL']?.trim();
    if (apiBase != null && apiBase.isNotEmpty) {
      final stripped = _stripTrailingSlash(apiBase)
          .replaceAll(RegExp(r'/api(/v\d+)?$'), '');
      if (stripped.isNotEmpty) return stripped;
    }

    final host = Platform.isAndroid ? '10.0.2.2' : 'localhost';
    return 'http://$host:3000';
  }

  /// Public verification URL for an earned badge (`/verify/:link`).
  /// If [link] is already an absolute URL it is returned as-is.
  static String verificationUrl(String link) {
    final trimmed = link.trim();
    if (trimmed.isEmpty) return '';
    if (trimmed.startsWith('http')) return trimmed;
    return '$frontendBaseUrl/verify/$trimmed';
  }

  /// Public catalog page for a badge (`/softinsa/badges/:slug`).
  static String publicBadgeUrl(String slug) {
    final trimmed = slug.trim();
    if (trimmed.isEmpty) return '';
    return '$frontendBaseUrl/softinsa/badges/$trimmed';
  }

  static String _stripTrailingSlash(String url) =>
      url.endsWith('/') ? url.substring(0, url.length - 1) : url;
}
