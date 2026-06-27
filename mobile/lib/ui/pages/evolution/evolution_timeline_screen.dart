import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../models/timeline_event.dart';
import '../../../models/user_model.dart';
import '../../../presentation/state/auth_store.dart';
import '../../../presentation/state/badge_store.dart';
import '../../../presentation/state/dashboard_store.dart';
import '../../../presentation/state/language_controller.dart';
import '../../widgets/evolution/timeline_widgets.dart';
import '../../widgets/shared/app_icon/app_icon.dart';
import '../../widgets/shared/app_icon/app_icon_data.dart';

/// A chronological activity feed of the consultant's evolution (account
/// creation, points gained, badges earned), newest first — GitHub-style.
class EvolutionTimelineScreen extends StatefulWidget {
  const EvolutionTimelineScreen({super.key});

  @override
  State<EvolutionTimelineScreen> createState() =>
      _EvolutionTimelineScreenState();
}

class _EvolutionTimelineScreenState extends State<EvolutionTimelineScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final authStore = context.read<AuthStore>();
      context.read<BadgeStore>().loadEarnedBadges();
      context.read<DashboardStore>().loadDashboard(authStore.currentUser);
    });
  }

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    final badgeStore = context.watch<BadgeStore>();
    final dashStore = context.watch<DashboardStore>();
    final user = context.watch<AuthStore>().currentUser;

    final events = _buildEvents(badgeStore, dashStore, user, tr);
    final isLoading = events.isEmpty &&
        (badgeStore.isLoadingEarned || dashStore.isLoading);

    return Scaffold(
      backgroundColor: const Color(0xFFE6EBF0),
      appBar: AppBar(
        backgroundColor: const Color(0xFFE6EBF0),
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const AppIcon(
            AppIcons.chevronBackward,
            color: Color(0xFF1E2932),
            size: 22,
          ),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          tr.tr('timelineTitle'),
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w800,
            color: Color(0xFF1E2932),
          ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: isLoading
            ? const Center(child: CircularProgressIndicator())
            : events.isEmpty
                ? _buildEmptyState(tr)
                : RefreshIndicator(
                    onRefresh: () async {
                      final authStore = context.read<AuthStore>();
                      await context
                          .read<BadgeStore>()
                          .loadEarnedBadges(forceRefresh: true);
                      await context
                          .read<DashboardStore>()
                          .loadDashboard(authStore.currentUser);
                    },
                    child: ListView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
                      itemCount: events.length,
                      itemBuilder: (context, index) {
                        return TimelineEventTile(
                          event: events[index],
                          isFirst: index == 0,
                          isLast: index == events.length - 1,
                        );
                      },
                    ),
                  ),
      ),
    );
  }

  Widget _buildEmptyState(LanguageController tr) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AppIcon(AppIcons.evolution, size: 48, color: Colors.grey[400]),
            const SizedBox(height: 12),
            Text(
              tr.tr('timelineEmpty'),
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 15,
                color: Colors.grey[600],
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Aggregates events from earned badges, points history and (when available)
  /// the account registration date, sorted by date descending.
  List<TimelineEvent> _buildEvents(
    BadgeStore badgeStore,
    DashboardStore dashStore,
    UserModel? user,
    LanguageController tr,
  ) {
    final events = <TimelineEvent>[];

    // Badges earned.
    for (final eb in badgeStore.earnedBadges) {
      final pts = eb.award.pointsSnapshot ?? eb.badge.points;
      events.add(TimelineEvent(
        type: TimelineEventType.badgeEarned,
        date: eb.award.awardedAt,
        title: tr.tr('timelineBadgeEarned'),
        subtitle: eb.badge.title,
        points: pts > 0 ? pts : null,
      ));
    }

    // Points gained (granular history entries).
    for (final entry in dashStore.pointsHistory) {
      final date = DateTime.tryParse(entry['created_at']?.toString() ?? '');
      if (date == null) continue;

      final delta = entry['points_delta'] is int
          ? entry['points_delta'] as int
          : int.tryParse(entry['points_delta']?.toString() ?? '') ?? 0;
      if (delta == 0) continue;

      events.add(TimelineEvent(
        type: TimelineEventType.pointsGained,
        date: date,
        title: tr.tr('timelinePointsGained').replaceAll('{points}', '$delta'),
        subtitle: _pointsReason(entry),
      ));
    }

    // Account registration — always shown. Uses the profile date when
    // available, otherwise falls back to the oldest known activity.
    DateTime? regDate = user?.registeredAt;
    if (regDate == null && events.isNotEmpty) {
      regDate = events
          .map((e) => e.date)
          .reduce((a, b) => a.isBefore(b) ? a : b);
    }
    regDate ??= DateTime.now();

    events.add(TimelineEvent(
      type: TimelineEventType.registration,
      date: regDate,
      title: tr.tr('timelineRegistration'),
    ));

    events.sort((a, b) => b.date.compareTo(a.date));
    return events;
  }

  /// Best available human reason for a points-history entry (requirement title,
  /// badge title or free-text justification).
  String? _pointsReason(Map<String, dynamic> entry) {
    final requirement = entry['requirement'];
    if (requirement is Map) {
      final reqTitle = (requirement['requirement_title'] ?? '').toString();
      if (reqTitle.trim().isNotEmpty) return reqTitle;
    }
    final badge = entry['badge'];
    if (badge is Map) {
      final badgeTitle =
          (badge['badge_title'] ?? badge['title'] ?? '').toString();
      if (badgeTitle.trim().isNotEmpty) return badgeTitle;
    }
    final justification = (entry['justification'] ?? '').toString();
    return justification.trim().isEmpty ? null : justification;
  }
}
