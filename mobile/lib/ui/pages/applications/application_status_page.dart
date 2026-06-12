import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../injection_container.dart';
import '../../../models/badge_model.dart';
import '../../widgets/badges/attached_files_list.dart';
import '../../widgets/badges/recommended_badge_card.dart';
import '../../widgets/applications/application_detail_widgets.dart';
import '../badges/badges_page.dart';

class CandidaturaStatusScreen extends StatelessWidget {
  const CandidaturaStatusScreen({
    super.key,
    required this.badge,
    required this.attachedFiles,
    this.applicationState = 'Submitted',
    this.latestObservation,
    this.submittedAt,
    this.rejectedByRole,
  });

  final BadgeModel badge;
  final List<AttachedDocument> attachedFiles;
  final String applicationState;
  final String? latestObservation;
  final DateTime? submittedAt;
  final String? rejectedByRole;

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    final badgeStore = context.read<BadgeStore>();
    final similarBadges = badgeStore.similarTo(badge);

    return Scaffold(
      backgroundColor: const Color(0xFFF0F3F6),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
              child: Row(
                children: [
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.arrow_back, size: 24),
                  ),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      tr.tr('applicationStatusTitle'),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF1D2A35),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(14, 0, 14, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ApplicationDetailHeader(
                      badge: badge,
                      stateLabel: _stateLabel(tr),
                      stateColor: _stateColor(),
                    ),
                    const SizedBox(height: 14),
                    ApplicationProgressStepper(
                      applicationState: applicationState,
                      rejectedByRole: rejectedByRole,
                    ),
                    if (latestObservation != null &&
                        latestObservation!.trim().isNotEmpty) ...[
                      const SizedBox(height: 14),
                      ApplicationInfoSection(
                        submittedAt: submittedAt,
                        openedAt: null,
                        latestObservation: latestObservation,
                      ),
                    ],
                    if (attachedFiles.isNotEmpty) ...[
                      const SizedBox(height: 14),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: const [
                            BoxShadow(
                              color: Color(0x0A000000),
                              blurRadius: 8,
                              offset: Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              tr.tr('attachedFiles'),
                              style: const TextStyle(
                                fontSize: 17,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF1D2A35),
                              ),
                            ),
                            const SizedBox(height: 10),
                            AttachedFilesList(
                              files: attachedFiles,
                              readOnly: true,
                            ),
                          ],
                        ),
                      ),
                    ],
                    if (similarBadges.isNotEmpty) ...[
                      const SizedBox(height: 18),
                      Text(
                        tr.tr('similarBadges'),
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF1D2A35),
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
                                    builder: (_) =>
                                        BadgeDetailScreen(badge: item),
                                  ),
                                );
                              },
                            );
                          },
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _stateLabel(LanguageController tr) {
    final n = applicationState.toLowerCase();
    if (n.contains('accepted') || n.contains('approved') || n.contains('aprov')) {
      return tr.tr('stateApprovedF');
    }
    if (n.contains('reject') || n.contains('rejeit') || n.contains('devolv')) {
      return tr.tr('stateRejectedF');
    }
    if (n.contains('validation') || n.contains('valida')) {
      return tr.tr('stateInValidationF');
    }
    if (n.contains('submitted') || n.contains('submet')) {
      return tr.tr('stateSubmittedF');
    }
    return tr.tr('stateInAnalysis');
  }

  Color _stateColor() {
    final n = applicationState.toLowerCase();
    if (n.contains('accepted') || n.contains('approved') || n.contains('aprov')) {
      return const Color(0xFF59C13E);
    }
    if (n.contains('reject') || n.contains('rejeit') || n.contains('devolv')) {
      return const Color(0xFFD94A2A);
    }
    return const Color(0xFFC9A625);
  }
}
