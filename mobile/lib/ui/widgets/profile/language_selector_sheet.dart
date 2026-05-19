import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

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

const _languages = [
  LanguageOption(code: 'pt', label: 'Portugues', flag: '\u{1F1F5}\u{1F1F9}'),
  LanguageOption(code: 'es', label: 'Espanol', flag: '\u{1F1EA}\u{1F1F8}'),
  LanguageOption(code: 'en', label: 'English', flag: '\u{1F1EC}\u{1F1E7}'),
];

class LanguageSelectorSheet extends StatelessWidget {
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
  Widget build(BuildContext context) {
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
          const Text(
            'Selecionar idioma',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: Color(0xFF1E2932),
            ),
          ),
          const SizedBox(height: 16),
          ..._languages.map(
            (lang) => _LanguageTile(
              option: lang,
              isSelected: lang.code == currentCode,
              onTap: () {
                onSelected(lang.code);
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
                Text(
                  option.flag,
                  style: const TextStyle(fontSize: 24),
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
