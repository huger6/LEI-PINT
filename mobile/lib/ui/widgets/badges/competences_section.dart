import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../models/skill_model.dart';
import '../../../presentation/state/language_controller.dart';

class CompetencesSection extends StatelessWidget {
  const CompetencesSection({
    super.key,
    required this.skills,
    required this.title,
  });

  final List<SkillModel> skills;
  final String title;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
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
          Row(
            children: [
              Icon(
                Icons.verified_rounded,
                size: 20,
                color: AppColors.secondary,
              ),
              const SizedBox(width: 8),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF1A1F25),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Builder(builder: (context) {
            final tr = LanguageScope.of(context);
            final countLabel = skills.length == 1
                ? tr.tr('competenceCount_one')
                : tr.tr('competenceCount_other');
            return Text(
              '${skills.length} $countLabel',
              style: const TextStyle(
                fontSize: 13,
                color: Color(0xFF7A8894),
                fontWeight: FontWeight.w500,
              ),
            );
          }),
          const SizedBox(height: 14),
          ...skills.asMap().entries.map((entry) {
            final skill = entry.value;
            final isLast = entry.key == skills.length - 1;
            return _CompetenceCard(skill: skill, isLast: isLast);
          }),
        ],
      ),
    );
  }
}

class _CompetenceCard extends StatefulWidget {
  const _CompetenceCard({required this.skill, required this.isLast});

  final SkillModel skill;
  final bool isLast;

  @override
  State<_CompetenceCard> createState() => _CompetenceCardState();
}

class _CompetenceCardState extends State<_CompetenceCard> {
  bool _expanded = false;

  bool get _hasDescription =>
      widget.skill.description != null &&
      widget.skill.description!.trim().isNotEmpty;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: widget.isLast ? 0 : 10),
      child: Material(
        color: const Color(0xFFF5F8FB),
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          onTap: _hasDescription
              ? () => setState(() => _expanded = !_expanded)
              : null,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 34,
                      height: 34,
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(
                        Icons.psychology_rounded,
                        size: 18,
                        color: AppColors.secondary,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        widget.skill.name,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF1E2932),
                        ),
                      ),
                    ),
                    if (_hasDescription)
                      AnimatedRotation(
                        turns: _expanded ? 0.5 : 0,
                        duration: const Duration(milliseconds: 200),
                        child: Icon(
                          Icons.expand_more_rounded,
                          size: 22,
                          color: const Color(0xFF7A8894),
                        ),
                      ),
                  ],
                ),
                AnimatedCrossFade(
                  firstChild: const SizedBox.shrink(),
                  secondChild: Padding(
                    padding: const EdgeInsets.only(top: 10, left: 46),
                    child: Text(
                      widget.skill.description ?? '',
                      style: const TextStyle(
                        fontSize: 13.5,
                        color: Color(0xFF46535E),
                        height: 1.5,
                      ),
                    ),
                  ),
                  crossFadeState: _expanded
                      ? CrossFadeState.showSecond
                      : CrossFadeState.showFirst,
                  duration: const Duration(milliseconds: 200),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
