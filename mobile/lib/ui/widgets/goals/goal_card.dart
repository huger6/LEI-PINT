import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/badge_visuals.dart';
import '../../../models/goal_model.dart';
import '../../../presentation/state/language_controller.dart';
import '../shared/translated_text.dart';

class GoalCard extends StatelessWidget {
  const GoalCard({
    super.key,
    required this.goal,
    this.onDelete,
    this.onComplete,
    this.isDeleting = false,
    this.isCompleting = false,
  });

  final GoalModel goal;
  final VoidCallback? onDelete;
  final VoidCallback? onComplete;
  final bool isDeleting;
  final bool isCompleting;

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    final badge = goal.badge;
    final completed = goal.isCompleted;
    final badgeSeed = badge?.slug ?? badge?.title ?? goal.title;
    final medalColor = BadgeVisuals.medalColor(badgeSeed);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        border: completed
            ? Border.all(color: AppColors.success.withValues(alpha: 0.5), width: 1.4)
            : null,
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
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: completed
                      ? AppColors.success.withValues(alpha: 0.15)
                      : medalColor.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  completed ? Icons.check_circle_rounded : Icons.flag_rounded,
                  color: completed ? AppColors.success : medalColor,
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: TranslatedText(
                            goal.title,
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: completed
                                  ? const Color(0xFF6B7A88)
                                  : const Color(0xFF1E2932),
                              decoration: completed
                                  ? TextDecoration.lineThrough
                                  : null,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (completed)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppColors.success.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              tr.tr('completed'),
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: AppColors.success,
                              ),
                            ),
                          ),
                      ],
                    ),
                    if (goal.description.trim().isNotEmpty) ...[
                      const SizedBox(height: 4),
                      TranslatedText(
                        goal.description,
                        style: const TextStyle(
                          fontSize: 13,
                          color: Color(0xFF5B6773),
                          height: 1.3,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
          if (badge != null) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFF3F6F9),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.workspace_premium_outlined,
                    size: 16,
                    color: medalColor,
                  ),
                  const SizedBox(width: 6),
                  Flexible(
                    child: TranslatedText(
                      badge.title,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF3A4A57),
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  if (badge.points > 0) ...[
                    const SizedBox(width: 8),
                    Text(
                      '${badge.points} pts',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: medalColor,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
          if (goal.endDate != null && !completed) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.schedule_rounded, size: 14, color: Color(0xFF7B8A96)),
                const SizedBox(width: 4),
                Text(
                  'Prazo: ${_formatDate(goal.endDate!)}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF7B8A96),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ],
          if (!completed && (onComplete != null || onDelete != null)) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                if (onComplete != null)
                  Expanded(
                    child: SizedBox(
                      height: 42,
                      child: ElevatedButton.icon(
                        onPressed: (isCompleting || isDeleting) ? null : onComplete,
                        icon: isCompleting
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Icon(Icons.check_circle_outline_rounded, size: 18),
                        label: Text(
                          isCompleting ? tr.tr('concluding') : tr.tr('confirmConclusion'),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: AppColors.onPrimary,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          textStyle: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  ),
                if (onComplete != null && onDelete != null)
                  const SizedBox(width: 10),
                if (onDelete != null)
                  SizedBox(
                    width: 48,
                    height: 42,
                    child: OutlinedButton(
                      onPressed: (isDeleting || isCompleting) ? null : onDelete,
                      style: OutlinedButton.styleFrom(
                        padding: EdgeInsets.zero,
                        foregroundColor: AppColors.error,
                        backgroundColor: AppColors.errorContainer.withValues(alpha: 0.45),
                        side: BorderSide(color: AppColors.error.withValues(alpha: 0.45)),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: isDeleting
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: AppColors.error,
                              ),
                            )
                          : const Icon(
                              Icons.delete_outline_rounded,
                              size: 20,
                              color: AppColors.error,
                            ),
                    ),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    final day = date.day.toString().padLeft(2, '0');
    final month = date.month.toString().padLeft(2, '0');
    final year = date.year;
    return '$day/$month/$year';
  }
}
