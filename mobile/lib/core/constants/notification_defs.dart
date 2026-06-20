import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../../ui/widgets/shared/app_icon/app_icon_data.dart';

class NotificationDisplay {
  const NotificationDisplay({
    required this.icon,
    required this.color,
    required this.label,
  });

  final String icon;
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
  final String icon;
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
          icon: AppIcons.home,
          color: AppColors.notifHome,
        );
      case 'BADGES':
        return NotificationTypeDisplay(
          label: 'notifTypeBadges',
          icon: AppIcons.badgePremium,
          color: AppColors.notifBadges,
        );
      case 'APPLICATIONS':
        return NotificationTypeDisplay(
          label: 'notifTypeApplications',
          icon: AppIcons.paper,
          color: AppColors.notifApplications,
        );
      case 'ACHIEVEMENTS':
        return NotificationTypeDisplay(
          label: 'notifTypeAchievements',
          icon: AppIcons.trophy,
          color: AppColors.notifAchievements,
        );
      case 'POINTS':
        return NotificationTypeDisplay(
          label: 'notifTypePoints',
          icon: AppIcons.starPoints,
          color: AppColors.notifPoints,
        );
      case 'OBJECTIVES':
        return NotificationTypeDisplay(
          label: 'notifTypeObjectives',
          icon: AppIcons.type,
          color: AppColors.notifObjectives,
        );
      case 'EVOLUTION':
        return NotificationTypeDisplay(
          label: 'notifTypeEvolution',
          icon: AppIcons.progress,
          color: AppColors.secondary,
        );
      case 'ANNOUNCEMENTS':
        return NotificationTypeDisplay(
          label: 'notifTypeAnnouncements',
          icon: AppIcons.megaphone,
          color: AppColors.notifAnnouncements,
        );
      default:
        return NotificationTypeDisplay(
          label: 'notifTypeSystem',
          icon: AppIcons.settings,
          color: AppColors.notifSystem,
        );
    }
  }

  static NotificationDisplay getDisplay(int definitionId, {String? url}) {
    switch (definitionId) {
      case applicationSubmitted:
        return NotificationDisplay(
          icon: AppIcons.send,
          color: AppColors.notifSubmitted,
          label: 'notifApplicationSubmitted',
        );
      case approvedByTm:
        return NotificationDisplay(
          icon: AppIcons.certificate,
          color: AppColors.notifApprovedTm,
          label: 'notifApprovedByTm',
        );
      case approvedBySll:
        return NotificationDisplay(
          icon: AppIcons.skills,
          color: AppColors.notifAccepted,
          label: 'notifBadgeAccepted',
        );
      case applicationRejected:
        return NotificationDisplay(
          icon: AppIcons.closeCircle,
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
        icon: AppIcons.checkCircle,
        color: AppColors.notifAccepted,
        label: 'notifApproved',
      );
    }
    if (lower.contains('reject') || lower.contains('return')) {
      return NotificationDisplay(
        icon: AppIcons.closeCircle,
        color: AppColors.notifRejected,
        label: 'notifRejected',
      );
    }
    if (lower.contains('expir')) {
      return NotificationDisplay(
        icon: AppIcons.clock,
        color: AppColors.notifExpired,
        label: 'notifExpiration',
      );
    }
    return NotificationDisplay(
      icon: AppIcons.bell,
      color: AppColors.onSurface,
      label: 'notifGeneric',
    );
  }
}
