import 'package:flutter/material.dart';

enum AppTab { explorar, badges, inicio, evolucao, perfil }

class AppBottomNavBar extends StatelessWidget {
  const AppBottomNavBar({super.key, required this.currentTab});

  final AppTab currentTab;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(12, 0, 12, 12),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFF6F7F8),
        borderRadius: BorderRadius.circular(22),
        boxShadow: const [
          BoxShadow(
            color: Color(0x1F000000),
            blurRadius: 8,
            offset: Offset(0, -1),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: _BottomNavItem(
              icon: Icons.search_rounded,
              label: 'Explorar',
              isActive: currentTab == AppTab.explorar,
              onTap: () => _handleTap(context, AppTab.explorar),
            ),
          ),
          Expanded(
            child: _BottomNavItem(
              icon: Icons.workspace_premium_outlined,
              label: 'Badges',
              isActive: currentTab == AppTab.badges,
              onTap: () => _handleTap(context, AppTab.badges),
            ),
          ),
          Expanded(
            child: _BottomNavItem(
              icon: Icons.home_outlined,
              label: 'Início',
              isActive: currentTab == AppTab.inicio,
              onTap: () => _handleTap(context, AppTab.inicio),
            ),
          ),
          Expanded(
            child: _BottomNavItem(
              icon: Icons.query_stats_rounded,
              label: 'Evolução',
              isActive: currentTab == AppTab.evolucao,
              onTap: () => _handleTap(context, AppTab.evolucao),
            ),
          ),
          Expanded(
            child: _BottomNavItem(
              icon: Icons.person_outline_rounded,
              label: 'Perfil',
              isActive: currentTab == AppTab.perfil,
              onTap: () => _handleTap(context, AppTab.perfil),
            ),
          ),
        ],
      ),
    );
  }

  void _handleTap(BuildContext context, AppTab target) {
    if (target == currentTab) {
      return;
    }

    switch (target) {
      case AppTab.explorar:
        Navigator.pushReplacementNamed(context, '/explore-competencies');
        break;
      case AppTab.inicio:
        Navigator.pushReplacementNamed(context, '/dashboard');
        break;
      case AppTab.badges:
      case AppTab.evolucao:
      case AppTab.perfil:
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Ecrã ainda não disponível.')),
        );
        break;
    }
  }
}

class _BottomNavItem extends StatelessWidget {
  const _BottomNavItem({
    required this.icon,
    required this.label,
    required this.isActive,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            width: 56,
            height: 40,
            decoration: BoxDecoration(
              color: isActive ? const Color(0xFF6ABBE0) : Colors.transparent,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Icon(icon, size: 30, color: const Color(0xFF48515A)),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: isActive
                  ? const Color(0xFF2C3138)
                  : const Color(0xFF4D555E),
            ),
          ),
        ],
      ),
    );
  }
}
