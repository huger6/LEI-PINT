import 'package:flutter/material.dart';

import '../../../core/sync_manager.dart';
import '../../../models/badge_model.dart';
import '../../widgets/badges/badge_attributes_table.dart';
import '../../widgets/badges/badge_detail_widgets.dart';
import '../applications/application_page.dart';

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
    final tr = LanguageScope.of(context);
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
                child: LargeBadgeIcon(
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
                      child: BadgeDetailTabButton(
                        title: tr.tr('overviewTab'),
                        isActive: _isOverviewTab,
                        onTap: () => setState(() => _isOverviewTab = true),
                      ),
                    ),
                    Expanded(
                      child: BadgeDetailTabButton(
                        title: tr.tr('detailsTab'),
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
                    Text(
                      tr.tr('description'),
                      style: const TextStyle(
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
                        child: Text(
                          tr.tr('submitApplication'),
                          style: const TextStyle(
                            color: Color(0xFF5BAFDF),
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      tr.tr('skills'),
                      style: const TextStyle(
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
                        BadgeRequirementsSection(
                          requirements: badge.requirements,
                        ),
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
                child: Text(
                  tr.tr('requirements'),
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
