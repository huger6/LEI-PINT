import 'package:flutter/material.dart';

import '../../widgets/auth/change_password_widgets.dart';
import '../../widgets/shared/app_icon/app_icon.dart';
import '../../widgets/shared/app_icon/app_icon_data.dart';

class ChangePasswordScreen extends StatelessWidget {
  const ChangePasswordScreen({super.key, required this.isFirstLogin});

  final bool isFirstLogin;

  @override
  Widget build(BuildContext context) {
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
                icon: const AppIcon(
                  AppIcons.chevronBackward,
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
