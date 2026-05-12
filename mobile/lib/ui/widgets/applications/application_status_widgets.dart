import 'package:flutter/material.dart';

import '../../../core/sync_manager.dart';
import '../../../models/badge_model.dart';
import '../../widgets/badges/badge_attributes_table.dart';

class StatusProgressStepper extends StatelessWidget {
  const StatusProgressStepper({super.key});

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);

    return Column(
      children: [
        const Row(
          children: [
            StatusStepDot(isDone: true),
            Expanded(
              child: Divider(color: StatusColors.primaryAction, thickness: 6),
            ),
            StatusStepDot(isDone: true),
            Expanded(
              child: Divider(color: StatusColors.primaryAction, thickness: 6),
            ),
            StatusStepDot(isDone: false),
          ],
        ),
        const SizedBox(height: 6),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            StatusStepLabel(text: tr.tr('stepSubmitted'), isCurrent: false),
            StatusStepLabel(text: tr.tr('stepTm'), isCurrent: false),
            StatusStepLabel(
              text: tr.tr('stepServiceLineLeader'),
              isCurrent: true,
            ),
          ],
        ),
      ],
    );
  }
}

class StatusStepDot extends StatelessWidget {
  const StatusStepDot({super.key, required this.isDone});

  final bool isDone;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 30,
      height: 30,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: isDone ? StatusColors.primaryAction : Colors.transparent,
        border: Border.all(
          color: isDone ? StatusColors.stepRing : StatusColors.currentStep,
          width: 3,
        ),
      ),
      child: isDone
          ? const Icon(Icons.check, color: Colors.white, size: 18)
          : const SizedBox.shrink(),
    );
  }
}

class StatusStepLabel extends StatelessWidget {
  const StatusStepLabel({super.key, required this.text, required this.isCurrent});

  final String text;
  final bool isCurrent;

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: BoxConstraints(minWidth: isCurrent ? 120 : 84),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: isCurrent ? StatusColors.currentStep : StatusColors.primaryAction,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Text(
        text,
        textAlign: TextAlign.center,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 12,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class StatusInfoExpansion extends StatelessWidget {
  const StatusInfoExpansion({super.key, required this.attributes});

  final List<BadgeAttribute> attributes;

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);

    return Container(
      decoration: BoxDecoration(
        color: StatusColors.cardBackground,
        borderRadius: BorderRadius.circular(12),
      ),
      child: ExpansionTile(
        tilePadding: const EdgeInsets.symmetric(horizontal: 12),
        collapsedIconColor: StatusColors.secondaryText,
        iconColor: StatusColors.secondaryText,
        title: Text(
          tr.tr('badgeInfo'),
          style: const TextStyle(
            color: StatusColors.primaryText,
            fontWeight: FontWeight.w700,
            fontSize: 14,
          ),
        ),
        childrenPadding: const EdgeInsets.fromLTRB(14, 0, 14, 6),
        children: [BadgeAttributesTable(attributes: attributes)],
      ),
    );
  }
}

class StatusRequirementsExpansion extends StatelessWidget {
  const StatusRequirementsExpansion({super.key, required this.requirements});

  final List<BadgeRequirement> requirements;

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);

    return Container(
      decoration: BoxDecoration(
        color: StatusColors.cardBackground,
        borderRadius: BorderRadius.circular(12),
      ),
      child: ExpansionTile(
        tilePadding: const EdgeInsets.symmetric(horizontal: 12),
        collapsedIconColor: StatusColors.secondaryText,
        iconColor: StatusColors.secondaryText,
        title: Text(
          tr.tr('requirements'),
          style: const TextStyle(
            color: StatusColors.primaryText,
            fontWeight: FontWeight.w700,
            fontSize: 14,
          ),
        ),
        childrenPadding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
        children: requirements
            .asMap()
            .entries
            .map(
              (entry) => Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                decoration: BoxDecoration(
                  color: StatusColors.softPanel,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        '${entry.key + 1}. ${entry.value.text}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: StatusColors.primaryText,
                          fontSize: 13,
                        ),
                      ),
                    ),
                    const Icon(Icons.expand_more_rounded, size: 18),
                  ],
                ),
              ),
            )
            .toList(),
      ),
    );
  }
}

class StatusColors {
  static const Color pageBackground = Color(0xFFE0E6EB);
  static const Color cardBackground = Color(0xFFF6F7F9);
  static const Color softPanel = Color(0xFFDEE3E9);
  static const Color primaryText = Color(0xFF1E252B);
  static const Color secondaryText = Color(0xFF45505A);
  static const Color primaryAction = Color(0xFF4866A2);
  static const Color stepRing = Color(0xFFC9CFDA);
  static const Color currentStep = Color(0xFFC5A232);
  static const Color highlightText = Color(0xFFC6A12A);
}
