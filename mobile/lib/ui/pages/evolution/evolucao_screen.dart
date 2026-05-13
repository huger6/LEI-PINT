import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../presentation/state/auth_store.dart';
import '../../widgets/shared/app_bottom_nav_bar.dart';
import '../../widgets/evolution/evolution_widgets.dart';

class EvolucaoScreen extends StatefulWidget {
  const EvolucaoScreen({super.key});

  @override
  State<EvolucaoScreen> createState() => _EvolucaoScreenState();
}

class _EvolucaoScreenState extends State<EvolucaoScreen> {
  static const List<String> _periodOptions = ['Semanal', 'Mensal', 'Anual'];

  String _selectedPeriod = _periodOptions.first;

  @override
  Widget build(BuildContext context) {
    final authStore = context.watch<AuthStore>();
    final user = authStore.currentUser;
    final displayName = user?.fullName.trim().isNotEmpty == true
        ? user!.fullName.trim()
        : (user?.username.trim().isNotEmpty == true
              ? user!.username.trim()
              : 'Consultor');

    return Scaffold(
      backgroundColor: const Color(0xFFE6EBF0),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Olá, $displayName!',
                style: const TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF1E2A35),
                ),
              ),
              const SizedBox(height: 16),
              const MainBadgesCard(),
              const SizedBox(height: 14),
              GridView.count(
                crossAxisCount: 2,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                childAspectRatio: 1.38,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                children: const [
                  MiniStatCard(
                    title: 'Badges obtidos',
                    value: '34',
                    icon: Icons.workspace_premium_rounded,
                    accentColor: Color(0xFF66B6E6),
                  ),
                  MiniStatCard(
                    title: 'Conquistas ativas',
                    value: '12',
                    icon: Icons.emoji_events_outlined,
                    accentColor: Color(0xFF83A9E8),
                  ),
                  MiniStatCard(
                    title: 'Níveis concluídos',
                    value: '8',
                    icon: Icons.auto_graph_rounded,
                    accentColor: Color(0xFF8BC4D9),
                  ),
                  MiniStatCard(
                    title: 'Horas investidas',
                    value: '146',
                    icon: Icons.schedule_rounded,
                    accentColor: Color(0xFF96B8CF),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              PointsBarCard(
                selectedPeriod: _selectedPeriod,
                periodOptions: _periodOptions,
                onPeriodChanged: (value) {
                  if (value == null) {
                    return;
                  }
                  setState(() {
                    _selectedPeriod = value;
                  });
                },
              ),
              const SizedBox(height: 14),
              const RecentActivitySection(),
              const SizedBox(height: 14),
              const ApplicationsMetricsSection(),
              const SizedBox(height: 14),
              const LevelsRadarCard(),
            ],
          ),
        ),
      ),
      bottomNavigationBar: const AppBottomNavBar(currentTab: AppTab.progress),
    );
  }
}
