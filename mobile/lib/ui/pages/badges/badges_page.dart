import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_colors.dart';
import '../../../models/badge_model.dart';
import '../../../injection_container.dart';
import '../../widgets/badges/badge_detail_widgets.dart';
import '../../widgets/badges/competences_section.dart';
import '../applications/application_page.dart';

class BadgeDetailScreen extends StatefulWidget {
  const BadgeDetailScreen({super.key, required this.badge});

  final BadgeModel badge;

  @override
  State<BadgeDetailScreen> createState() => _BadgeDetailScreenState();
}

class _BadgeDetailScreenState extends State<BadgeDetailScreen> {
  bool _isFavorite = false;
  late BadgeModel _badge;

  @override
  void initState() {
    super.initState();
    _badge = widget.badge;
    _loadFavoriteState();
    _loadFullDetail();
  }

  void _loadFavoriteState() {
    final store = context.read<BadgeStore>();
    setState(() {
      _isFavorite = store.isFavorite(widget.badge.id);
    });
  }

  Future<void> _loadFullDetail() async {
    if (_badge.requirements.isNotEmpty || _badge.slug.trim().isEmpty) return;
    final store = context.read<BadgeStore>();
    final detailed = await store.getBadgeDetail(_badge);
    if (detailed != null && mounted) {
      setState(() => _badge = detailed);
    }
  }

  Future<void> _toggleFavorite() async {
    final store = context.read<BadgeStore>();
    await store.toggleFavorite(widget.badge.id);
    if (mounted) {
      setState(() {
        _isFavorite = store.isFavorite(widget.badge.id);
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(_isFavorite ? 'Badge guardado!' : 'Badge removido dos guardados.'),
          backgroundColor: _isFavorite ? AppColors.success : const Color(0xFF5A6872),
          duration: const Duration(seconds: 1),
        ),
      );
    }
  }

  void _shareBadge() {
    final badge = _badge;
    final baseUrl = dotenv.env['FRONTEND_URL']?.trim() ?? 'https://softinsa.pt';
    final text =
        '${badge.title}\n${badge.description.isNotEmpty ? badge.description : ''}'
        '\n\n$baseUrl/badges/${badge.slug}';
    Clipboard.setData(ClipboardData(text: text));
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Link copiado para a área de transferência!'),
          backgroundColor: Color(0xFF4E6CA2),
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    final badge = _badge;

    return Scaffold(
      backgroundColor: const Color(0xFFF2F4F7),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 8, 8, 0),
              child: Row(
                children: [
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.arrow_back_rounded, size: 26),
                    color: const Color(0xFF1E2932),
                  ),
                  const Spacer(),
                  IconButton(
                    onPressed: _toggleFavorite,
                    icon: Icon(
                      _isFavorite ? Icons.bookmark_rounded : Icons.bookmark_border_rounded,
                      size: 28,
                    ),
                    color: _isFavorite ? AppColors.primary : const Color(0xFF4A545B),
                  ),
                  IconButton(
                    onPressed: _shareBadge,
                    icon: const Icon(Icons.share_rounded, size: 26),
                    color: const Color(0xFF4A545B),
                  ),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: LargeBadgeIcon(
                        medalColor: badge.medalColor,
                        ribbonColor: badge.ribbonColor,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Center(
                      child: Text(
                        badge.title,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF1A1F25),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Center(
                      child: Wrap(
                        alignment: WrapAlignment.center,
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          if (badge.category.trim().isNotEmpty)
                            BadgeInfoTag(
                              icon: Icons.category_outlined,
                              label: badge.category,
                            ),
                          if (badge.level.trim().isNotEmpty)
                            BadgeInfoTag(
                              icon: Icons.stairs_outlined,
                              label: badge.level,
                            ),
                          if (badge.points > 0)
                            BadgeInfoTag(
                              icon: Icons.stars_rounded,
                              label: '${badge.points} pts',
                            ),
                          if (badge.duration.trim().isNotEmpty)
                            BadgeInfoTag(
                              icon: Icons.schedule_rounded,
                              label: badge.duration,
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                    Center(
                      child: SizedBox(
                        width: double.infinity,
                        height: 48,
                        child: ElevatedButton(
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => ApplicationScreen(badge: badge),
                              ),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                          child: Text(
                            tr.tr('submitApplication'),
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    if (badge.description.trim().isNotEmpty) ...[
                      BadgeSectionCard(
                        title: tr.tr('description'),
                        child: Text(
                          badge.description,
                          textAlign: TextAlign.start,
                          style: const TextStyle(
                            fontSize: 15,
                            height: 1.65,
                            letterSpacing: 0.15,
                            color: Color(0xFF4A5663),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),
                    ],
                    if (badge.skills.isNotEmpty) ...[
                      CompetencesSection(
                        skills: badge.skills,
                        title: tr.tr('certifiedCompetences'),
                      ),
                      const SizedBox(height: 14),
                    ],
                    if (badge.requirements.isNotEmpty) ...[
                      BadgeSectionCard(
                        title: tr.tr('requirements'),
                        child: Column(
                          children: badge.requirements.asMap().entries.map((entry) {
                            return Padding(
                              padding: EdgeInsets.only(
                                bottom: entry.key < badge.requirements.length - 1 ? 10 : 0,
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    width: 26,
                                    height: 26,
                                    decoration: BoxDecoration(
                                      color: AppColors.primary.withValues(alpha: 0.12),
                                      shape: BoxShape.circle,
                                    ),
                                    alignment: Alignment.center,
                                    child: Text(
                                      '${entry.key + 1}',
                                      style: TextStyle(
                                        color: AppColors.secondary,
                                        fontWeight: FontWeight.w700,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Text(
                                      entry.value.text,
                                      style: const TextStyle(
                                        fontSize: 14,
                                        color: Color(0xFF2A3540),
                                        height: 1.4,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                      const SizedBox(height: 14),
                    ],
                    BadgeSectionCard(
                      title: 'Detalhes',
                      child: Column(
                        children: [
                          if (badge.category.trim().isNotEmpty)
                            BadgeDetailRow(label: 'Área', value: badge.category),
                          if (badge.level.trim().isNotEmpty)
                            BadgeDetailRow(label: 'Nível', value: badge.level),
                          if (badge.points > 0)
                            BadgeDetailRow(label: 'Pontos', value: '${badge.points}'),
                          if (badge.duration.trim().isNotEmpty)
                            BadgeDetailRow(label: 'Tempo estimado', value: badge.duration),
                          if (badge.expirationDays != null && badge.expirationDays! > 0)
                            BadgeDetailRow(
                              label: 'Validade',
                              value: '${badge.expirationDays} dias',
                            ),
                          if (badge.createdAt != null)
                            BadgeDetailRow(
                              label: 'Criado a',
                              value: '${badge.createdAt!.day.toString().padLeft(2, '0')}/${badge.createdAt!.month.toString().padLeft(2, '0')}/${badge.createdAt!.year}',
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
