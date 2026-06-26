import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../presentation/state/language_controller.dart';
import '../shared/app_icon/app_icon.dart';
import '../shared/app_icon/app_icon_data.dart';

class TitleSelector extends StatelessWidget {
  const TitleSelector({
    super.key,
    required this.titles,
    required this.activeTitle,
    required this.onSelect,
    this.isSaving = false,
  });

  final List<String> titles;
  final String? activeTitle;
  final ValueChanged<String?> onSelect;
  final bool isSaving;

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [
          BoxShadow(
            color: Color(0x12000000),
            blurRadius: 8,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: const Color(0xFFF3E5F5),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const AppIcon(AppIcons.badgePremium,
                    size: 20, color: Color(0xFF7B1FA2)),
              ),
              const SizedBox(width: 10),
              Text(
                tr.tr('storeMyTitle'),
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppColors.titleDark,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            tr.tr('storeMyTitleHint'),
            style: const TextStyle(
              fontSize: 13,
              color: AppColors.bodyText,
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _TitleChip(
                label: tr.tr('storeNoTitle'),
                isActive: activeTitle == null,
                onTap: isSaving ? null : () => onSelect(null),
              ),
              ...titles.map(
                (title) => _TitleChip(
                  label: title,
                  isActive: activeTitle == title,
                  onTap: isSaving ? null : () => onSelect(title),
                  showIcon: true,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _TitleChip extends StatelessWidget {
  const _TitleChip({
    required this.label,
    required this.isActive,
    this.onTap,
    this.showIcon = false,
  });

  final String label;
  final bool isActive;
  final VoidCallback? onTap;
  final bool showIcon;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isActive ? const Color(0xFF7B1FA2) : const Color(0xFFF3E5F5),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (showIcon) ...[
              AppIcon(
                AppIcons.badgePremium,
                size: 14,
                color: isActive ? Colors.white : const Color(0xFF7B1FA2),
              ),
              const SizedBox(width: 6),
            ],
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: isActive ? Colors.white : const Color(0xFF7B1FA2),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
