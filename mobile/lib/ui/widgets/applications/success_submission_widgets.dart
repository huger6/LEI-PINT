import 'package:flutter/material.dart';

import '../../../core/sync_manager.dart';
import '../shared/app_icon/app_icon.dart';
import '../shared/app_icon/app_icon_data.dart';

class SuccessHeader extends StatelessWidget {
  const SuccessHeader({super.key});

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);

    return Container(
      color: const Color(0xFFE7F5ED),
      padding: const EdgeInsets.fromLTRB(20, 26, 20, 28),
      child: Column(
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: const BoxDecoration(
              color: Color(0xFFCCEDD8),
              shape: BoxShape.circle,
            ),
            child: const AppIcon(
              AppIcons.checkCircle,
              size: 42,
              color: Color(0xFF4AA170),
            ),
          ),
          const SizedBox(height: 16),
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              tr.tr('applicationSubmitted'),
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 40,
                fontWeight: FontWeight.w700,
                color: Color(0xFF20252B),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            tr.tr('applicationReceivedSuccess'),
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 16,
              color: Color(0xFF6A737D),
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

class SummaryCard extends StatelessWidget {
  const SummaryCard({
    super.key,
    required this.badgeTitle,
    required this.badgeType,
    required this.submittedAtLabel,
    required this.confirmationEmail,
  });

  final String badgeTitle;
  final String badgeType;
  final String submittedAtLabel;
  final String confirmationEmail;

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFE3E7EB),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
            decoration: BoxDecoration(
              color: const Color(0xFFD6DCE2),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Text(
              'Badge: $badgeTitle',
              style: const TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w500,
                color: Color(0xFF2A3139),
              ),
            ),
          ),
          const SizedBox(height: 16),
          DetailRow(
            icon: AppIcons.sync,
            label: tr.tr('badgeTypeLabel'),
            value: badgeType,
          ),
          const SizedBox(height: 10),
          DetailRow(
            icon: AppIcons.time,
            label: tr.tr('submittedAtLabel'),
            value: submittedAtLabel,
          ),
          const SizedBox(height: 10),
          DetailRow(
            icon: AppIcons.email,
            label: tr.tr('confirmationSentTo'),
            value: confirmationEmail,
          ),
        ],
      ),
    );
  }
}

class DetailRow extends StatelessWidget {
  const DetailRow({
    super.key,
    required this.icon,
    required this.label,
    required this.value,
  });

  final String icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 2),
          child: AppIcon(icon, size: 24, color: const Color(0xFF2B3238)),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  color: Color(0xFF7A8189),
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(
                  color: Color(0xFF222A31),
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class NextStepsCard extends StatelessWidget {
  const NextStepsCard({super.key});

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFD7DEE6)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            tr.tr('nextSteps'),
            style: const TextStyle(
              color: Color(0xFF21262C),
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 10),
          NextStepItem(number: 1, text: tr.tr('nextStepEvaluation')),
          const SizedBox(height: 8),
          NextStepItem(
            number: 2,
            text: tr.tr('nextStepResult'),
          ),
        ],
      ),
    );
  }
}

class NextStepItem extends StatelessWidget {
  const NextStepItem({super.key, required this.number, required this.text});

  final int number;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 24,
          height: 24,
          decoration: const BoxDecoration(
            color: Color(0xFFCDEDD8),
            shape: BoxShape.circle,
          ),
          alignment: Alignment.center,
          child: Text(
            '$number',
            style: const TextStyle(
              color: Color(0xFF4C946A),
              fontSize: 13,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              color: Color(0xFF44505C),
              fontSize: 16,
              height: 1.25,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ],
    );
  }
}
