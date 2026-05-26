import 'package:flutter/material.dart';

import '../../../core/sync_manager.dart';
import '../../../models/application_summary_model.dart';
import '../../../models/badge_model.dart';
import '../badges/my_badges_widgets.dart';

class ApplicationDetailColors {
  static const Color pageBackground = Color(0xFFF0F3F6);
  static const Color cardBackground = Color(0xFFFFFFFF);
  static const Color primaryText = Color(0xFF1D2A35);
  static const Color secondaryText = Color(0xFF5A6872);
  static const Color mutedText = Color(0xFF8A949D);
  static const Color primaryAction = Color(0xFF4E6CA2);
  static const Color divider = Color(0xFFE4E9EE);
  static const Color stepCompleted = Color(0xFF4E6CA2);
  static const Color stepCurrent = Color(0xFFC9A625);
  static const Color stepPending = Color(0xFFCDD4DB);
  static const Color stepRejected = Color(0xFFD94A2A);
  static const Color stepAccepted = Color(0xFF59C13E);
}

class ApplicationDetailHeader extends StatelessWidget {
  const ApplicationDetailHeader({
    super.key,
    required this.badge,
    required this.stateLabel,
    required this.stateColor,
  });

  final BadgeModel badge;
  final String stateLabel;
  final Color stateColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 20),
      decoration: const BoxDecoration(
        color: ApplicationDetailColors.cardBackground,
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(20)),
        boxShadow: [
          BoxShadow(
            color: Color(0x0E000000),
            blurRadius: 10,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        children: [
          BadgeMedalIcon(
            medalColor: badge.medalColor,
            ribbonColor: badge.ribbonColor,
          ),
          const SizedBox(height: 8),
          Text(
            badge.title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: ApplicationDetailColors.primaryText,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          if (badge.category.trim().isNotEmpty ||
              badge.level.trim().isNotEmpty) ...[
            const SizedBox(height: 6),
            Wrap(
              alignment: WrapAlignment.center,
              spacing: 14,
              runSpacing: 6,
              children: [
                if (badge.category.trim().isNotEmpty)
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.category_outlined,
                        size: 16,
                        color: ApplicationDetailColors.secondaryText,
                      ),
                      const SizedBox(width: 5),
                      Flexible(
                        child: Text(
                          badge.category,
                          style: const TextStyle(
                            color: ApplicationDetailColors.secondaryText,
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                if (badge.level.trim().isNotEmpty)
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.stairs_outlined,
                        size: 16,
                        color: ApplicationDetailColors.secondaryText,
                      ),
                      const SizedBox(width: 5),
                      Text(
                        badge.level,
                        style: const TextStyle(
                          color: ApplicationDetailColors.secondaryText,
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
              ],
            ),
          ],
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            decoration: BoxDecoration(
              color: stateColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: stateColor.withValues(alpha: 0.4),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: stateColor,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  stateLabel,
                  style: TextStyle(
                    color: stateColor,
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class ApplicationProgressStepper extends StatefulWidget {
  const ApplicationProgressStepper({
    super.key,
    required this.applicationState,
    this.rejectedByRole,
  });

  final String applicationState;
  final String? rejectedByRole;

  @override
  State<ApplicationProgressStepper> createState() =>
      _ApplicationProgressStepperState();
}

class _ApplicationProgressStepperState
    extends State<ApplicationProgressStepper> {
  final ScrollController _dotsController = ScrollController();
  final ScrollController _labelsController = ScrollController();
  bool _syncing = false;

  @override
  void initState() {
    super.initState();
    _dotsController.addListener(_syncLabelsFromDots);
    _labelsController.addListener(_syncDotsFromLabels);
  }

  void _syncLabelsFromDots() {
    if (_syncing) return;
    _syncing = true;
    if (_labelsController.hasClients) {
      _labelsController.jumpTo(_dotsController.offset);
    }
    _syncing = false;
  }

  void _syncDotsFromLabels() {
    if (_syncing) return;
    _syncing = true;
    if (_dotsController.hasClients) {
      _dotsController.jumpTo(_labelsController.offset);
    }
    _syncing = false;
  }

  @override
  void dispose() {
    _dotsController.removeListener(_syncLabelsFromDots);
    _labelsController.removeListener(_syncDotsFromLabels);
    _dotsController.dispose();
    _labelsController.dispose();
    super.dispose();
  }

  bool get _rejectedByTM {
    final role = (widget.rejectedByRole ?? '').toLowerCase();
    return role.contains('talent');
  }

  bool get _rejectedBySL {
    final role = (widget.rejectedByRole ?? '').toLowerCase();
    return role.contains('service') || role.contains('line');
  }

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    final applicationState = widget.applicationState;
    final normalized = applicationState.toLowerCase();

    final bool isAccepted = normalized.contains('accepted') ||
        normalized.contains('approved') ||
        normalized.contains('aprov');
    final bool isRejected = normalized.contains('reject') ||
        normalized.contains('rejeit') ||
        normalized.contains('devolv');
    final bool isInValidation = normalized.contains('validation') ||
        normalized.contains('valida');
    final bool isSubmitted = normalized.contains('submitted') ||
        normalized.contains('submet');

    int currentStep;
    if (isAccepted) {
      currentStep = 4;
    } else if (isRejected) {
      if (_rejectedByTM) {
        currentStep = 2;
      } else if (_rejectedBySL) {
        currentStep = 3;
      } else {
        currentStep = 3;
      }
    } else if (isInValidation) {
      currentStep = 3;
    } else if (isSubmitted) {
      currentStep = 2;
    } else {
      currentStep = 1;
    }

    String statusMessage;
    Color statusColor;
    IconData statusIcon;
    if (isAccepted) {
      statusMessage = 'Candidatura aprovada com sucesso!';
      statusColor = ApplicationDetailColors.stepAccepted;
      statusIcon = Icons.check_circle_rounded;
    } else if (isRejected) {
      if (_rejectedByTM) {
        statusMessage = tr.tr('rejectedByTM');
      } else {
        statusMessage = tr.tr('rejectedBySL');
      }
      statusColor = ApplicationDetailColors.stepRejected;
      statusIcon = Icons.cancel_rounded;
    } else if (isInValidation) {
      statusMessage = 'Em revisão pelo Service Line Leader';
      statusColor = ApplicationDetailColors.stepCurrent;
      statusIcon = Icons.hourglass_top_rounded;
    } else if (isSubmitted) {
      statusMessage = 'Em revisão pelo Talent Manager';
      statusColor = ApplicationDetailColors.stepCurrent;
      statusIcon = Icons.hourglass_top_rounded;
    } else {
      statusMessage = 'Candidatura em aberto';
      statusColor = ApplicationDetailColors.mutedText;
      statusIcon = Icons.edit_note_rounded;
    }

    final bool rejAtStep2 = isRejected && currentStep == 2;
    final bool rejAtStep3 = isRejected && currentStep == 3;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: ApplicationDetailColors.cardBackground,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Progresso',
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w700,
              color: ApplicationDetailColors.primaryText,
            ),
          ),
          const SizedBox(height: 16),
          SingleChildScrollView(
            controller: _dotsController,
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            child: ConstrainedBox(
              constraints: const BoxConstraints(minWidth: 400),
              child: IntrinsicWidth(
                child: Row(
                  children: [
                    _StepDot(
                      step: 1,
                      currentStep: currentStep,
                      isRejected: false,
                      isAccepted: false,
                      totalSteps: 4,
                    ),
                    Expanded(
                      child: _StepConnector(
                        isCompleted: currentStep >= 2,
                        isRejected: rejAtStep2,
                      ),
                    ),
                    _StepDot(
                      step: 2,
                      currentStep: currentStep,
                      isRejected: rejAtStep2,
                      isAccepted: false,
                      totalSteps: 4,
                    ),
                    Expanded(
                      child: _StepConnector(
                        isCompleted: currentStep >= 3 && !rejAtStep2,
                        isRejected: rejAtStep3,
                      ),
                    ),
                    _StepDot(
                      step: 3,
                      currentStep: rejAtStep2 ? 99 : currentStep,
                      isRejected: rejAtStep3,
                      isAccepted: false,
                      totalSteps: 4,
                    ),
                    Expanded(
                      child: _StepConnector(
                        isCompleted: isAccepted,
                        isRejected: false,
                      ),
                    ),
                    _StepDot(
                      step: 4,
                      currentStep: isAccepted ? 4 : 99,
                      isRejected: false,
                      isAccepted: isAccepted,
                      totalSteps: 4,
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 10),
          SingleChildScrollView(
            controller: _labelsController,
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            child: ConstrainedBox(
              constraints: const BoxConstraints(minWidth: 400),
              child: IntrinsicWidth(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _StepLabel(
                      text: 'Submetido',
                      isActive: currentStep >= 1,
                      isCurrent: currentStep == 1,
                    ),
                    _StepLabel(
                      text: 'Talent\nManager',
                      isActive: currentStep >= 2,
                      isCurrent: currentStep == 2 && !isRejected,
                      isRejected: rejAtStep2,
                    ),
                    _StepLabel(
                      text: 'Service\nLine',
                      isActive: currentStep >= 3 && !rejAtStep2,
                      isCurrent: currentStep == 3 && !isRejected,
                      isRejected: rejAtStep3,
                    ),
                    _StepLabel(
                      text: 'Aprovado',
                      isActive: isAccepted,
                      isCurrent: isAccepted,
                      isAccepted: isAccepted,
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 14),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: statusColor.withValues(alpha: 0.3)),
            ),
            child: Row(
              children: [
                Icon(statusIcon, size: 20, color: statusColor),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    statusMessage,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: statusColor,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StepDot extends StatelessWidget {
  const _StepDot({
    required this.step,
    required this.currentStep,
    required this.isRejected,
    required this.isAccepted,
    required this.totalSteps,
  });

  final int step;
  final int currentStep;
  final bool isRejected;
  final bool isAccepted;
  final int totalSteps;

  @override
  Widget build(BuildContext context) {
    final bool isCompleted = currentStep > step;
    final bool isCurrent = currentStep == step;
    final bool isFinalStep = step == totalSteps;

    Color bgColor;
    Color borderColor;
    Widget? child;

    if (isCurrent && isRejected) {
      bgColor = ApplicationDetailColors.stepRejected;
      borderColor = ApplicationDetailColors.stepRejected;
      child = const Icon(Icons.close, color: Colors.white, size: 18);
    } else if (isCurrent && isFinalStep && isAccepted) {
      bgColor = ApplicationDetailColors.stepAccepted;
      borderColor = ApplicationDetailColors.stepAccepted;
      child = const Icon(Icons.check, color: Colors.white, size: 18);
    } else if (isCompleted) {
      bgColor = ApplicationDetailColors.stepCompleted;
      borderColor = ApplicationDetailColors.stepCompleted;
      child = const Icon(Icons.check, color: Colors.white, size: 18);
    } else if (isCurrent) {
      bgColor = Colors.white;
      borderColor = ApplicationDetailColors.stepCurrent;
      child = Container(
        width: 12,
        height: 12,
        decoration: const BoxDecoration(
          color: ApplicationDetailColors.stepCurrent,
          shape: BoxShape.circle,
        ),
      );
    } else {
      bgColor = Colors.white;
      borderColor = ApplicationDetailColors.stepPending;
      child = null;
    }

    return Container(
      width: 34,
      height: 34,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: bgColor,
        border: Border.all(color: borderColor, width: 3),
      ),
      child: child != null ? Center(child: child) : null,
    );
  }
}

class _StepConnector extends StatelessWidget {
  const _StepConnector({
    required this.isCompleted,
    required this.isRejected,
  });

  final bool isCompleted;
  final bool isRejected;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 6,
      margin: const EdgeInsets.symmetric(horizontal: 4),
      decoration: BoxDecoration(
        color: isCompleted
            ? (isRejected
                ? ApplicationDetailColors.stepRejected
                : ApplicationDetailColors.stepCompleted)
            : ApplicationDetailColors.stepPending,
        borderRadius: BorderRadius.circular(3),
      ),
    );
  }
}

class _StepLabel extends StatelessWidget {
  const _StepLabel({
    required this.text,
    required this.isActive,
    required this.isCurrent,
    this.isRejected = false,
    this.isAccepted = false,
  });

  final String text;
  final bool isActive;
  final bool isCurrent;
  final bool isRejected;
  final bool isAccepted;

  @override
  Widget build(BuildContext context) {
    Color textColor;
    if (isCurrent && isRejected) {
      textColor = ApplicationDetailColors.stepRejected;
    } else if (isCurrent && isAccepted) {
      textColor = ApplicationDetailColors.stepAccepted;
    } else if (isCurrent) {
      textColor = ApplicationDetailColors.stepCurrent;
    } else if (isActive) {
      textColor = ApplicationDetailColors.stepCompleted;
    } else {
      textColor = ApplicationDetailColors.mutedText;
    }

    return SizedBox(
      width: 76,
      child: Text(
        text,
        textAlign: TextAlign.center,
        style: TextStyle(
          fontSize: 12,
          fontWeight: isCurrent ? FontWeight.w700 : FontWeight.w600,
          color: textColor,
        ),
        maxLines: 2,
        overflow: TextOverflow.ellipsis,
      ),
    );
  }
}

class ApplicationInfoSection extends StatelessWidget {
  const ApplicationInfoSection({
    super.key,
    required this.submittedAt,
    required this.openedAt,
    this.latestObservation,
  });

  final DateTime? submittedAt;
  final DateTime? openedAt;
  final String? latestObservation;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: ApplicationDetailColors.cardBackground,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Detalhes',
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w700,
              color: ApplicationDetailColors.primaryText,
            ),
          ),
          const SizedBox(height: 12),
          if (openedAt != null)
            _InfoRow(
              icon: Icons.folder_open_outlined,
              label: 'Aberta a',
              value: _formatDate(openedAt!),
            ),
          if (openedAt != null) const SizedBox(height: 10),
          if (submittedAt != null)
            _InfoRow(
              icon: Icons.send_outlined,
              label: 'Submetida a',
              value: _formatDate(submittedAt!),
            ),
          if (latestObservation != null &&
              latestObservation!.trim().isNotEmpty) ...[
            const SizedBox(height: 14),
            const Divider(
              color: ApplicationDetailColors.divider,
              height: 1,
            ),
            const SizedBox(height: 14),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(
                  Icons.comment_outlined,
                  size: 20,
                  color: ApplicationDetailColors.primaryAction,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Observacao',
                        style: TextStyle(
                          color: ApplicationDetailColors.mutedText,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        latestObservation!,
                        style: const TextStyle(
                          color: ApplicationDetailColors.primaryText,
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          height: 1.4,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ],
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
    final hour = date.hour.toString().padLeft(2, '0');
    final minute = date.minute.toString().padLeft(2, '0');
    return '$day/$month/$year  $hour:$minute';
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(
          icon,
          size: 20,
          color: ApplicationDetailColors.primaryAction,
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  color: ApplicationDetailColors.mutedText,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(
                  color: ApplicationDetailColors.primaryText,
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class ApplicationBadgeAttributes extends StatelessWidget {
  const ApplicationBadgeAttributes({
    super.key,
    required this.badge,
  });

  final BadgeModel badge;

  @override
  Widget build(BuildContext context) {
    final chips = <_AttributeChipData>[];

    if (badge.level.trim().isNotEmpty) {
      chips.add(_AttributeChipData(
        icon: Icons.trending_up_rounded,
        label: badge.level,
      ));
    }
    if (badge.points > 0) {
      chips.add(_AttributeChipData(
        icon: Icons.workspace_premium_outlined,
        label: '${badge.points} pts',
      ));
    }
    if (badge.duration.trim().isNotEmpty) {
      chips.add(_AttributeChipData(
        icon: Icons.schedule_outlined,
        label: badge.duration,
      ));
    }

    if (chips.isEmpty) return const SizedBox.shrink();

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: ApplicationDetailColors.cardBackground,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Informacao do badge',
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w700,
              color: ApplicationDetailColors.primaryText,
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: chips
                .map((c) => _AttributeChip(icon: c.icon, label: c.label))
                .toList(),
          ),
          if (badge.description.trim().isNotEmpty) ...[
            const SizedBox(height: 14),
            const Divider(
              color: ApplicationDetailColors.divider,
              height: 1,
            ),
            const SizedBox(height: 12),
            Text(
              badge.description,
              style: const TextStyle(
                color: ApplicationDetailColors.secondaryText,
                fontSize: 14,
                height: 1.45,
              ),
              maxLines: 5,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ],
      ),
    );
  }
}

class _AttributeChipData {
  const _AttributeChipData({required this.icon, required this.label});
  final IconData icon;
  final String label;
}

class _AttributeChip extends StatelessWidget {
  const _AttributeChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
      decoration: BoxDecoration(
        color: const Color(0xFFEDF1F5),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: ApplicationDetailColors.primaryAction),
          const SizedBox(width: 6),
          Text(
            label,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: ApplicationDetailColors.primaryText,
            ),
          ),
        ],
      ),
    );
  }
}

class ApplicationRequirementsList extends StatelessWidget {
  const ApplicationRequirementsList({
    super.key,
    required this.requirements,
    this.evidences = const [],
  });

  final List<BadgeRequirement> requirements;
  final List<EvidenceSummary> evidences;

  EvidenceSummary? _evidenceForRequirement(int? requirementId) {
    if (requirementId == null) return null;
    for (final e in evidences) {
      if (e.requirementId == requirementId) return e;
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    if (requirements.isEmpty) return const SizedBox.shrink();

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: ApplicationDetailColors.cardBackground,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Requisitos',
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w700,
              color: ApplicationDetailColors.primaryText,
            ),
          ),
          const SizedBox(height: 12),
          ...requirements.asMap().entries.map((entry) {
            final evidence = _evidenceForRequirement(entry.value.id);

            return Container(
              margin: EdgeInsets.only(
                bottom: entry.key < requirements.length - 1 ? 8 : 0,
              ),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF4F6F8),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 24,
                        height: 24,
                        decoration: BoxDecoration(
                          color: ApplicationDetailColors.primaryAction
                              .withValues(alpha: 0.12),
                          shape: BoxShape.circle,
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          '${entry.key + 1}',
                          style: const TextStyle(
                            color: ApplicationDetailColors.primaryAction,
                            fontWeight: FontWeight.w700,
                            fontSize: 12,
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          entry.value.text,
                          style: const TextStyle(
                            color: ApplicationDetailColors.primaryText,
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  if (evidence != null) ...[
                    const SizedBox(height: 8),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: ApplicationDetailColors.divider,
                        ),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.description_outlined,
                            size: 18,
                            color: ApplicationDetailColors.primaryAction,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              evidence.title,
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: ApplicationDetailColors.primaryText,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (evidence.fileType != null)
                            Padding(
                              padding: const EdgeInsets.only(left: 6),
                              child: Text(
                                evidence.fileType!
                                    .split('/')
                                    .last
                                    .toUpperCase(),
                                style: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: ApplicationDetailColors.mutedText,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}

class SuccessSubmissionDialog extends StatelessWidget {
  const SuccessSubmissionDialog({
    super.key,
    required this.onViewApplication,
    required this.onViewBadges,
  });

  final VoidCallback onViewApplication;
  final VoidCallback onViewBadges;

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      elevation: 8,
      backgroundColor: Colors.white,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 28, 24, 22),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: const BoxDecoration(
                color: Color(0xFFE2F5E9),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.check_circle_rounded,
                size: 38,
                color: Color(0xFF4AA170),
              ),
            ),
            const SizedBox(height: 18),
            const Text(
              'Candidatura submetida!',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: Color(0xFF1D2A35),
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'A sua candidatura foi submetida com sucesso e sera avaliada em breve.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: Color(0xFF6A737D),
                fontWeight: FontWeight.w500,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 22),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: onViewApplication,
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size.fromHeight(46),
                  backgroundColor: const Color(0xFF4E6CA2),
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  textStyle: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                child: const Text('Ver candidatura'),
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: onViewBadges,
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(46),
                  foregroundColor: const Color(0xFF4E6CA2),
                  side: const BorderSide(color: Color(0xFFCDD4DB)),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  textStyle: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                child: const Text('Ver badges'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
