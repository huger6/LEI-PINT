import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../models/area_model.dart';
import '../../../presentation/state/language_controller.dart';
import '../shared/translated_text.dart';

/// Rounded, tappable area pill shared by both the selected-areas section and
/// the available-areas list. The visual state is driven by [selected] and
/// [isMain] so the same widget renders every variant.
class AreaSelectChip extends StatelessWidget {
  const AreaSelectChip({
    super.key,
    required this.label,
    required this.selected,
    required this.isMain,
    this.onTap,
  });

  final String label;
  final bool selected;
  final bool isMain;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final Color background;
    final Color foreground;
    final Color border;

    if (isMain) {
      background = AppColors.primary;
      foreground = AppColors.onPrimary;
      border = AppColors.primary;
    } else if (selected) {
      background = AppColors.primaryContainer;
      foreground = AppColors.onPrimaryContainer;
      border = AppColors.primary;
    } else {
      background = Colors.white;
      foreground = AppColors.onSurface;
      border = AppColors.outline.withValues(alpha: 0.5);
    }

    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(30),
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
          decoration: BoxDecoration(
            color: background,
            borderRadius: BorderRadius.circular(30),
            border: Border.all(
              color: border,
              width: selected || isMain ? 1.5 : 1,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (isMain) ...[
                Icon(Icons.star_rounded, size: 16, color: foreground),
                const SizedBox(width: 5),
              ] else if (selected) ...[
                Icon(Icons.check_rounded, size: 16, color: foreground),
                const SizedBox(width: 5),
              ],
              Flexible(
                child: TranslatedText(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: foreground,
                    fontWeight: selected || isMain
                        ? FontWeight.w700
                        : FontWeight.w500,
                    fontSize: 14,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Heading + supporting hint used to introduce each section of the screen.
class ChooseAreasSectionHeader extends StatelessWidget {
  const ChooseAreasSectionHeader({
    super.key,
    required this.title,
    required this.subtitle,
  });

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: Color(0xFF1E2932),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          subtitle,
          style: const TextStyle(
            fontSize: 13.5,
            color: Color(0xFF6E7A86),
            fontWeight: FontWeight.w500,
            height: 1.3,
          ),
        ),
      ],
    );
  }
}

/// Top section: the areas the consultant currently has selected. Tapping a
/// chip promotes it to the primary (main) area, which is highlighted.
class SelectedAreasSection extends StatelessWidget {
  const SelectedAreasSection({
    super.key,
    required this.selectedAreas,
    required this.mainAreaId,
    required this.onMainSelected,
  });

  /// Selected areas in selection order.
  final List<AreaModel> selectedAreas;
  final int? mainAreaId;
  final ValueChanged<int> onMainSelected;

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
            color: Color(0x13000000),
            blurRadius: 8,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ChooseAreasSectionHeader(
            title: tr.tr('chooseAreasMainSectionTitle'),
            subtitle: tr.tr('chooseAreasMainHint'),
          ),
          const SizedBox(height: 12),
          if (selectedAreas.isEmpty)
            Text(
              tr.tr('chooseAreasNoneSelected'),
              style: const TextStyle(
                color: Color(0xFF8B96A1),
                fontWeight: FontWeight.w600,
              ),
            )
          else
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: selectedAreas
                  .map(
                    (area) => AreaSelectChip(
                      label: area.name,
                      selected: true,
                      isMain: area.id == mainAreaId,
                      onTap: () => onMainSelected(area.id),
                    ),
                  )
                  .toList(),
            ),
        ],
      ),
    );
  }
}

/// Bottom section: every available area. Selected ones are highlighted and the
/// primary area carries a star. Tapping toggles membership.
class AvailableAreasSection extends StatelessWidget {
  const AvailableAreasSection({
    super.key,
    required this.allAreas,
    required this.selectedIds,
    required this.mainAreaId,
    required this.onToggle,
  });

  final List<AreaModel> allAreas;
  final Set<int> selectedIds;
  final int? mainAreaId;
  final ValueChanged<AreaModel> onToggle;

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
            color: Color(0x13000000),
            blurRadius: 8,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ChooseAreasSectionHeader(
            title: tr.tr('chooseAreasAvailableTitle'),
            subtitle: tr.tr('chooseAreasChooseHint'),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: allAreas
                .map(
                  (area) => AreaSelectChip(
                    label: area.name,
                    selected: selectedIds.contains(area.id),
                    isMain: area.id == mainAreaId,
                    onTap: () => onToggle(area),
                  ),
                )
                .toList(),
          ),
        ],
      ),
    );
  }
}

/// Full-width confirmation button shown at the bottom of the screen.
class ChooseAreasConfirmButton extends StatelessWidget {
  const ChooseAreasConfirmButton({
    super.key,
    required this.enabled,
    required this.loading,
    required this.onPressed,
  });

  final bool enabled;
  final bool loading;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);

    return SizedBox(
      width: double.infinity,
      height: 52,
      child: FilledButton(
        onPressed: enabled && !loading ? onPressed : null,
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: AppColors.onPrimary,
          disabledBackgroundColor: AppColors.primary.withValues(alpha: 0.4),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
        ),
        child: loading
            ? const SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(
                  strokeWidth: 2.4,
                  color: Colors.white,
                ),
              )
            : Text(tr.tr('chooseAreasConfirm')),
      ),
    );
  }
}
