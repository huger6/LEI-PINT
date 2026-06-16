import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_colors.dart';
import '../../../models/badge_model.dart';
import '../../../injection_container.dart';
import '../../widgets/badges/badge_detail_widgets.dart';
import '../../widgets/badges/competences_section.dart';
import '../../widgets/goals/goal_duration_sheet.dart';
import '../../widgets/shared/translated_text.dart';
import '../applications/application_page.dart';

class BadgeDetailScreen extends StatefulWidget {
  const BadgeDetailScreen({super.key, required this.badge});

  final BadgeModel badge;

  @override
  State<BadgeDetailScreen> createState() => _BadgeDetailScreenState();
}

class _BadgeDetailScreenState extends State<BadgeDetailScreen> {
  bool _isFavorite = false;
  bool _isAddingGoal = false;
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
      final tr = LanguageScope.of(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(_isFavorite ? tr.tr('badgeSaved') : tr.tr('badgeUnsaved')),
          backgroundColor: _isFavorite ? AppColors.success : AppColors.snackBarNeutral,
          duration: const Duration(seconds: 1),
        ),
      );
    }
  }

  Future<void> _addAsGoal() async {
    if (_isAddingGoal) return;

    final months = await showGoalDurationSheet(context);
    if (months == null || !mounted) return;

    setState(() => _isAddingGoal = true);

    try {
      final startDate = DateTime.now();
      final goalsStore = context.read<GoalsStore>();
      final result = await goalsStore.addBadgeAsGoal(
        badgeId: _badge.id,
        badgeTitle: _badge.title,
        description: _badge.description,
        startDate: startDate,
        endDate: goalEndDateFromMonths(startDate, months),
      );

      if (!mounted) return;
      final tr = LanguageScope.of(context);

      if (result['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(tr.tr('goalAdded')),
            backgroundColor: AppColors.success,
            duration: const Duration(seconds: 2),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message']?.toString() ?? tr.tr('goalAddError')),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isAddingGoal = false);
    }
  }

  void _shareBadge() {
    final badge = _badge;
    final baseUrl = dotenv.env['FRONTEND_URL']?.trim().isNotEmpty == true
        ? dotenv.env['FRONTEND_URL']!.trim()
        : 'https://softinsa.pt';
    final text =
        '${badge.title}\n${badge.description.isNotEmpty ? badge.description : ''}'
        '\n\n$baseUrl/badges/${badge.slug}';
    Clipboard.setData(ClipboardData(text: text));
    if (mounted) {
      final tr = LanguageScope.of(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(tr.tr('linkCopied')),
          backgroundColor: AppColors.snackBarInfo,
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    final badge = _badge;

    return Scaffold(
      backgroundColor: AppColors.pageBackground,
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
                    color: AppColors.navIcon,
                  ),
                  const Spacer(),
                  IconButton(
                    onPressed: _toggleFavorite,
                    icon: Icon(
                      _isFavorite ? Icons.bookmark_rounded : Icons.bookmark_border_rounded,
                      size: 28,
                    ),
                    color: _isFavorite ? AppColors.primary : AppColors.iconMuted,
                  ),
                  IconButton(
                    onPressed: _shareBadge,
                    icon: const Icon(Icons.share_rounded, size: 26),
                    color: AppColors.iconMuted,
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
                        imageUrl: badge.imageUrl,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Center(
                      child: TranslatedText(
                        badge.title,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.w800,
                          color: AppColors.titleDark,
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
                    const SizedBox(height: 10),
                    Center(
                      child: SizedBox(
                        width: double.infinity,
                        height: 48,
                        child: OutlinedButton.icon(
                          onPressed: _isAddingGoal ? null : _addAsGoal,
                          icon: _isAddingGoal
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                )
                              : const Icon(Icons.flag_rounded, size: 20),
                          label: Text(
                            tr.tr('addAsGoal'),
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppColors.secondary,
                            side: BorderSide(color: AppColors.secondary),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    if (badge.description.trim().isNotEmpty) ...[
                      BadgeSectionCard(
                        title: tr.tr('description'),
                        child: TranslatedText(
                          badge.description,
                          textAlign: TextAlign.start,
                          style: const TextStyle(
                            fontSize: 15,
                            height: 1.65,
                            letterSpacing: 0.15,
                            color: AppColors.bodyText,
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
                                        color: AppColors.detailRowText,
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
                      title: tr.tr('details'),
                      child: Column(
                        children: [
                          if (badge.learningPath != null && badge.learningPath!.trim().isNotEmpty)
                            BadgeDetailRow(label: tr.tr('learningPath'), value: badge.learningPath!),
                          if (badge.serviceLine != null && badge.serviceLine!.trim().isNotEmpty)
                            BadgeDetailRow(label: tr.tr('serviceLine'), value: badge.serviceLine!),
                          if (badge.category.trim().isNotEmpty)
                            BadgeDetailRow(label: tr.tr('area'), value: badge.category),
                          if (badge.level.trim().isNotEmpty)
                            BadgeDetailRow(label: tr.tr('level'), value: badge.level),
                          if (badge.points > 0)
                            BadgeDetailRow(label: tr.tr('points'), value: '${badge.points}'),
                          if (badge.duration.trim().isNotEmpty)
                            BadgeDetailRow(label: tr.tr('estimatedDuration'), value: badge.duration),
                          if (badge.expirationDays != null && badge.expirationDays! > 0)
                            BadgeDetailRow(
                              label: tr.tr('validity'),
                              value: tr.tr('validityDays').replaceAll('{days}', '${badge.expirationDays}'),
                            ),
                          BadgeDetailRow(label: tr.tr('badgeType'), value: badge.badgeType),
                          if (badge.createdAt != null)
                            BadgeDetailRow(
                              label: tr.tr('createdAt'),
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
