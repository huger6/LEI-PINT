import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../constants/source_strings.dart';
import '../constants/source_strings_en.dart';
import '../constants/source_strings_es.dart';

/// SharedPreferences key under which the app's selected language code is stored
/// (kept in sync by LanguageController). Read here so push notifications can be
/// translated from a background isolate, without the LanguageController/Provider.
const String kAppLanguagePrefKey = 'app_language_code';

/// Translated push payload (the visible strings to display).
class TranslatedPush {
  const TranslatedPush({required this.title, required this.body});
  final String title;
  final String body;
}

Map<String, String> _dictForCode(String code) {
  switch (code) {
    case 'en':
      return sourceStringsEn;
    case 'es':
      return sourceStringsEs;
    default:
      return sourceStrings; // pt (source)
  }
}

Future<String> _currentLanguageCode() async {
  try {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(kAppLanguagePrefKey) ?? 'pt';
  } catch (_) {
    return 'pt';
  }
}

String _tr(Map<String, String> dict, String key) =>
    dict[key] ?? sourceStrings[key] ?? key;

/// Replaces `{{name}}` tokens with values from [meta], translating any value
/// that is itself a known key (mirrors the in-app notification rendering).
String _interpolate(String template, Map<String, dynamic> meta, Map<String, String> dict) {
  if (meta.isEmpty || !template.contains('{{')) return template;
  return template.replaceAllMapped(RegExp(r'\{\{(\w+)\}\}'), (match) {
    final value = meta[match.group(1)];
    if (value == null) return match.group(0)!;
    return _tr(dict, value.toString());
  });
}

/// Translates a push notification's title/body keys into the device's selected
/// language and interpolates the meta values. `metaJson` is the raw JSON string
/// from the push data payload (may be null/empty).
Future<TranslatedPush> translatePush({
  String? titleKey,
  String? bodyKey,
  String? metaJson,
}) async {
  final dict = _dictForCode(await _currentLanguageCode());

  Map<String, dynamic> meta = const {};
  if (metaJson != null && metaJson.isNotEmpty) {
    try {
      final decoded = jsonDecode(metaJson);
      if (decoded is Map) meta = Map<String, dynamic>.from(decoded);
    } catch (_) {}
  }

  final title = (titleKey != null && titleKey.isNotEmpty)
      ? _interpolate(_tr(dict, titleKey), meta, dict)
      : '';
  final body = (bodyKey != null && bodyKey.isNotEmpty)
      ? _interpolate(_tr(dict, bodyKey), meta, dict)
      : '';

  return TranslatedPush(title: title, body: body);
}
