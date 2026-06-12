import 'package:flutter/material.dart';

import '../../../core/routes/app_router.dart';
import '../../../core/sync_manager.dart';
import '../../../models/badge_model.dart';
import '../../widgets/badges/attached_files_list.dart';
import '../../widgets/applications/success_submission_widgets.dart';
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
    final tr = LanguageScope.of(context);

    return Scaffold(
      backgroundColor: Colors.grey[100],
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SuccessHeader(),
              Padding(
                padding: const EdgeInsets.fromLTRB(18, 16, 18, 22),
                child: Column(
                  children: [
                    SummaryCard(
                      badgeTitle: badge.title,
                      badgeType: badgeType,
                      submittedAtLabel: _formatSubmittedDate(submittedAt, tr),
                      confirmationEmail: confirmationEmail,
                    ),
                    const SizedBox(height: 14),
                    const NextStepsCard(),
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
                        child: Text(tr.tr('viewApplicationStatus')),
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
                        child: Text(tr.tr('backToMenu')),
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

  String _formatSubmittedDate(DateTime date, LanguageController tr) {
    final months = [
      tr.tr('monthJanuary'),
      tr.tr('monthFebruary'),
      tr.tr('monthMarch'),
      tr.tr('monthApril'),
      tr.tr('monthMay'),
      tr.tr('monthJune'),
      tr.tr('monthJuly'),
      tr.tr('monthAugust'),
      tr.tr('monthSeptember'),
      tr.tr('monthOctober'),
      tr.tr('monthNovember'),
      tr.tr('monthDecember'),
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
