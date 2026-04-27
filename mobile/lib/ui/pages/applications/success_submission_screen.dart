import 'package:flutter/material.dart';

import '../../../core/routes/app_router.dart';
import '../../../models/badge_model.dart';
import '../../widgets/badges/attached_files_list.dart';
import 'application_status_page.dart';

class SuccessSubmissionScreen extends StatelessWidget {
  const SuccessSubmissionScreen({
    super.key,
    required this.badge,
    required this.attachedFiles,
    required this.confirmationEmail,
    required this.submittedAt,
    this.badgeType = 'Normal',
  });

  final BadgeModel badge;
  final List<AttachedDocument> attachedFiles;
  final String confirmationEmail;
  final DateTime submittedAt;
  final String badgeType;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _SuccessHeader(),
              Padding(
                padding: const EdgeInsets.fromLTRB(18, 16, 18, 22),
                child: Column(
                  children: [
                    _SummaryCard(
                      badgeTitle: badge.title,
                      badgeType: badgeType,
                      submittedAtLabel: _formatSubmittedDate(submittedAt),
                      confirmationEmail: confirmationEmail,
                    ),
                    const SizedBox(height: 14),
                    const _NextStepsCard(),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => CandidaturaStatusScreen(
                                badge: badge,
                                attachedFiles: attachedFiles,
                              ),
                            ),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          minimumSize: const Size.fromHeight(48),
                          backgroundColor: const Color(0xFF4E6CA2),
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          textStyle: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        child: const Text('Ver estado da candidatura'),
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton(
                        onPressed: () => _goBackToDashboard(context),
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size.fromHeight(46),
                          backgroundColor: Colors.white,
                          foregroundColor: const Color(0xFF505860),
                          side: const BorderSide(color: Color(0xFFD2D8DF)),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          textStyle: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        child: const Text('Voltar ao Menu'),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatSubmittedDate(DateTime date) {
    const months = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];

    final monthName = months[date.month - 1];
    return '${date.day} $monthName, ${date.year}';
  }

  void _goBackToDashboard(BuildContext context) {
    final navigator = Navigator.of(context);
    var foundDashboard = false;

    navigator.popUntil((route) {
      final isDashboard = route.settings.name == AppRouter.dashboard;
      if (isDashboard) {
        foundDashboard = true;
      }

      return isDashboard || route.isFirst;
    });

    if (!foundDashboard) {
      navigator.pushNamedAndRemoveUntil(AppRouter.dashboard, (route) => false);
    }
  }
}

class _SuccessHeader extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
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
            child: const Icon(
              Icons.check_circle_outline,
              size: 42,
              color: Color(0xFF4AA170),
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Candidatura submetida',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 40,
              fontWeight: FontWeight.w700,
              color: Color(0xFF20252B),
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'A sua candidatura foi recebida com sucesso!',
            textAlign: TextAlign.center,
            style: TextStyle(
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

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({
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
          _DetailRow(
            icon: Icons.sync_rounded,
            label: 'Tipo de Badge',
            value: badgeType,
          ),
          const SizedBox(height: 10),
          _DetailRow(
            icon: Icons.access_time_outlined,
            label: 'Submetida a',
            value: submittedAtLabel,
          ),
          const SizedBox(height: 10),
          _DetailRow(
            icon: Icons.mail_outline,
            label: 'Confirmação enviada para',
            value: confirmationEmail,
          ),
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({
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
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 2),
          child: Icon(icon, size: 24, color: const Color(0xFF2B3238)),
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

class _NextStepsCard extends StatelessWidget {
  const _NextStepsCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFD7DEE6)),
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Próximos passos',
            style: TextStyle(
              color: Color(0xFF21262C),
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
          ),
          SizedBox(height: 10),
          _StepItem(number: 1, text: 'Candidatura será avaliada'),
          SizedBox(height: 8),
          _StepItem(
            number: 2,
            text: 'Receberá um resultado em cerca de 5 dias',
          ),
        ],
      ),
    );
  }
}

class _StepItem extends StatelessWidget {
  const _StepItem({required this.number, required this.text});

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
