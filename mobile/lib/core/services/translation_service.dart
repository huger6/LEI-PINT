import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:google_mlkit_translation/google_mlkit_translation.dart';

import '../../data/local/translation_cache_dao.dart';

class TranslationService {
  final TranslationCacheDao _cacheDao;

  TranslationService(this._cacheDao);

  static const String sourceLang = 'pt';

  final _modelManager = OnDeviceTranslatorModelManager();
  OnDeviceTranslator? _activeTranslator;
  String? _activeTargetLang;

  // Serializes model downloads and on-device translation so a background
  // pre-download (all languages at startup) never reconfigures the shared
  // translator while a foreground language switch is mid-translation.
  Future<void> _lock = Future.value();

  Future<T> _serialized<T>(Future<T> Function() action) {
    final completer = Completer<T>();
    _lock = _lock.then((_) async {
      try {
        completer.complete(await action());
      } catch (e, stackTrace) {
        completer.completeError(e, stackTrace);
      }
    });
    return completer.future;
  }

  static TranslateLanguage? _fromBcpCode(String code) {
    final lower = code.toLowerCase();
    for (final lang in TranslateLanguage.values) {
      if (lang.bcpCode == lower) return lang;
    }
    return null;
  }

  Future<bool> isModelDownloaded(String langCode) async {
    if (langCode == sourceLang) return true;
    final lang = _fromBcpCode(langCode);
    if (lang == null) return false;
    try {
      return await _modelManager.isModelDownloaded(lang.bcpCode);
    } catch (e) {
      debugPrint('TranslationService: isModelDownloaded check failed: $e');
      return false;
    }
  }

  /// Downloads the on-device model for [langCode] (and the source model it is
  /// paired with). [requireWifi] defaults to false so models can be made ready
  /// at app startup regardless of the active connection type.
  Future<bool> downloadModel(String langCode, {bool requireWifi = false}) async {
    if (langCode == sourceLang) return true;
    final lang = _fromBcpCode(langCode);
    if (lang == null) {
      debugPrint('TranslationService: Unsupported language code "$langCode"');
      return false;
    }
    try {
      final srcLang = _fromBcpCode(sourceLang)!;
      final srcReady = await _modelManager.isModelDownloaded(srcLang.bcpCode);
      if (!srcReady) {
        await _modelManager.downloadModel(
          srcLang.bcpCode,
          isWifiRequired: requireWifi,
        );
      }
      if (await _modelManager.isModelDownloaded(lang.bcpCode)) {
        return true;
      }
      return await _modelManager.downloadModel(
        lang.bcpCode,
        isWifiRequired: requireWifi,
      );
    } catch (e) {
      debugPrint(
        'TranslationService: Failed to download model for $langCode: $e',
      );
      return false;
    }
  }

  /// Ensures the on-device model for every code in [langCodes] is downloaded.
  /// Returns the set of codes that are ready after the call.
  Future<Set<String>> downloadAllModels(
    Iterable<String> langCodes, {
    bool requireWifi = false,
  }) async {
    final ready = <String>{};
    for (final code in langCodes) {
      if (code == sourceLang) {
        ready.add(code);
        continue;
      }
      final ok = await downloadModel(code, requireWifi: requireWifi);
      if (ok) ready.add(code);
    }
    return ready;
  }

