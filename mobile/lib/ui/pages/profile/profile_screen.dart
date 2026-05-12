import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/routes/app_router.dart';
import '../../../presentation/state/auth_store.dart';
import '../../widgets/shared/app_bottom_nav_bar.dart';
import '../../widgets/profile/profile_widgets.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
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
              const Row(
                children: [
                  Expanded(
                    child: QuickMetricCard(
                      value: '4',
                      label: 'Badges',
                      icon: Icons.workspace_premium_outlined,
                    ),
                  ),
                  SizedBox(width: 8),
                  Expanded(
                    child: QuickMetricCard(
                      value: '7',
                      label: 'Competências',
                      icon: Icons.extension_outlined,
                    ),
                  ),
                  SizedBox(width: 8),
                  Expanded(
                    child: QuickMetricCard(
                      value: '538',
                      label: 'Pontos',
                      icon: Icons.stars_outlined,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const BadgesStatsCard(),
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
                  trailing: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Ver galeria',
                        style: TextStyle(
                          color: Color(0xFF5D9FD1),
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      SizedBox(width: 2),
                      Icon(
                        Icons.chevron_right_rounded,
                        color: Color(0xFF5D9FD1),
                        size: 24,
                      ),
                    ],
                  ),
                  onTap: () {},
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
              const ProfileMenuTile(
                icon: Icons.edit_note_rounded,
                label: 'As minhas características',
              ),
              const SizedBox(height: 8),
              const ProfileMenuTile(
                icon: Icons.notifications_none_rounded,
                label: 'Preferências notificações',
              ),
              const SizedBox(height: 8),
              const ProfileMenuTile(
                icon: Icons.person_outline_rounded,
                label: 'Editar perfil',
              ),
              const SizedBox(height: 8),
              ProfileMenuTile(
                icon: Icons.email_outlined,
                label: 'Editar assinatura de email',
                onTap: () =>
                    Navigator.pushNamed(context, AppRouter.emailSignature),
              ),
              const SizedBox(height: 8),
              const ProfileMenuTile(
                icon: Icons.language_rounded,
                label: 'Idioma',
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
              const ProfileMenuTile(
                icon: Icons.description_outlined,
                label: 'Termos e condições',
              ),
              const SizedBox(height: 8),
              const ProfileMenuTile(
                icon: Icons.help_outline_rounded,
                label: 'Ajuda',
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
