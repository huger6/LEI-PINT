import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/repositories/lang_repo.dart';
import '../../../injection_container.dart';
import '../../../models/lang_model.dart';

class LanguageOption {
  const LanguageOption({
    required this.code,
    required this.label,
    required this.flag,
  });

  final String code;
  final String label;
  final String flag;
}

const _fallbackLanguages = [
  LanguageOption(code: 'pt', label: 'Português', flag: '\u{1F1F5}\u{1F1F9}'),
  LanguageOption(code: 'es', label: 'Español', flag: '\u{1F1EA}\u{1F1F8}'),
  LanguageOption(code: 'en', label: 'English', flag: '\u{1F1EC}\u{1F1E7}'),
];

String _flagForCode(String code) {
  final lower = code.toLowerCase();
  if (lower.startsWith('pt') || lower == '1') return '\u{1F1F5}\u{1F1F9}';
  if (lower.startsWith('es') || lower == '3') return '\u{1F1EA}\u{1F1F8}';
  if (lower.startsWith('en') || lower == '2') return '\u{1F1EC}\u{1F1E7}';
  return '\u{1F30D}';
}

String _normalizeToAppCode(LanguageModel lang) {
  final code = lang.code.toLowerCase();
  if (code == '1' || code.startsWith('pt')) return 'pt';
  if (code == '2' || code.startsWith('en')) return 'en';
  if (code == '3' || code.startsWith('es')) return 'es';
  return 'pt';
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
        setState(() {
          _loadedLanguages = loaded;
        });
      }
    } catch (_) {}
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
              color: const Color(0xFFCDD4DB),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            LanguageScope.of(context).tr('selectLanguageTitle'),
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: Color(0xFF1E2932),
            ),
          ),
          const SizedBox(height: 16),
          ...languages.map(
            (lang) => _LanguageTile(
              option: lang,
              isSelected: lang.code == widget.currentCode,
              onTap: () {
                widget.onSelected(lang.code);
                Navigator.pop(context);
              },
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
    required this.onTap,
  });

  final LanguageOption option;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: isSelected
            ? AppColors.primaryContainer.withValues(alpha: 0.4)
            : Colors.grey[50],
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(
              children: [
                Icon(
                  Icons.language_rounded,
                  size: 24,
                  color: isSelected
                      ? AppColors.secondary
                      : const Color(0xFF5A6774),
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
                          : const Color(0xFF2A3540),
                    ),
                  ),
                ),
                if (isSelected)
                  const Icon(
                    Icons.check_circle_rounded,
                    color: AppColors.primary,
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
