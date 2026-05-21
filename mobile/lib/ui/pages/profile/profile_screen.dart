import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/routes/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../presentation/state/auth_store.dart';
import '../../../presentation/state/badge_store.dart';
import '../../../presentation/state/dashboard_store.dart';
import '../../../presentation/state/language_controller.dart';
import '../../widgets/shared/app_bottom_nav_bar.dart';
import '../../widgets/profile/language_selector_sheet.dart';
import '../../widgets/profile/profile_widgets.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<BadgeStore>().loadEarnedBadges();
    });
  }

  Future<void> _handleLogout() async {
    await context.read<AuthStore>().clearSession();

    if (!mounted) {
      return;
    }

    Navigator.pushNamedAndRemoveUntil(
      context,
      AppRouter.login,
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final authStore = context.watch<AuthStore>();
    final badgeStore = context.watch<BadgeStore>();
    final dashStore = context.watch<DashboardStore>();

    final earnedBadges = badgeStore.earnedBadges;
    final badgeCount = earnedBadges.length;
    final skillsCount = earnedBadges
        .expand((e) => e.badge.skills)
        .toSet()
        .length;
    final totalPoints = authStore.currentUser?.totalPoints ?? 0;

    final userName =
        (authStore.currentUser?.fullName.trim().isNotEmpty ?? false)
        ? authStore.currentUser!.fullName.trim()
        : ((authStore.currentUser?.username.trim().isNotEmpty ?? false)
              ? authStore.currentUser!.username.trim()
              : 'Utilizador');

    final userArea =
        (authStore.draftRegistration.mainArea?.name.trim().isNotEmpty ?? false)
        ? authStore.draftRegistration.mainArea!.name.trim()
        : (authStore.draftRegistration.selectedAreas.isNotEmpty
              ? authStore.draftRegistration.selectedAreas.first.name
              : 'Área principal não definida');

    return Scaffold(
      backgroundColor: Colors.grey[100],
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 22),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Center(
                child: CircleAvatar(
                  radius: 44,
                  backgroundColor: Color(0xFF5D9FD1),
                  child: Icon(
                    Icons.person_outline_rounded,
                    color: Colors.white,
                    size: 52,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Center(
                child: Text(
                  userName,
                  style: const TextStyle(
                    fontSize: 30,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF1E2932),
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(height: 3),
              Center(
                child: Text(
                  userArea,
                  style: const TextStyle(
                    fontSize: 19,
                    color: Color(0xFF5B6773),
                    fontWeight: FontWeight.w600,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(height: 1),
              const Center(
                child: Text(
                  'Jornada Técnica',
                  style: TextStyle(
                    fontSize: 17,
                    color: Color(0xFF7B8692),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: QuickMetricCard(
                      value: '$badgeCount',
                      label: 'Badges',
                      icon: Icons.workspace_premium_outlined,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: QuickMetricCard(
                      value: '$skillsCount',
                      label: 'Competências',
                      icon: Icons.extension_outlined,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: QuickMetricCard(
                      value: '$totalPoints',
                      label: 'Pontos',
                      icon: Icons.stars_outlined,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              BadgesStatsCard(timeline: dashStore.timeline),
              const SizedBox(height: 10),
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(15),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x13000000),
                      blurRadius: 8,
                      offset: Offset(0, 3),
                    ),
                  ],
                ),
                child: ListTile(
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  leading: Container(
                    width: 42,
                    height: 42,
                    decoration: const BoxDecoration(
                      color: Color(0xFFD5EAF6),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.military_tech_outlined,
                      color: Color(0xFF4D9ECC),
                    ),
                  ),
                  title: const Text(
                    'Galeria de Badges',
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF1E2932),
                    ),
                  ),
                  subtitle: const Text(
                    'View and manage your achievement badges',
                    style: TextStyle(color: Color(0xFF6E7A86), fontSize: 12),
                  ),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Flexible(
                        child: Text(
                          'Ver galeria',
                          style: const TextStyle(
                            color: Color(0xFF5D9FD1),
                            fontWeight: FontWeight.w700,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 2),
                      const Icon(
                        Icons.chevron_right_rounded,
                        color: Color(0xFF5D9FD1),
                        size: 24,
                      ),
                    ],
                  ),
                  onTap: () => Navigator.pushNamed(
                    context, AppRouter.badgeGallery),
                ),
              ),
              const SizedBox(height: 14),
              const Text(
                'Definições',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF1E2932),
                ),
              ),
              const SizedBox(height: 8),
              ProfileMenuTile(
                icon: Icons.edit_note_rounded,
                label: 'As minhas características',
                onTap: () => Navigator.pushNamed(
                    context, AppRouter.characteristics),
              ),
              const SizedBox(height: 8),
              const ProfileMenuTile(
                icon: Icons.notifications_none_rounded,
                label: 'Preferências notificações',
              ),
              const SizedBox(height: 8),
              ProfileMenuTile(
                icon: Icons.person_outline_rounded,
                label: 'Editar perfil',
                onTap: () =>
                    Navigator.pushNamed(context, AppRouter.editProfile),
              ),
              const SizedBox(height: 8),
              ProfileMenuTile(
                icon: Icons.email_outlined,
                label: 'Editar assinatura de email',
                onTap: () =>
                    Navigator.pushNamed(context, AppRouter.emailSignature),
              ),
              const SizedBox(height: 8),
              ProfileMenuTile(
                icon: Icons.language_rounded,
                label: 'Idioma',
                onTap: () {
                  final langCtrl = LanguageScope.of(context);
                  LanguageSelectorSheet.show(
                    context,
                    currentCode: langCtrl.languageCode,
                    onSelected: (code) async {
                      final authStore = context.read<AuthStore>();
                      final messenger = ScaffoldMessenger.of(context);
                      await langCtrl.setLanguageCode(code);
                      if (!mounted) return;
                      final langId = int.tryParse(langCtrl.languageDatabaseId);
                      if (langId != null) {
                        final result = await authStore.changeLanguage(langId);
                        if (mounted && result['success'] != true) {
                          messenger.showSnackBar(
                            SnackBar(
                              content: Text(
                                result['message']?.toString() ??
                                    'Erro ao alterar idioma.',
                              ),
                              backgroundColor: AppColors.error,
                            ),
                          );
                        }
                      }
                    },
                  );
                },
              ),
              const SizedBox(height: 14),
              const Text(
                'Ajuda e políticas',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF1E2932),
                ),
              ),
              const SizedBox(height: 8),
              const ProfileMenuTile(
                icon: Icons.privacy_tip_outlined,
                label: 'Políticas de privacidade',
              ),
              const SizedBox(height: 8),
              ProfileMenuTile(
                icon: Icons.description_outlined,
                label: 'Termos e condições',
                onTap: () =>
                    Navigator.pushNamed(context, AppRouter.termsConditions),
              ),
              const SizedBox(height: 8),
              ProfileMenuTile(
                icon: Icons.help_outline_rounded,
                label: 'Ajuda',
                onTap: () =>
                    Navigator.pushNamed(context, AppRouter.help),
              ),
              const SizedBox(height: 10),
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(15),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x13000000),
                      blurRadius: 8,
                      offset: Offset(0, 3),
                    ),
                  ],
                ),
                child: ListTile(
                  leading: const Icon(
                    Icons.logout_rounded,
                    color: Color(0xFF5D9FD1),
                  ),
                  title: const Text(
                    'Terminar sessão',
                    style: TextStyle(
                      color: Color(0xFF1E2932),
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  trailing: const Icon(
                    Icons.chevron_right_rounded,
                    color: Color(0xFF8B96A1),
                  ),
                  onTap: _handleLogout,
                ),
              ),
              const SizedBox(height: 14),
              const Center(
                child: Text(
                  'Versão 1.3.1',
                  style: TextStyle(
                    color: Color(0xFF8D98A3),
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
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
