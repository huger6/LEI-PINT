import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/routes/app_router.dart';
import '../../../models/application_summary_model.dart';
import '../../../presentation/state/applications_store.dart';
import '../../widgets/applications/badge_email_confirmation_widgets.dart';
import 'application_detail_screen.dart';

class BadgeEmailConfirmationScreen extends StatelessWidget {
  const BadgeEmailConfirmationScreen({
    super.key,
    required this.application,
    required this.userEmail,
  });

  final ApplicationSummaryModel application;
  final String userEmail;

  @override
  Widget build(BuildContext context) {
    final appStore = context.read<ApplicationsStore>();

    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        backgroundColor: Colors.grey[100],
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        automaticallyImplyLeading: false,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x18000000),
                  blurRadius: 12,
                  offset: Offset(0, 4),
                ),
              ],
            ),
            child: BadgeEmailConfirmationBody(
              badgeTitle: application.badge?.title ?? 'Badge',
              userEmail: userEmail,
              onSendConfirmation: () =>
                  appStore.resendBadgeConfirmation(application.applicationGuid),
              onViewApplication: () {
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(
                    builder: (_) =>
                        ApplicationDetailScreen(application: application),
                  ),
                );
              },
              onGoToDashboard: () => _goBackToDashboard(context),
            ),
          ),
        ),
      ),
    );
  }

  void _goBackToDashboard(BuildContext context) {
    final navigator = Navigator.of(context);
    var foundDashboard = false;

    navigator.popUntil((route) {
      final isDashboard = route.settings.name == AppRouter.dashboard;
      if (isDashboard) foundDashboard = true;
      return isDashboard || route.isFirst;
    });

    if (!foundDashboard) {
      navigator.pushNamedAndRemoveUntil(
        AppRouter.dashboard,
        (route) => false,
      );
    }
  }
}
