import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/constants/source_strings.dart';
import '../../core/services/translation_service.dart';
import '../../data/local/lang_dao.dart';
import '../../models/lang_model.dart';

class LanguageController extends ChangeNotifier {
  final TranslationService _translationService;
  final LanguageDao _languageDao;

  LanguageController(this._translationService, this._languageDao);

  // The platform supports exactly these languages (CLAUDE.md: pt-PT, en-GB,
  // es-ES). `pt` is the source, so only `en` and `es` need on-device models.
  static const List<String> supportedTargetLanguages = ['en', 'es'];

  String _languageCode = 'pt';
  Map<String, String> _translatedStrings = {};
  List<LanguageModel> _availableLanguages = [];
  bool _isTranslating = false;
  bool _isPreparingLanguages = false;
  bool _languagesPrepared = false;

  String get languageCode => _languageCode;
  bool get isTranslating => _isTranslating;
  bool get isPreparingLanguages => _isPreparingLanguages;
  bool get languagesPrepared => _languagesPrepared;
  Locale get locale => Locale(_languageCode);
  List<LanguageModel> get availableLanguages => _availableLanguages;

  int get languageDatabaseId {
    for (final lang in _availableLanguages) {
      if (lang.code == _languageCode) return lang.id;
    }
    return _fallbackIdFromCode(_languageCode);
  }

  Future<void> initialize() async {
    await _ensureTranslationCacheVersion();
    _translatedStrings = Map.of(sourceStrings);
    await _refreshLanguageList();
  }

  Future<void> _ensureTranslationCacheVersion() async {
    final prefs = await SharedPreferences.getInstance();
    const versionKey = 'ui_source_strings_version';
    final cachedVersion = prefs.getInt(versionKey);
    if (cachedVersion == sourceStringsVersion) return;

    await _translationService.clearAllCache();
    await prefs.setInt(versionKey, sourceStringsVersion);
  }

  /// Downloads every supported language model and pre-translates the full set
  /// of source strings into the local cache, so any language can be selected
  /// instantly and works fully offline afterwards. Safe to call once at
  /// startup; it runs in the background and is idempotent.
  Future<void> prepareAllLanguages() async {
    if (_languagesPrepared || _isPreparingLanguages) return;
    _isPreparingLanguages = true;
    notifyListeners();

    try {
      await _refreshLanguageList();

      final targets = <String>{...supportedTargetLanguages};
      for (final lang in _availableLanguages) {
        final code = _normalizeCode(lang.code);
        if (code != TranslationService.sourceLang) {
          targets.add(code);
        }
      }

      for (final code in targets) {
        try {
          final ready = await _translationService.downloadModel(code);
          if (!ready) continue;
          // Warm the cache for the whole UI string set in this language.
          await _translationService.translateBatch(
            sourceTexts: sourceStrings,
            targetLang: code,
          );
        } catch (e) {
          debugPrint('LanguageController: prepare "$code" failed: $e');
        }
      }

      _languagesPrepared = true;
    } finally {
      _isPreparingLanguages = false;
      notifyListeners();
    }
  }

  Future<void> _refreshLanguageList() async {
    try {
      _availableLanguages = await _languageDao.getAll();
    } catch (e) {
      debugPrint('LanguageController: Failed to load languages from DB: $e');
    }
  }

  Future<void> setLanguageFromId(int? langId) async {
    if (langId == null) return;

    await _refreshLanguageList();

    String? code;
    for (final lang in _availableLanguages) {
      if (lang.id == langId) {
        code = lang.code;
        break;
      }
    }
    code ??= _fallbackCodeFromId(langId);

    await setLanguageCode(code);
  }

  Future<void> setLanguageCode(String code) async {
    final normalizedCode = _normalizeCode(code);

    if (_languageCode == normalizedCode) return;

    _languageCode = normalizedCode;

    if (normalizedCode == TranslationService.sourceLang) {
      _translatedStrings = Map.of(sourceStrings);
      _isTranslating = false;
      notifyListeners();
      return;
    }

    _isTranslating = true;
    notifyListeners();

    try {
      _translatedStrings = await _translationService.translateBatch(
        sourceTexts: sourceStrings,
        targetLang: normalizedCode,
      );
    } catch (e) {
      debugPrint('Translation failed, falling back to source: $e');
      _translatedStrings = Map.of(sourceStrings);
    }

    _isTranslating = false;
    notifyListeners();
  }

  String tr(String key) {
    return _translatedStrings[key] ?? sourceStrings[key] ?? key;
  }

  Future<String> translateText(String text, {String namespace = 'dynamic'}) {
    return _translationService.translateText(
      sourceText: text,
      targetLang: _languageCode,
      namespace: namespace,
    );
  }

  Future<bool> isModelDownloaded(String langCode) {
    return _translationService.isModelDownloaded(langCode);
  }

  Future<bool> downloadModel(String langCode) {
    return _translationService.downloadModel(langCode);
  }

  static String languageName(String code) {
    final normalized = _normalizeCode(code);
    switch (normalized) {
      case 'en':
        return 'English';
      case 'es':
        return 'Español';
      case 'fr':
        return 'Français';
      case 'de':
        return 'Deutsch';
      case 'it':
        return 'Italiano';
      case 'pt':
      default:
        return 'Português';
    }
  }

  static String _normalizeCode(String input) {
    final lower = input.toLowerCase().trim();
    if (lower.contains('-')) return lower.split('-').first;
    final numId = int.tryParse(lower);
    if (numId != null) return _fallbackCodeFromId(numId);
    return lower;
  }

  static String _fallbackCodeFromId(int id) {
    switch (id) {
      case 2:
        return 'en';
      case 3:
        return 'es';
      default:
        return 'pt';
    }
  }

  static int _fallbackIdFromCode(String code) {
    switch (code) {
      case 'en':
        return 2;
      case 'es':
        return 3;
      default:
        return 1;
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
