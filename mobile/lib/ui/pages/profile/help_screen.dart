import 'package:flutter/material.dart';

import '../../../presentation/state/language_controller.dart';
import '../../widgets/shared/app_bottom_nav_bar.dart';
import '../../widgets/profile/help_widgets.dart';
import '../../widgets/shared/app_icon/app_icon.dart';
import '../../widgets/shared/app_icon/app_icon_data.dart';

class HelpScreen extends StatelessWidget {
  const HelpScreen({super.key});

  static const _sections = [
    _HelpEntry(
      icon: AppIcons.home,
      titleKey: 'helpDashboardTitle',
      descKey: 'helpDashboardDesc',
    ),
    _HelpEntry(
      icon: AppIcons.target,
      titleKey: 'helpExploreTitle',
      descKey: 'helpExploreDesc',
    ),
    _HelpEntry(
      icon: AppIcons.badgePremium,
      titleKey: 'helpMyBadgesTitle',
      descKey: 'helpMyBadgesDesc',
    ),
    _HelpEntry(
      icon: AppIcons.progress,
      titleKey: 'helpEvolutionTitle',
      descKey: 'helpEvolutionDesc',
    ),
    _HelpEntry(
      icon: AppIcons.user,
      titleKey: 'helpProfileTitle',
      descKey: 'helpProfileDesc',
    ),
    _HelpEntry(
      icon: AppIcons.paper,
      titleKey: 'helpApplicationsTitle',
      descKey: 'helpApplicationsDesc',
    ),
    _HelpEntry(
      icon: AppIcons.bell,
      titleKey: 'helpNotificationsTitle',
      descKey: 'helpNotificationsDesc',
    ),
    _HelpEntry(
      icon: AppIcons.share,
      titleKey: 'helpShareTitle',
      descKey: 'helpShareDesc',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);

    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
        title: Text(
          tr.tr('help'),
          style: const TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w800,
            color: Color(0xFF1E2932),
          ),
        ),
        leading: IconButton(
          icon: const AppIcon(AppIcons.chevronBackward, color: Color(0xFF1E2932)),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF5D9FD1), Color(0xFF3A7BB8)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  children: [
                    const AppIcon(
                      AppIcons.help,
                      color: Colors.white,
                      size: 48,
                    ),
                    const SizedBox(height: 10),
                    Text(
                      tr.tr('helpQuestionTitle'),
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      tr.tr('helpQuestionSubtitle'),
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 14,
                        color: Colors.white70,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              Text(
                tr.tr('helpFeatures'),
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF1E2932),
                ),
              ),
              const SizedBox(height: 12),
              ..._sections.map(
                (entry) => HelpSection(
                  icon: entry.icon,
                  title: tr.tr(entry.titleKey),
                  description: tr.tr(entry.descKey),
                ),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: const AppBottomNavBar(currentTab: AppTab.profile),
    );
  }
}

class _HelpEntry {
  const _HelpEntry({
    required this.icon,
    required this.titleKey,
    required this.descKey,
  });

  final String icon;
  final String titleKey;
  final String descKey;
}
