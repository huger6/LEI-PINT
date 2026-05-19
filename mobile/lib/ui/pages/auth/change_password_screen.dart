import 'package:flutter/material.dart';

import '../../widgets/auth/change_password_widgets.dart';

class ChangePasswordScreen extends StatelessWidget {
  const ChangePasswordScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isFirstLogin =
        ModalRoute.of(context)?.settings.arguments as bool? ?? false;

    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: isFirstLogin
          ? null
          : AppBar(
              backgroundColor: Colors.grey[100],
              elevation: 0,
              surfaceTintColor: Colors.transparent,
              leading: IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(
                  Icons.arrow_back,
                  color: Color(0xFF20252B),
                  size: 26,
                ),
              ),
              title: const Text(
                'Alterar Password',
                style: TextStyle(
                  color: Color(0xFF20252B),
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
      body: SafeArea(
        child: ChangePasswordForm(isFirstLogin: isFirstLogin),
      ),
    );
  }
}
