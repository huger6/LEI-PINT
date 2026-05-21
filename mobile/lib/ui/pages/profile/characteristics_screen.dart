import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../presentation/state/auth_store.dart';
import '../../../presentation/state/badge_store.dart';
import '../../widgets/shared/app_bottom_nav_bar.dart';
import '../../widgets/profile/characteristics_widgets.dart';

class CharacteristicsScreen extends StatefulWidget {
  const CharacteristicsScreen({super.key});

  @override
  State<CharacteristicsScreen> createState() => _CharacteristicsScreenState();
}

class _CharacteristicsScreenState extends State<CharacteristicsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<BadgeStore>().loadEarnedBadges();
    });
  }

  @override
  Widget build(BuildContext context) {
    final authStore = context.watch<AuthStore>();
    final badgeStore = context.watch<BadgeStore>();
    final user = authStore.currentUser;

    final userName = (user?.fullName.trim().isNotEmpty ?? false)
        ? user!.fullName.trim()
        : (user?.username.trim().isNotEmpty ?? false)
            ? user!.username.trim()
            : 'Utilizador';

    final skills = badgeStore.earnedBadges
        .expand((e) => e.badge.skills)
        .toSet()
        .toList();

    final areas = user?.areas ?? [];
    final role = user?.role;
    final serviceLine = user?.serviceLineName;
    final learningPath = user?.learningPathTitle;
    final biography = user?.biography;

    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
        title: const Text(
          'As minhas características',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w800,
            color: Color(0xFF1E2932),
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF1E2932)),
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
                    const CircleAvatar(
                      radius: 36,
                      backgroundColor: Colors.white24,
                      child: Icon(
                        Icons.person_outline_rounded,
                        color: Colors.white,
                        size: 40,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Eu $userName sou',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                    if (role != null && role.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white24,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          role,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),

              if (biography != null && biography.trim().isNotEmpty) ...[
                const CharacteristicSectionHeader(
                  title: 'Biografia',
                  icon: Icons.info_outline_rounded,
                ),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x12000000),
                        blurRadius: 6,
                        offset: Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Text(
                    biography.trim(),
                    style: const TextStyle(
                      fontSize: 14,
                      height: 1.4,
                      color: Color(0xFF2A3540),
                    ),
                  ),
                ),
              ],

              if (serviceLine != null && serviceLine.trim().isNotEmpty) ...[
                const CharacteristicSectionHeader(
                  title: 'Service Line',
                  icon: Icons.business_outlined,
                ),
                CharacteristicChip(
                  label: serviceLine.trim(),
                  icon: Icons.business_outlined,
                ),
              ],

              if (learningPath != null && learningPath.trim().isNotEmpty) ...[
                const CharacteristicSectionHeader(
                  title: 'Learning Path',
                  icon: Icons.route_outlined,
                ),
                CharacteristicChip(
                  label: learningPath.trim(),
                  icon: Icons.route_outlined,
                ),
              ],

              if (areas.isNotEmpty) ...[
                const CharacteristicSectionHeader(
                  title: 'Áreas',
                  icon: Icons.category_outlined,
                ),
                ...areas.map(
                  (area) => CharacteristicChip(
                    label: area.name,
                    icon: Icons.category_outlined,
                    isPrimary: area.isPrimary,
                  ),
                ),
              ],

              if (skills.isNotEmpty) ...[
                const CharacteristicSectionHeader(
                  title: 'Competências',
                  icon: Icons.extension_outlined,
                ),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: skills.map((skill) {
                    return Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEFF2F5),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: const Color(0xFFD7DDE4),
                        ),
                      ),
                      child: Text(
                        skill,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF3A4A57),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ],

              if (areas.isEmpty &&
                  skills.isEmpty &&
                  (biography == null || biography.trim().isEmpty))
                Padding(
                  padding: const EdgeInsets.only(top: 40),
                  child: Center(
                    child: Column(
                      children: [
                        Icon(
                          Icons.person_search_outlined,
                          size: 64,
                          color: Colors.grey[350],
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'Ainda sem características definidas.',
                          style: TextStyle(
                            fontSize: 15,
                            color: Colors.grey[500],
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
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
