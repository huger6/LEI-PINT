import 'package:flutter/material.dart';

import '../../../core/sync_manager.dart';

enum AppTab { explore, badges, home, progress, profile }

class AppBottomNavBar extends StatelessWidget {
  const AppBottomNavBar({super.key, required this.currentTab});

  final AppTab currentTab;

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);

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
              label: tr.tr('navExplore'),
              isActive: currentTab == AppTab.explore,
              onTap: () => _handleTap(context, AppTab.explore),
            ),
          ),
          Expanded(
            child: _BottomNavItem(
              icon: Icons.workspace_premium_outlined,
              label: tr.tr('navBadges'),
              isActive: currentTab == AppTab.badges,
              onTap: () => _handleTap(context, AppTab.badges),
            ),
          ),
          Expanded(
            child: _BottomNavItem(
              icon: Icons.home_outlined,
              label: tr.tr('navHome'),
              isActive: currentTab == AppTab.home,
              onTap: () => _handleTap(context, AppTab.home),
            ),
          ),
          Expanded(
            child: _BottomNavItem(
              icon: Icons.query_stats_rounded,
              label: tr.tr('navProgress'),
              isActive: currentTab == AppTab.progress,
              onTap: () => _handleTap(context, AppTab.progress),
            ),
          ),
          Expanded(
            child: _BottomNavItem(
              icon: Icons.person_outline_rounded,
              label: tr.tr('navProfile'),
              isActive: currentTab == AppTab.profile,
              onTap: () => _handleTap(context, AppTab.profile),
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
      case AppTab.explore:
        Navigator.pushReplacementNamed(context, '/explore-competencies');
        break;
      case AppTab.home:
        Navigator.pushReplacementNamed(context, '/dashboard');
        break;
      case AppTab.progress:
        Navigator.pushReplacementNamed(context, '/evolucao');
        break;
      case AppTab.profile:
        Navigator.pushReplacementNamed(context, '/profile');
        break;
      case AppTab.badges:
        Navigator.pushReplacementNamed(context, '/my-badges');
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
