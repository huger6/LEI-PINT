import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../presentation/state/language_controller.dart';

/// Smallest and largest goal deadlines the user can pick, in months.
const int _minGoalMonths = 1;
const int _maxGoalMonths = 12;

/// Computes a goal's end date by adding [months] to [start], preserving the
/// time of day. Kept as a free function so pages stay free of date-math logic.
DateTime goalEndDateFromMonths(DateTime start, int months) {
  return DateTime(
    start.year,
    start.month + months,
    start.day,
    start.hour,
    start.minute,
    start.second,
  );
}

/// Presents the deadline picker and resolves with the chosen number of months
/// (1–12), or `null` when the user dismisses the sheet without confirming.
Future<int?> showGoalDurationSheet(
  BuildContext context, {
  int initialMonths = 3,
}) {
  return showModalBottomSheet<int>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.surface,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (_) => _GoalDurationSheet(initialMonths: initialMonths),
  );
}

class _GoalDurationSheet extends StatefulWidget {
  const _GoalDurationSheet({required this.initialMonths});

  final int initialMonths;

  @override
  State<_GoalDurationSheet> createState() => _GoalDurationSheetState();
}

class _GoalDurationSheetState extends State<_GoalDurationSheet> {
  late int _months =
      widget.initialMonths.clamp(_minGoalMonths, _maxGoalMonths);

  void _setMonths(int value) {
    setState(() => _months = value.clamp(_minGoalMonths, _maxGoalMonths));
  }

  String _formatDate(DateTime date) {
    final day = date.day.toString().padLeft(2, '0');
    final month = date.month.toString().padLeft(2, '0');
    return '$day/$month/${date.year}';
  }

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    final monthLabel =
        _months == 1 ? tr.tr('durationMonth') : tr.tr('durationMonths');
    final endDate = goalEndDateFromMonths(DateTime.now(), _months);

    return SafeArea(
      top: false,
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 10, 20, 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Center(
              child: Container(
                width: 46,
                height: 5,
                decoration: BoxDecoration(
                  color: const Color(0xFFD0D5DB),
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.calendar_month_rounded,
                    color: AppColors.secondary,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        tr.tr('goalDeadlineTitle'),
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: AppColors.titleDark,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        tr.tr('goalDeadlineSubtitle'),
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.bodyText,
                          height: 1.3,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),
            // Stepper: choose between 1 and 12 months.
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE2E7EC)),
              ),
              child: Row(
                children: [
                  _StepperButton(
                    icon: Icons.remove_rounded,
                    onTap: _months > _minGoalMonths
                        ? () => _setMonths(_months - 1)
                        : null,
                  ),
                  Expanded(
                    child: Column(
                      children: [
                        Text(
                          '$_months',
                          style: const TextStyle(
                            fontSize: 26,
                            fontWeight: FontWeight.w800,
                            color: AppColors.titleDark,
                          ),
                        ),
                        Text(
                          monthLabel,
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.bodyText,
                          ),
                        ),
                      ],
                    ),
                  ),
                  _StepperButton(
                    icon: Icons.add_rounded,
                    onTap: _months < _maxGoalMonths
                        ? () => _setMonths(_months + 1)
                        : null,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),
            // Slider gives quick access to the full 1–12 range.
            SliderTheme(
              data: SliderTheme.of(context).copyWith(
                activeTrackColor: AppColors.primary,
                thumbColor: AppColors.primary,
                inactiveTrackColor: AppColors.primary.withValues(alpha: 0.18),
                overlayColor: AppColors.primary.withValues(alpha: 0.12),
              ),
              child: Slider(
                value: _months.toDouble(),
                min: _minGoalMonths.toDouble(),
                max: _maxGoalMonths.toDouble(),
                divisions: _maxGoalMonths - _minGoalMonths,
                label: '$_months',
                onChanged: (value) => _setMonths(value.round()),
              ),
            ),
            const SizedBox(height: 6),
            // Live preview of the computed end date.
            Row(
              children: [
                const Icon(
                  Icons.event_available_rounded,
                  size: 18,
                  color: AppColors.secondary,
                ),
                const SizedBox(width: 8),
                Text(
                  tr.tr('goalDeadlinePreview').replaceAll(
                        '{date}',
                        _formatDate(endDate),
                      ),
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.detailRowText,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context, _months),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: AppColors.onPrimary,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  textStyle: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                child: Text(tr.tr('confirm')),
              ),
            ),
            const SizedBox(height: 6),
            SizedBox(
              width: double.infinity,
              height: 44,
              child: TextButton(
                onPressed: () => Navigator.pop(context),
                style: TextButton.styleFrom(
                  foregroundColor: AppColors.iconMuted,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Text(
                  tr.tr('cancel'),
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StepperButton extends StatelessWidget {
  const _StepperButton({required this.icon, this.onTap});

  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final enabled = onTap != null;
    return Material(
      color: enabled
          ? AppColors.primary.withValues(alpha: 0.12)
          : const Color(0xFFEDEFF2),
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: SizedBox(
          width: 46,
          height: 46,
          child: Icon(
            icon,
            color: enabled ? AppColors.secondary : const Color(0xFFB4BcC4),
            size: 24,
          ),
        ),
      ),
    );
  }
}
