import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../presentation/state/language_controller.dart';
import '../profile/language_selector_sheet.dart';
import '../shared/app_icon/app_icon.dart';
import '../shared/app_icon/app_icon_data.dart';

class AuthLanguageButton extends StatelessWidget {
  const AuthLanguageButton({super.key});

  @override
  Widget build(BuildContext context) {
    final langCtrl = LanguageScope.of(context);
    final code = langCtrl.languageCode.toUpperCase();

    return Material(
      color: Colors.white.withValues(alpha: 0.85),
      borderRadius: BorderRadius.circular(14),
      elevation: 2,
      shadowColor: Colors.black26,
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () => LanguageSelectorSheet.show(
          context,
          currentCode: langCtrl.languageCode,
          onSelected: (selectedCode) => langCtrl.setLanguageCode(selectedCode),
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const AppIcon(
                AppIcons.language,
                size: 18,
                color: AppColors.secondary,
              ),
              const SizedBox(width: 4),
              Text(
                code,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.secondary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
