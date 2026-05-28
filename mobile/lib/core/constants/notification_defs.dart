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
        return const NotificationTypeDisplay(
          label: 'Início',
          icon: Icons.home_outlined,
          color: Color(0xFF5D9FD1),
        );
      case 'BADGES':
        return const NotificationTypeDisplay(
          label: 'Badges',
          icon: Icons.workspace_premium_outlined,
          color: Color(0xFFC7A11D),
        );
      case 'APPLICATIONS':
        return const NotificationTypeDisplay(
          label: 'Candidaturas',
          icon: Icons.description_outlined,
          color: Color(0xFF3B8DBD),
        );
      case 'ACHIEVEMENTS':
        return const NotificationTypeDisplay(
          label: 'Conquistas',
          icon: Icons.emoji_events_outlined,
          color: Color(0xFF4BB62A),
        );
      case 'POINTS':
        return const NotificationTypeDisplay(
          label: 'Pontos',
          icon: Icons.stars_outlined,
          color: Color(0xFF7C5CBF),
        );
      case 'OBJECTIVES':
        return const NotificationTypeDisplay(
          label: 'Objetivos',
          icon: Icons.flag_outlined,
          color: Color(0xFF2E9E4D),
        );
      case 'EVOLUTION':
        return const NotificationTypeDisplay(
          label: 'Evolução',
          icon: Icons.trending_up_rounded,
          color: Color(0xFF39639C),
        );
      case 'ANNOUNCEMENTS':
        return const NotificationTypeDisplay(
          label: 'Anúncios',
          icon: Icons.campaign_outlined,
          color: Color(0xFFD97B27),
        );
      default:
        return const NotificationTypeDisplay(
          label: 'Sistema',
          icon: Icons.settings_outlined,
          color: Color(0xFF5E6C7A),
        );
    }
  }

  static NotificationDisplay getDisplay(int definitionId, {String? url}) {
    switch (definitionId) {
      case applicationSubmitted:
        return const NotificationDisplay(
          icon: Icons.send_rounded,
          color: Color(0xFF5D9FD1),
          label: 'Candidatura Submetida',
        );
      case approvedByTm:
        return const NotificationDisplay(
          icon: Icons.fact_check_outlined,
          color: Color(0xFF3B8DBD),
          label: 'Aprovado pelo Talent Manager',
        );
      case approvedBySll:
        return const NotificationDisplay(
          icon: Icons.verified_rounded,
          color: Color(0xFF4BB62A),
          label: 'Badge Aceite',
        );
      case applicationRejected:
        return const NotificationDisplay(
          icon: Icons.cancel_outlined,
          color: Color(0xFFD94827),
          label: 'Candidatura Rejeitada',
        );
      default:
        return _fallbackFromUrl(url);
    }
  }

  static NotificationDisplay _fallbackFromUrl(String? url) {
    final lower = (url ?? '').toLowerCase();
    if (lower.contains('accept') || lower.contains('approve')) {
      return const NotificationDisplay(
        icon: Icons.check_circle_outline_rounded,
        color: Color(0xFF4BB62A),
        label: 'Aprovado',
      );
    }
    if (lower.contains('reject') || lower.contains('return')) {
      return const NotificationDisplay(
        icon: Icons.cancel_outlined,
        color: Color(0xFFD94827),
        label: 'Rejeitado',
      );
    }
    if (lower.contains('expir')) {
      return const NotificationDisplay(
        icon: Icons.timer_off_outlined,
        color: Color(0xFFC6A12A),
        label: 'Expiração',
      );
    }
    return NotificationDisplay(
      icon: Icons.notifications_outlined,
      color: AppColors.onSurface,
      label: 'Notificação',
    );
  }
}
