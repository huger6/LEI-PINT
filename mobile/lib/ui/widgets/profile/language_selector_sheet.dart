import 'package:flutter/material.dart';

import '../../../core/services/translation_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/repositories/lang_repo.dart';
import '../../../injection_container.dart';
import '../../../models/lang_model.dart';
import '../shared/app_icon/app_icon.dart';
import '../shared/app_icon/app_icon_data.dart';

class LanguageOption {
  const LanguageOption({
    required this.code,
    required this.label,
    required this.flag,
    this.modelReady = false,
  });

  final String code;
  final String label;
  final String flag;
  final bool modelReady;

  LanguageOption copyWith({bool? modelReady}) => LanguageOption(
        code: code,
        label: label,
        flag: flag,
        modelReady: modelReady ?? this.modelReady,
      );
}

const _fallbackLanguages = [
  LanguageOption(
    code: 'pt',
    label: 'Português',
    flag: '\u{1F1F5}\u{1F1F9}',
    modelReady: true,
  ),
  LanguageOption(code: 'es', label: 'Español', flag: '\u{1F1EA}\u{1F1F8}'),
  LanguageOption(code: 'en', label: 'English', flag: '\u{1F1EC}\u{1F1E7}'),
];

String _flagForCode(String code) {
  final base = code.toLowerCase().split('-').first;
  switch (base) {
    case 'pt':
      return '\u{1F1F5}\u{1F1F9}';
    case 'es':
      return '\u{1F1EA}\u{1F1F8}';
    case 'en':
      return '\u{1F1EC}\u{1F1E7}';
    case 'fr':
      return '\u{1F1EB}\u{1F1F7}';
    case 'de':
      return '\u{1F1E9}\u{1F1EA}';
    case 'it':
      return '\u{1F1EE}\u{1F1F9}';
    default:
      return '\u{1F30D}';
  }
}

String _normalizeToAppCode(LanguageModel lang) {
  final code = lang.code.toLowerCase();
  if (code.contains('-')) return code.split('-').first;
  final numId = int.tryParse(code);
  if (numId != null) {
    switch (numId) {
      case 2:
        return 'en';
      case 3:
        return 'es';
      default:
        return 'pt';
    }
  }
  return code;
}

class LanguageSelectorSheet extends StatefulWidget {
  const LanguageSelectorSheet({
    super.key,
    required this.currentCode,
    required this.onSelected,
  });

  final String currentCode;
  final ValueChanged<String> onSelected;

  static Future<void> show(
    BuildContext context, {
    required String currentCode,
    required ValueChanged<String> onSelected,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => LanguageSelectorSheet(
        currentCode: currentCode,
        onSelected: onSelected,
      ),
    );
  }

  @override
  State<LanguageSelectorSheet> createState() => _LanguageSelectorSheetState();
}

class _LanguageSelectorSheetState extends State<LanguageSelectorSheet> {
  List<LanguageOption>? _loadedLanguages;
  String? _downloadingCode;

  @override
  void initState() {
    super.initState();
    _fetchLanguages();
  }

  Future<void> _fetchLanguages() async {
    try {
      final repo = getIt<LanguageRepository>();
      final languages = await repo.getAvailableLanguages();
      if (!mounted) return;

      final seen = <String>{};
      final loaded = <LanguageOption>[];
      for (final lang in languages) {
        final appCode = _normalizeToAppCode(lang);
        if (seen.add(appCode)) {
          loaded.add(LanguageOption(
            code: appCode,
            label: lang.name,
            flag: _flagForCode(lang.code),
          ));
        }
      }

      final existingCodes = loaded.map((l) => l.code).toSet();
      for (final fallback in _fallbackLanguages) {
        if (!existingCodes.contains(fallback.code)) {
          loaded.add(fallback);
        }
      }

      if (loaded.isNotEmpty) {
        await _checkModelStatus(loaded);
      }
    } catch (_) {}
  }

  Future<void> _checkModelStatus(List<LanguageOption> languages) async {
    final svc = getIt<TranslationService>();
    final updated = <LanguageOption>[];

    for (final lang in languages) {
      if (lang.code == TranslationService.sourceLang) {
        updated.add(lang.copyWith(modelReady: true));
      } else {
        final ready = await svc.isModelDownloaded(lang.code);
        updated.add(lang.copyWith(modelReady: ready));
      }
    }

    if (mounted) {
      setState(() => _loadedLanguages = updated);
    }
  }

  Future<void> _handleSelection(LanguageOption lang) async {
    if (lang.code == TranslationService.sourceLang || lang.modelReady) {
      widget.onSelected(lang.code);
      Navigator.pop(context);
      return;
    }

    setState(() => _downloadingCode = lang.code);

    final svc = getIt<TranslationService>();
    final success = await svc.downloadModel(lang.code);

    if (!mounted) return;

    if (success) {
      widget.onSelected(lang.code);
      Navigator.pop(context);
    } else {
      setState(() => _downloadingCode = null);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            LanguageScope.of(context).tr('modelDownloadFailed'),
          ),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final languages = _loadedLanguages ?? _fallbackLanguages;

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.outline.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            LanguageScope.of(context).tr('selectLanguageTitle'),
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: AppColors.onSurface,
            ),
          ),
          const SizedBox(height: 16),
          ...languages.map(
            (lang) => _LanguageTile(
              option: lang,
              isSelected: lang.code == widget.currentCode,
              isDownloading: _downloadingCode == lang.code,
              onTap: () => _handleSelection(lang),
            ),
          ),
        ],
      ),
    );
  }
}

class _LanguageTile extends StatelessWidget {
  const _LanguageTile({
    required this.option,
    required this.isSelected,
    required this.isDownloading,
    required this.onTap,
  });

  final LanguageOption option;
  final bool isSelected;
  final bool isDownloading;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: isSelected
            ? AppColors.primaryContainer.withValues(alpha: 0.4)
            : AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: isDownloading ? null : onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(
              children: [
                AppIcon(
                  AppIcons.language,
                  size: 24,
                  color: isSelected ? AppColors.secondary : AppColors.outline,
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Text(
                    option.label,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: isSelected
                          ? AppColors.secondary
                          : AppColors.onSurface,
                    ),
                  ),
                ),
                if (isDownloading)
                  const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.5,
                      color: AppColors.primary,
                    ),
                  )
                else if (isSelected)
                  const AppIcon(
                    AppIcons.checkCircle,
                    color: AppColors.primary,
                    size: 22,
                  )
                else if (!option.modelReady &&
                    option.code != TranslationService.sourceLang)
                  AppIcon(
                    AppIcons.download,
                    color: AppColors.outline,
                    size: 22,
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
