import 'package:flutter/material.dart';

import '../../../core/sync_manager.dart';
import '../../../models/badge_model.dart';
import '../../widgets/shared/app_bottom_nav_bar.dart';
import '../../widgets/badges/badge_catalog.dart';
import '../../widgets/badges/attached_files_list.dart';
import '../../widgets/badges/recommended_badge_card.dart';
import '../../widgets/applications/application_status_widgets.dart';
import '../badges/badges_page.dart';

class CandidaturaStatusScreen extends StatelessWidget {
  const CandidaturaStatusScreen({
    super.key,
    required this.badge,
    required this.attachedFiles,
  });

  final BadgeModel badge;
  final List<AttachedDocument> attachedFiles;

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    final similarBadges = BadgeCatalog.all
        .where((item) => item.title != badge.title)
        .take(3)
        .toList();

    return Scaffold(
      backgroundColor: StatusColors.pageBackground,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(10, 10, 10, 18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 6,
                  vertical: 10,
                ),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.arrow_back, size: 24),
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        tr.tr('applicationStatusTitle'),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w600,
                          color: StatusColors.primaryText,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
                decoration: BoxDecoration(
                  color: StatusColors.cardBackground,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Column(
                  children: [
                    Text(
                      tr
                          .tr('applicationStatusForBadge')
                          .replaceAll('{badge}', badge.title),
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: StatusColors.primaryText,
                      ),
                    ),
                    const SizedBox(height: 12),
                    const StatusProgressStepper(),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Text(
                tr.tr('latestUpdates'),
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: StatusColors.primaryText,
                ),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  const Icon(
                    Icons.sync_alt_rounded,
                    color: StatusColors.primaryAction,
                    size: 18,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      tr.tr('applicationInReviewBySll'),
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: StatusColors.highlightText,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  const Icon(
                    Icons.history_toggle_off_rounded,
                    color: StatusColors.primaryAction,
                    size: 18,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    tr.tr('applicationStatusTimestamp'),
                    style: const TextStyle(
                      fontSize: 14,
                      color: StatusColors.secondaryText,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                tr.tr('notes'),
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: StatusColors.primaryText,
                ),
              ),
              const SizedBox(height: 6),
              Text.rich(
                TextSpan(
                  style: const TextStyle(
                    color: StatusColors.primaryText,
                    fontSize: 14,
                    height: 1.35,
                  ),
                  children: [
                    TextSpan(
                      text: '${tr.tr('talentManagerLabel')}: ',
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    TextSpan(
                      text: tr.tr('applicationStatusPlaceholderNote'),
                      style: const TextStyle(fontStyle: FontStyle.italic),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              StatusInfoExpansion(attributes: badge.attributes),
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: StatusColors.cardBackground,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      tr.tr('attachedFiles'),
                      style: const TextStyle(
                        color: StatusColors.primaryText,
                        fontWeight: FontWeight.w700,
                        fontSize: 15,
                      ),
                    ),
                    const SizedBox(height: 8),
                    AttachedFilesList(files: attachedFiles, readOnly: true),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              StatusRequirementsExpansion(requirements: badge.requirements),
              const SizedBox(height: 12),
              Text(
                tr.tr('similarBadges'),
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: StatusColors.primaryText,
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                height: 192,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: similarBadges.length,
                  itemBuilder: (context, index) {
                    final item = similarBadges[index];
                    return RecommendedBadgeCard(
                      title: item.title,
                      area: item.category,
                      medalColor: item.medalColor,
                      ribbonColor: item.ribbonColor,
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => BadgeDetailScreen(badge: item),
                          ),
                        );
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
