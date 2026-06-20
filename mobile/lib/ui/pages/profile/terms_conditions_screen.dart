import 'package:flutter/material.dart';

import '../../../presentation/state/language_controller.dart';
import '../../widgets/profile/terms_conditions_widgets.dart';
import '../../widgets/shared/app_icon/app_icon.dart';
import '../../widgets/shared/app_icon/app_icon_data.dart';

class TermsConditionsScreen extends StatelessWidget {
  const TermsConditionsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
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
        title: Text(
          tr.tr('termsScreenTitle'),
          style: const TextStyle(
            color: Color(0xFF20252B),
            fontSize: 22,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      body: const SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.fromLTRB(16, 8, 16, 24),
          child: TermsConditionsContent(),
        ),
      ),
    );
  }
}
