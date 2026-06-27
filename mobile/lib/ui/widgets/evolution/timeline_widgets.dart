import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../models/timeline_event.dart';
import '../shared/app_icon/app_icon.dart';
import '../shared/app_icon/app_icon_data.dart';
import '../shared/translated_text.dart';

/// A single entry in the evolution timeline: a node + connecting rail on the
/// left and a content card on the right (GitHub-style activity feed).
class TimelineEventTile extends StatelessWidget {
  const TimelineEventTile({
    super.key,
    required this.event,
    this.isFirst = false,
    this.isLast = false,
  });

  final TimelineEvent event;
  final bool isFirst;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    final accent = _accentColor(event.type);

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _Rail(icon: _icon(event.type), accent: accent, isFirst: isFirst, isLast: isLast),
          const SizedBox(width: 12),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: _EventCard(event: event, accent: accent),
            ),
          ),
        ],
      ),
    );
  }

  static String _icon(TimelineEventType type) {
    switch (type) {
      case TimelineEventType.registration:
        return AppIcons.user;
      case TimelineEventType.badgeEarned:
        return AppIcons.badge;
      case TimelineEventType.pointsGained:
        return AppIcons.starPoints;
    }
  }

  static Color _accentColor(TimelineEventType type) {
    switch (type) {
      case TimelineEventType.registration:
        return AppColors.secondary;
      case TimelineEventType.badgeEarned:
        return AppColors.notifBadges;
      case TimelineEventType.pointsGained:
        return AppColors.notifPoints;
    }
  }
}

class _Rail extends StatelessWidget {
  const _Rail({
    required this.icon,
    required this.accent,
    required this.isFirst,
    required this.isLast,
  });

  final String icon;
  final Color accent;
  final bool isFirst;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    const lineColor = Color(0xFFD7DEE6);

    return SizedBox(
      width: 38,
      child: Column(
        children: [
          // Connector above the node.
          SizedBox(
            height: 4,
            child: isFirst
                ? const SizedBox.shrink()
                : Container(width: 2, color: lineColor),
          ),
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: accent.withValues(alpha: 0.15),
              shape: BoxShape.circle,
              border: Border.all(color: accent, width: 1.6),
            ),
            child: AppIcon(icon, size: 18, color: accent),
          ),
          // Connector below the node (fills remaining height).
          Expanded(
            child: isLast
                ? const SizedBox.shrink()
                : Container(width: 2, color: lineColor),
          ),
        ],
      ),
    );
  }
}

class _EventCard extends StatelessWidget {
  const _EventCard({required this.event, required this.accent});

  final TimelineEvent event;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: const [
          BoxShadow(
            color: Color(0x12000000),
            blurRadius: 8,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  event.title,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1E2932),
                  ),
                ),
              ),
              if (event.points != null && event.points != 0) ...[
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: accent.withValues(alpha: 0.14),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '+${event.points} pts',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: accent,
                    ),
                  ),
                ),
              ],
            ],
          ),
          if (event.subtitle != null && event.subtitle!.trim().isNotEmpty) ...[
            const SizedBox(height: 4),
            TranslatedText(
              event.subtitle!,
              style: const TextStyle(
                fontSize: 13,
                color: Color(0xFF5B6773),
                height: 1.3,
              ),
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
          ],
          const SizedBox(height: 8),
          Text(
            _formatDate(event.date),
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Color(0xFF8A95A0),
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    final d = date.toLocal();
    final day = d.day.toString().padLeft(2, '0');
    final month = d.month.toString().padLeft(2, '0');
    return '$day/$month/${d.year}';
  }
}
