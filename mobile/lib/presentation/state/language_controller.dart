import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class LanguageController extends ChangeNotifier {
  LanguageController();

  String _languageCode = 'pt';
  Map<String, dynamic> _localizedStrings = {};

  String get languageCode => _languageCode;

  Locale get locale => Locale(_languageCode);

  String get languageDatabaseId {
    switch (_languageCode) {
      case 'en':
        return '2';
      case 'es':
        return '3';
      case 'fr':
        return '4';
      case 'pt':
      default:
        return '1';
    }
  }

  Future<void> initialize() async {
    await _loadLanguageJson(_languageCode);
  }

  Future<void> setLanguageCode(String code) async {
    final normalizedCode = _normalizeCode(code);

    if (_languageCode == normalizedCode) {
      return;
    }

    _languageCode = normalizedCode;
    await _loadLanguageJson(_languageCode);
    notifyListeners();
  }

  Future<void> _loadLanguageJson(String code) async {
    try {
      final jsonString = await rootBundle.loadString(
        'assets/translations/$code.json',
      );
      _localizedStrings = json.decode(jsonString);
    } catch (e) {
      debugPrint('Failed to load translations for $code: $e');
      _localizedStrings = {};
    }
  }

  String tr(String key) {
    return _localizedStrings[key]?.toString() ?? key;
  }

  static String languageName(String code) {
    final normalized = _normalizeCode(code);
    switch (normalized) {
      case 'en':
        return 'English';
      case 'es':
        return 'Espanol';
      case 'fr':
        return 'Francais';
      case 'pt':
      default:
        return 'Portugues';
    }
  }

  static String _normalizeCode(String input) {
    switch (input.toLowerCase()) {
      case '2':
      case 'en':
        return 'en';
      case '3':
      case 'es':
        return 'es';
      case '4':
      case 'fr':
        return 'fr';
      case '1':
      case 'pt':
      default:
        return 'pt';
    }
  }
}

class LanguageScope extends InheritedNotifier<LanguageController> {
  const LanguageScope({
    super.key,
    required LanguageController controller,
    required super.child,
  }) : super(notifier: controller);

  static LanguageController of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<LanguageScope>();
    assert(scope != null, 'LanguageScope not found in widget tree.');
    return scope!.notifier!;
  }
}
