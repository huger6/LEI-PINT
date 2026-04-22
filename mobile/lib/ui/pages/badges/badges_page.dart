import 'package:flutter/material.dart';

import '../models/badge_model.dart';
import '../widgets/badge/badge_attributes_table.dart';
import 'application_screen.dart';

class BadgeDetailScreen extends StatefulWidget {
  const BadgeDetailScreen({super.key, required this.badge});

  final BadgeModel badge;

  @override
  State<BadgeDetailScreen> createState() => _BadgeDetailScreenState();
}

class _BadgeDetailScreenState extends State<BadgeDetailScreen> {
  bool _isOverviewTab = true;
  bool _showRequirements = false;

  @override
  Widget build(BuildContext context) {
    final badge = widget.badge;

    return Scaffold(
      backgroundColor: const Color(0xFFE7EBEE),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(14, 10, 14, 0),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.arrow_back, size: 32),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 26),
                child: Text(
                  badge.title,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    color: Colors.black,
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Center(
                child: _LargeBadgeIcon(
                  medalColor: badge.medalColor,
                  ribbonColor: badge.ribbonColor,
                ),
              ),
              const SizedBox(height: 22),
              Container(
                color: const Color(0xFFEFF2F5),
                child: Row(
                  children: [
                    Expanded(
                      child: _TabButton(
                        title: 'Visão geral',
                        isActive: _isOverviewTab,
                        onTap: () => setState(() => _isOverviewTab = true),
                      ),
                    ),
                    Expanded(
                      child: _TabButton(
                        title: 'Detalhes',
                        isActive: !_isOverviewTab,
                        onTap: () => setState(() => _isOverviewTab = false),
                      ),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(22, 18, 22, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Descrição',
                      style: TextStyle(
                        fontSize: 19,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF1A1A1A),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      badge.description,
                      textAlign: TextAlign.justify,
                      style: const TextStyle(
                        fontSize: 16,
                        height: 1.45,
                        color: Color(0xFF2A2A2A),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Center(
                      child: OutlinedButton(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => ApplicationScreen(badge: badge),
                            ),
                          );
                        },
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Color(0xFFB4BDC6)),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                          backgroundColor: const Color(0xFFF8FBFD),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 22,
                            vertical: 10,
                          ),
                        ),
                        child: const Text(
                          'Submeter candidatura',
                          style: TextStyle(
                            color: Color(0xFF5BAFDF),
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      'Competências',
                      style: TextStyle(
                        fontSize: 19,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF1A1A1A),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 10,
                      children: badge.skills
                          .map(
                            (skill) => Chip(
                              label: Text(skill),
                              backgroundColor: const Color(0xFFE6EAEE),
                              side: const BorderSide(color: Color(0xFFB2BBC4)),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(18),
                              ),
                              labelStyle: const TextStyle(
                                color: Color(0xFF222629),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          )
                          .toList(),
                    ),
                    const SizedBox(height: 20),
                    if (!_isOverviewTab) ...[
                      BadgeAttributesTable(attributes: badge.attributes),
                      const SizedBox(height: 8),
                      if (_showRequirements)
                        _RequirementsSection(requirements: badge.requirements),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: Container(
        height: 84,
        padding: const EdgeInsets.symmetric(horizontal: 18),
        decoration: const BoxDecoration(
          color: Color(0xFFF8F8F8),
          boxShadow: [
            BoxShadow(
              color: Color(0x12000000),
              blurRadius: 6,
              offset: Offset(0, -1),
            ),
          ],
        ),
        child: Row(
          children: [
            IconButton(
              onPressed: () {},
              icon: const Icon(Icons.ios_share_outlined, size: 30),
              color: const Color(0xFF4A545B),
            ),
            IconButton(
              onPressed: () {},
              icon: const Icon(Icons.bookmark_add_outlined, size: 30),
              color: const Color(0xFF4A545B),
            ),
            const Spacer(),
            SizedBox(
              height: 52,
              child: ElevatedButton(
                onPressed: () {
                  setState(() {
                    _isOverviewTab = false;
                    _showRequirements = true;
                  });
                },
                style: ElevatedButton.styleFrom(
                  elevation: 3,
                  backgroundColor: const Color(0xFF84C4E7),
                  foregroundColor: const Color(0xFF1E2932),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 28),
                ),
                child: const Text(
                  'Requisitos',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TabButton extends StatelessWidget {
  const _TabButton({
    required this.title,
    required this.isActive,
    required this.onTap,
  });

  final String title;
  final bool isActive;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Text(
              title,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: const Color(0xFF202020),
              ),
            ),
          ),
          Container(
            height: 3,
            color: isActive ? const Color(0xFF63B3E0) : const Color(0xFFAEB7C0),
          ),
        ],
      ),
    );
  }
}

class _RequirementsSection extends StatelessWidget {
  const _RequirementsSection({required this.requirements});

  final List<BadgeRequirement> requirements;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 10),
      padding: const EdgeInsets.fromLTRB(14, 16, 14, 14),
      decoration: BoxDecoration(
        color: const Color(0xFFDDE2E7),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Center(
            child: Text(
              'Requisitos',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700),
            ),
          ),
          const SizedBox(height: 14),
          ...requirements.map(
            (requirement) => Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Icon(requirement.icon, color: const Color(0xFF3A444C)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      requirement.text,
                      style: const TextStyle(
                        fontSize: 16,
                        color: Color(0xFF2A2A2A),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Icon(
                    Icons.open_in_new_rounded,
                    color: Color(0xFF4B535A),
                    size: 22,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _LargeBadgeIcon extends StatelessWidget {
  const _LargeBadgeIcon({required this.medalColor, required this.ribbonColor});

  final Color medalColor;
  final Color ribbonColor;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 142,
      height: 190,
      child: Stack(
        alignment: Alignment.topCenter,
        children: [
          Positioned(
            top: 94,
            child: Row(
              children: [
                Icon(Icons.bookmark, color: ribbonColor, size: 50),
                const SizedBox(width: 4),
                Icon(Icons.bookmark, color: ribbonColor, size: 50),
              ],
            ),
          ),
          Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: medalColor,
              border: Border.all(color: const Color(0xFF876E2C), width: 4),
            ),
            child: const Icon(
              Icons.star_rounded,
              color: Color(0xFFFFF6C7),
              size: 72,
            ),
          ),
        ],
      ),
    );
  }
}
