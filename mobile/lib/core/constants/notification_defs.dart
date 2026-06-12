import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

class NotificationDisplay {
  const NotificationDisplay({
    required this.icon,
    required this.color,
    required this.label,
  });

  final IconData icon;
  final Color color;
  final String label;
}

class NotificationTypeDisplay {
  const NotificationTypeDisplay({
    required this.label,
    required this.icon,
    required this.color,
  });

  final String label;
  final IconData icon;
  final Color color;
}

abstract class NotificationDefs {
  static const int applicationSubmitted = 1;
  static const int approvedByTm = 2;
  static const int approvedBySll = 3;
  static const int applicationRejected = 4;

  static const List<String> allTypes = [
    'APPLICATIONS',
    'BADGES',
    'ACHIEVEMENTS',
    'POINTS',
    'ANNOUNCEMENTS',
    'SYSTEM',
  ];

  static NotificationTypeDisplay getTypeDisplay(String type) {
    switch (type.toUpperCase()) {
      case 'HOME':
        return NotificationTypeDisplay(
          label: 'notifTypeHome',
          icon: Icons.home_outlined,
          color: AppColors.notifHome,
        );
      case 'BADGES':
        return NotificationTypeDisplay(
          label: 'notifTypeBadges',
          icon: Icons.workspace_premium_outlined,
          color: AppColors.notifBadges,
        );
      case 'APPLICATIONS':
        return NotificationTypeDisplay(
          label: 'notifTypeApplications',
          icon: Icons.description_outlined,
          color: AppColors.notifApplications,
        );
      case 'ACHIEVEMENTS':
        return NotificationTypeDisplay(
          label: 'notifTypeAchievements',
          icon: Icons.emoji_events_outlined,
          color: AppColors.notifAchievements,
        );
      case 'POINTS':
        return NotificationTypeDisplay(
          label: 'notifTypePoints',
          icon: Icons.stars_outlined,
          color: AppColors.notifPoints,
        );
      case 'OBJECTIVES':
        return NotificationTypeDisplay(
          label: 'notifTypeObjectives',
          icon: Icons.flag_outlined,
          color: AppColors.notifObjectives,
        );
      case 'EVOLUTION':
        return NotificationTypeDisplay(
          label: 'notifTypeEvolution',
          icon: Icons.trending_up_rounded,
          color: AppColors.secondary,
        );
      case 'ANNOUNCEMENTS':
        return NotificationTypeDisplay(
          label: 'notifTypeAnnouncements',
          icon: Icons.campaign_outlined,
          color: AppColors.notifAnnouncements,
        );
      default:
        return NotificationTypeDisplay(
          label: 'notifTypeSystem',
          icon: Icons.settings_outlined,
          color: AppColors.notifSystem,
        );
    }
  }

  static NotificationDisplay getDisplay(int definitionId, {String? url}) {
    switch (definitionId) {
      case applicationSubmitted:
        return NotificationDisplay(
          icon: Icons.send_rounded,
          color: AppColors.notifSubmitted,
          label: 'notifApplicationSubmitted',
        );
      case approvedByTm:
        return NotificationDisplay(
          icon: Icons.fact_check_outlined,
          color: AppColors.notifApprovedTm,
          label: 'notifApprovedByTm',
        );
      case approvedBySll:
        return NotificationDisplay(
          icon: Icons.verified_rounded,
          color: AppColors.notifAccepted,
          label: 'notifBadgeAccepted',
        );
      case applicationRejected:
        return NotificationDisplay(
          icon: Icons.cancel_outlined,
          color: AppColors.notifRejected,
          label: 'notifApplicationRejected',
        );
      default:
        return _fallbackFromUrl(url);
    }
  }

  static NotificationDisplay _fallbackFromUrl(String? url) {
    final lower = (url ?? '').toLowerCase();
    if (lower.contains('accept') || lower.contains('approve')) {
      return NotificationDisplay(
        icon: Icons.check_circle_outline_rounded,
        color: AppColors.notifAccepted,
        label: 'notifApproved',
      );
    }
    if (lower.contains('reject') || lower.contains('return')) {
      return NotificationDisplay(
        icon: Icons.cancel_outlined,
        color: AppColors.notifRejected,
        label: 'notifRejected',
      );
    }
    if (lower.contains('expir')) {
      return NotificationDisplay(
        icon: Icons.timer_off_outlined,
        color: AppColors.notifExpired,
        label: 'notifExpiration',
      );
    }
    return NotificationDisplay(
      icon: Icons.notifications_outlined,
      color: AppColors.onSurface,
      label: 'notifGeneric',
    );
  }
}
