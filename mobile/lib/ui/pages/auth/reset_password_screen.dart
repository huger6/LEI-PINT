import 'package:flutter/material.dart';

import '../../widgets/auth/reset_password_widgets.dart';
import '../../widgets/shared/auth_particle_background.dart';
import '../../widgets/shared/auth_content_card.dart';

class ResetPasswordScreen extends StatelessWidget {
  const ResetPasswordScreen({super.key, required this.token});

  final String token;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          const AuthParticleBackground(),
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
              child: AuthContentCard(
                child: ResetPasswordBody(token: token),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