  Future<Map<String, String>> translateBatch({
    required Map<String, String> sourceTexts,
    required String targetLang,
  }) async {
    if (targetLang == sourceLang) return Map.of(sourceTexts);

    final targetMlKit = _fromBcpCode(targetLang);
    if (targetMlKit == null) return Map.of(sourceTexts);

    final cached = await _cacheDao.getAll(targetLang);
    final result = Map<String, String>.from(cached);

    final missing = <String, String>{};
    for (final entry in sourceTexts.entries) {
      if (!result.containsKey(entry.key)) {
        missing[entry.key] = entry.value;
      }
    }

    if (missing.isEmpty) return result;

    return _serialized(() async {
      // Re-check the cache: a concurrent call (e.g. the startup pre-download)
      // may have filled some keys while this call waited behind the lock.
      result.addAll(await _cacheDao.getAll(targetLang));
      final stillMissing = <String, String>{};
      for (final entry in missing.entries) {
        if (!result.containsKey(entry.key)) {
          stillMissing[entry.key] = entry.value;
        }
      }
      if (stillMissing.isEmpty) return result;

      final downloaded = await isModelDownloaded(targetLang);
      if (!downloaded) {
        final success = await downloadModel(targetLang);
        if (!success) {
          for (final entry in stillMissing.entries) {
            result.putIfAbsent(entry.key, () => entry.value);
          }
          return result;
        }
      }

      if (_activeTranslator == null || _activeTargetLang != targetLang) {
        _activeTranslator?.close();
        _activeTranslator = OnDeviceTranslator(
          sourceLanguage: _fromBcpCode(sourceLang)!,
          targetLanguage: targetMlKit,
        );
        _activeTargetLang = targetLang;
      }

      final newTranslations = <String, String>{};
      for (final entry in stillMissing.entries) {
        try {
          final protectedText = _protectPlaceholders(entry.value);
          final translated =
              await _activeTranslator!.translateText(protectedText.text);
          final restored = protectedText.restore(translated);
          newTranslations[entry.key] = restored;
          result[entry.key] = restored;
        } catch (e) {
          debugPrint(
            'TranslationService: Failed to translate "${entry.key}": $e',
          );
          result[entry.key] = entry.value;
        }
      }

      if (newTranslations.isNotEmpty) {
        await _cacheDao.insertBatch(targetLang, newTranslations);
      }

      return result;
    });
  }

  Future<String> translateText({
    required String sourceText,
    required String targetLang,
    String namespace = 'dynamic',
  }) async {
    final trimmed = sourceText.trim();
    if (trimmed.isEmpty || targetLang == sourceLang) return sourceText;

    final cacheKey = '$namespace:${_stableHash(trimmed)}';
    final translations = await translateBatch(
      sourceTexts: {cacheKey: sourceText},
      targetLang: targetLang,
    );

    return translations[cacheKey] ?? sourceText;
  }

  Future<void> clearCache(String langCode) async {
    await _cacheDao.clearLang(langCode);
  }

  Future<void> clearAllCache() async {
    await _cacheDao.clearAll();
  }

  Future<void> deleteModel(String langCode) async {
    final lang = _fromBcpCode(langCode);
    if (lang == null) return;
    try {
      await _modelManager.deleteModel(lang.bcpCode);
      await clearCache(langCode);
    } catch (e) {
      debugPrint(
        'TranslationService: Failed to delete model for $langCode: $e',
      );
    }
  }

  void dispose() {
    _activeTranslator?.close();
    _activeTranslator = null;
  }

  _ProtectedText _protectPlaceholders(String text) {
    final placeholders = <String>[];
    final protected = text.replaceAllMapped(
      RegExp(r'\{[A-Za-z0-9_]+\}'),
      (match) {
        // Wrap each placeholder in a letters-only sentinel. The previous
        // '@@PH0@@' token relied on punctuation, which the on-device
        // translator reformats (adds spaces / drops the '@'), leaving visible
        // junk like "@@ PH0 @@" in the UI. A pure-letter token (no symbols,
        // no real words) is passed through untouched apart from casing, which
        // [_ProtectedText.restore] tolerates.
        final token = 'xqz${placeholders.length}zqx';
        placeholders.add(match.group(0)!);
        return token;
      },
    );

    return _ProtectedText(protected, placeholders);
  }

  String _stableHash(String text) {
    var hash = 0x811c9dc5;
    for (final unit in text.codeUnits) {
      hash ^= unit;
      hash = (hash * 0x01000193) & 0xffffffff;
    }
    return hash.toRadixString(16).padLeft(8, '0');
  }
}

class _ProtectedText {
  const _ProtectedText(this.text, this.placeholders);

  final String text;
  final List<String> placeholders;

  String restore(String translatedText) {
    var restored = translatedText;
    for (var i = 0; i < placeholders.length; i++) {
      // Case-insensitive and tolerant of any spaces the translator may have
      // introduced around the sentinel, so "Xqz0zqx" / "xqz 0 zqx" all map
      // back to the original "{placeholder}".
      final pattern = RegExp(
        'xqz\\s*$i\\s*zqx',
        caseSensitive: false,
      );
      restored = restored.replaceAll(pattern, placeholders[i]);
    }
    return restored;
  }
}
