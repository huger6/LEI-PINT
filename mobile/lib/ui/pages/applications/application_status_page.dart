import 'package:flutter/material.dart';

import '../models/badge_model.dart';
import '../utils/badge_catalog.dart';
import '../widgets/app_bottom_nav_bar.dart';
import '../widgets/badge/attached_files_list.dart';
import '../widgets/badge/badge_attributes_table.dart';
import '../widgets/dashboard/recommended_badge_card.dart';
import 'badge_detail_screen.dart';

class CandidaturaStatusScreen extends StatelessWidget {
  const CandidaturaStatusScreen({
    super.key,
    required this.badge,
    required this.attachedFiles,
  });

  final BadgeModel badge;
  final List<AttachedDocument> attachedFiles;

  @override
  Widget build(BuildContext context) {
    final similarBadges = BadgeCatalog.all
        .where((item) => item.title != badge.title)
        .take(3)
        .toList();

    return Scaffold(
      backgroundColor: _StatusColors.pageBackground,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(10, 10, 10, 18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 6,
                  vertical: 10,
                ),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.arrow_back, size: 24),
                    ),
                    const SizedBox(width: 6),
                    const Expanded(
                      child: Text(
                        'Estado da candidatura',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w600,
                          color: _StatusColors.primaryText,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
                decoration: BoxDecoration(
                  color: _StatusColors.cardBackground,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Column(
                  children: [
                    const Text(
                      'Candidatura ao badge “PHP Advanced”',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: _StatusColors.primaryText,
                      ),
                    ),
                    const SizedBox(height: 12),
                    const _ProgressStepper(),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'Últimas atualizações',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: _StatusColors.primaryText,
                ),
              ),
              const SizedBox(height: 10),
              const Row(
                children: [
                  Icon(
                    Icons.sync_alt_rounded,
                    color: _StatusColors.primaryAction,
                    size: 18,
                  ),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Em revisão pelo Service Line Leader',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: _StatusColors.highlightText,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              const Row(
                children: [
                  Icon(
                    Icons.history_toggle_off_rounded,
                    color: _StatusColors.primaryAction,
                    size: 18,
                  ),
                  SizedBox(width: 8),
                  Text(
                    '01/11/2025 às 17:23',
                    style: TextStyle(
                      fontSize: 14,
                      color: _StatusColors.secondaryText,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const Text(
                'Observações',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: _StatusColors.primaryText,
                ),
              ),
              const SizedBox(height: 6),
              const Text.rich(
                TextSpan(
                  style: TextStyle(
                    color: _StatusColors.primaryText,
                    fontSize: 14,
                    height: 1.35,
                  ),
                  children: [
                    TextSpan(
                      text: 'Talent Manager: ',
                      style: TextStyle(fontWeight: FontWeight.w700),
                    ),
                    TextSpan(
                      text:
                          'Lorem ipsum dolor sit amet consectetur, adipisicing elit. Non, amet incidunt laboriosam dolorem molestias harum voluptatibus, accusantium iusto molestiae dolore! Debitis, deleniti officia dicta amet voluptates accusamus placeat blanditiis.',
                      style: TextStyle(fontStyle: FontStyle.italic),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              _InfoExpansion(attributes: badge.attributes),
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: _StatusColors.cardBackground,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Ficheiros anexados',
                      style: TextStyle(
                        color: _StatusColors.primaryText,
                        fontWeight: FontWeight.w700,
                        fontSize: 15,
                      ),
                    ),
                    const SizedBox(height: 8),
                    AttachedFilesList(files: attachedFiles, readOnly: true),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              _RequirementsExpansion(requirements: badge.requirements),
              const SizedBox(height: 12),
              const Text(
                'Badges semelhantes',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: _StatusColors.primaryText,
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                height: 192,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: similarBadges.length,
                  itemBuilder: (context, index) {
                    final item = similarBadges[index];

                    return RecommendedBadgeCard(
                      title: item.title,
                      area: item.category,
                      medalColor: item.medalColor,
                      ribbonColor: item.ribbonColor,
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => BadgeDetailScreen(badge: item),
                          ),
                        );
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: const AppBottomNavBar(currentTab: AppTab.badges),
    );
  }
}

class _ProgressStepper extends StatelessWidget {
  const _ProgressStepper();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const Row(
          children: [
            _StepDot(isDone: true),
            Expanded(
              child: Divider(color: _StatusColors.primaryAction, thickness: 6),
            ),
            _StepDot(isDone: true),
            Expanded(
              child: Divider(color: _StatusColors.primaryAction, thickness: 6),
            ),
            _StepDot(isDone: false),
          ],
        ),
        const SizedBox(height: 6),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: const [
            _StepLabel(text: 'Enviado', isCurrent: false),
            _StepLabel(text: 'TM', isCurrent: false),
            _StepLabel(text: 'Service Line Leader', isCurrent: true),
          ],
        ),
      ],
    );
  }
}

class _StepDot extends StatelessWidget {
  const _StepDot({required this.isDone});

  final bool isDone;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 30,
      height: 30,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: isDone ? _StatusColors.primaryAction : Colors.transparent,
        border: Border.all(
          color: isDone ? _StatusColors.stepRing : _StatusColors.currentStep,
          width: 3,
        ),
      ),
      child: isDone
          ? const Icon(Icons.check, color: Colors.white, size: 18)
          : const SizedBox.shrink(),
    );
  }
}

class _StepLabel extends StatelessWidget {
  const _StepLabel({required this.text, required this.isCurrent});

  final String text;
  final bool isCurrent;

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: BoxConstraints(minWidth: isCurrent ? 120 : 84),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: isCurrent
            ? _StatusColors.currentStep
            : _StatusColors.primaryAction,
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

class _InfoExpansion extends StatelessWidget {
  const _InfoExpansion({required this.attributes});

  final List<BadgeAttribute> attributes;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: _StatusColors.cardBackground,
        borderRadius: BorderRadius.circular(12),
      ),
      child: ExpansionTile(
        tilePadding: const EdgeInsets.symmetric(horizontal: 12),
        collapsedIconColor: _StatusColors.secondaryText,
        iconColor: _StatusColors.secondaryText,
        title: const Text(
          'Informações sobre o badge',
          style: TextStyle(
            color: _StatusColors.primaryText,
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

class _RequirementsExpansion extends StatelessWidget {
  const _RequirementsExpansion({required this.requirements});

  final List<BadgeRequirement> requirements;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: _StatusColors.cardBackground,
        borderRadius: BorderRadius.circular(12),
      ),
      child: ExpansionTile(
        tilePadding: const EdgeInsets.symmetric(horizontal: 12),
        collapsedIconColor: _StatusColors.secondaryText,
        iconColor: _StatusColors.secondaryText,
        title: const Text(
          'Requisitos',
          style: TextStyle(
            color: _StatusColors.primaryText,
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
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 10,
                ),
                decoration: BoxDecoration(
                  color: _StatusColors.softPanel,
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
                          color: _StatusColors.primaryText,
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

class _StatusColors {
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
