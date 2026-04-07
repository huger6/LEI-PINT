import 'dart:ui';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';

import 'app_strings.dart';

abstract class LanguagePreferenceSource {
  Future<String?> loadPreferredLanguageCode();

  Future<void> savePreferredLanguageCode(String code);
}

class InMemoryLanguagePreferenceSource implements LanguagePreferenceSource {
  String? _languageCode;

  @override
  Future<String?> loadPreferredLanguageCode() async => _languageCode;

  @override
  Future<void> savePreferredLanguageCode(String code) async {
    _languageCode = code;
  }
}

class LanguageController extends ChangeNotifier {
  LanguageController({LanguagePreferenceSource? preferenceSource})
    : _preferenceSource = preferenceSource ?? InMemoryLanguagePreferenceSource();

  final LanguagePreferenceSource _preferenceSource;

  String _languageCode = AppStrings.defaultLanguageCode;

  String get languageCode => _languageCode;

  Locale get locale => AppStrings.localeForCode(_languageCode);

  Future<void> initialize() async {
    final loaded = await _preferenceSource.loadPreferredLanguageCode();
    if (loaded != null && AppStrings.supportedLanguageCodes.contains(loaded)) {
      _languageCode = loaded;
      notifyListeners();
    }
  }

  Future<void> setLanguageCode(String code) async {
    if (!AppStrings.supportedLanguageCodes.contains(code) || _languageCode == code) {
      return;
    }

    _languageCode = code;
    await _preferenceSource.savePreferredLanguageCode(code);
    notifyListeners();
  }

  String tr(String key) => AppStrings.translate(_languageCode, key);
}

class LanguageScope extends InheritedNotifier<LanguageController> {
  const LanguageScope({
    super.key,
    required LanguageController controller,
    required super.child,
  }) : super(notifier: controller);

  static LanguageController of(BuildContext context) {
    final scope =
        context.dependOnInheritedWidgetOfExactType<LanguageScope>();
    assert(scope != null, 'LanguageScope not found in widget tree.');
    return scope!.notifier!;
  }
}
