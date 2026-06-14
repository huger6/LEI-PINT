import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/routes/app_router.dart';
import '../../../presentation/state/auth_store.dart';
import '../../widgets/auth/email_confirmation_widgets.dart';
import '../../widgets/shared/auth_particle_background.dart';
import '../../widgets/shared/auth_content_card.dart';

class EmailConfirmationScreen extends StatelessWidget {
  const EmailConfirmationScreen({super.key, required this.email});

  final String email;

  @override
  Widget build(BuildContext context) {
    final authStore = context.read<AuthStore>();

    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          const AuthParticleBackground(),
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
              child: AuthContentCard(
                child: EmailConfirmationBody(
                  email: email,
                  onSendConfirmation: () =>
                      authStore.resendConfirmation(email),
                  onGoToLogin: () {
                    context.go(AppRouter.login);
                  },
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
