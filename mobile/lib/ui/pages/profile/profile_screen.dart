import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/routes/app_router.dart';
import '../../../presentation/state/auth_store.dart';
import '../../widgets/shared/app_bottom_nav_bar.dart';

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
                    child: _QuickMetricCard(
                      value: '4',
                      label: 'Badges',
                      icon: Icons.workspace_premium_outlined,
                    ),
                  ),
                  SizedBox(width: 8),
                  Expanded(
                    child: _QuickMetricCard(
                      value: '7',
                      label: 'Competências',
                      icon: Icons.extension_outlined,
                    ),
                  ),
                  SizedBox(width: 8),
                  Expanded(
                    child: _QuickMetricCard(
                      value: '538',
                      label: 'Pontos',
                      icon: Icons.stars_outlined,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const _BadgesStatsCard(),
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
              const _ProfileMenuTile(
                icon: Icons.edit_note_rounded,
                label: 'As minhas características',
              ),
              const SizedBox(height: 8),
              const _ProfileMenuTile(
                icon: Icons.notifications_none_rounded,
                label: 'Preferências notificações',
              ),
              const SizedBox(height: 8),
              const _ProfileMenuTile(
                icon: Icons.person_outline_rounded,
                label: 'Editar perfil',
              ),
              const SizedBox(height: 8),
              _ProfileMenuTile(
                icon: Icons.email_outlined,
                label: 'Editar assinatura de email',
                onTap: () =>
                    Navigator.pushNamed(context, AppRouter.emailSignature),
              ),
              const SizedBox(height: 8),
              const _ProfileMenuTile(
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
              const _ProfileMenuTile(
                icon: Icons.privacy_tip_outlined,
                label: 'Políticas de privacidade',
              ),
              const SizedBox(height: 8),
              const _ProfileMenuTile(
                icon: Icons.description_outlined,
                label: 'Termos e condições',
              ),
              const SizedBox(height: 8),
              const _ProfileMenuTile(
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

class _QuickMetricCard extends StatelessWidget {
  const _QuickMetricCard({
    required this.value,
    required this.label,
    required this.icon,
  });

  final String value;
  final String label;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 84,
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        boxShadow: const [
          BoxShadow(
            color: Color(0x18000000),
            blurRadius: 8,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            value,
            style: const TextStyle(
              fontSize: 30,
              fontWeight: FontWeight.w800,
              color: Color(0xFF59A9D9),
              height: 1,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 16, color: const Color(0xFF5C6977)),
              const SizedBox(width: 4),
              Flexible(
                child: Text(
                  label,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Color(0xFF43505D),
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _BadgesStatsCard extends StatelessWidget {
  const _BadgesStatsCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        boxShadow: const [
          BoxShadow(
            color: Color(0x15000000),
            blurRadius: 8,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Badges Obtidos',
            style: TextStyle(
              fontSize: 19,
              fontWeight: FontWeight.w800,
              color: Color(0xFF3C4453),
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            height: 220,
            child: LineChart(
              LineChartData(
                minX: 0,
                maxX: 5,
                minY: 0,
                maxY: 21,
                borderData: FlBorderData(show: false),
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  horizontalInterval: 7,
                  getDrawingHorizontalLine: (_) =>
                      const FlLine(color: Color(0xFFE8EDF2), strokeWidth: 1),
                ),
                titlesData: FlTitlesData(
                  topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      interval: 7,
                      reservedSize: 30,
                      getTitlesWidget: (value, meta) {
                        return Text(
                          value.toInt().toString(),
                          style: const TextStyle(
                            color: Color(0xFF718192),
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        );
                      },
                    ),
                  ),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      interval: 1,
                      reservedSize: 24,
                      getTitlesWidget: (value, meta) {
                        const months = [
                          'Jan',
                          'Fev',
                          'Mar',
                          'Abr',
                          'Mai',
                          'Jun',
                        ];
                        final index = value.toInt();
                        if (index < 0 || index >= months.length) {
                          return const SizedBox.shrink();
                        }
                        return Padding(
                          padding: const EdgeInsets.only(top: 6),
                          child: Text(
                            months[index],
                            style: const TextStyle(
                              color: Color(0xFF5D6978),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),
                extraLinesData: ExtraLinesData(
                  verticalLines: [
                    VerticalLine(
                      x: 3,
                      color: const Color(0xFFAFB8C3),
                      strokeWidth: 1.4,
                      dashArray: [6, 4],
                    ),
                  ],
                ),
                lineBarsData: [
                  LineChartBarData(
                    spots: const [
                      FlSpot(0, 13),
                      FlSpot(1, 9),
                      FlSpot(2, 8),
                      FlSpot(3, 16),
                      FlSpot(4, 14),
                      FlSpot(5, 9),
                    ],
                    isCurved: true,
                    color: const Color(0xFFE57D97),
                    barWidth: 3,
                    isStrokeCapRound: true,
                    belowBarData: BarAreaData(show: false),
                    dotData: FlDotData(
                      show: true,
                      checkToShowDot: (spot, barData) => spot.x == 3,
                      getDotPainter: (spot, percent, barData, index) {
                        return FlDotCirclePainter(
                          radius: 5,
                          color: const Color(0xFFE57D97),
                          strokeWidth: 2,
                          strokeColor: Colors.white,
                        );
                      },
                    ),
                  ),
                  LineChartBarData(
                    spots: const [
                      FlSpot(0, 9),
                      FlSpot(1, 12),
                      FlSpot(2, 8),
                      FlSpot(3, 7),
                      FlSpot(4, 10),
                      FlSpot(5, 7),
                    ],
                    isCurved: true,
                    color: const Color(0xFF494CE6),
                    barWidth: 3,
                    isStrokeCapRound: true,
                    belowBarData: BarAreaData(show: false),
                    dotData: const FlDotData(show: false),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: const [
              _LegendItem(color: Color(0xFFE57D97), label: 'Os seus dados'),
              SizedBox(width: 28),
              _LegendItem(
                color: Color(0xFF494CE6),
                label: 'Média dos consultores',
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _LegendItem extends StatelessWidget {
  const _LegendItem({required this.color, required this.label});

  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 5),
        Text(
          label,
          style: const TextStyle(
            color: Color(0xFF5E6C7A),
            fontWeight: FontWeight.w600,
            fontSize: 11,
          ),
        ),
      ],
    );
  }
}

class _ProfileMenuTile extends StatelessWidget {
  const _ProfileMenuTile({required this.icon, required this.label, this.onTap});

  final IconData icon;
  final String label;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 0),
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
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        leading: Container(
          width: 40,
          height: 40,
          decoration: const BoxDecoration(
            color: Color(0xFFD5EAF6),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: const Color(0xFF4D9ECC), size: 20),
        ),
        title: Text(
          label,
          style: const TextStyle(
            color: Color(0xFF1E2932),
            fontWeight: FontWeight.w700,
          ),
        ),
        trailing: const Icon(
          Icons.chevron_right_rounded,
          color: Color(0xFF8B96A1),
        ),
        onTap: onTap,
      ),
    );
  }
}
