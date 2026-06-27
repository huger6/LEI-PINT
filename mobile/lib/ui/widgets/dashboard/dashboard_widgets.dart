import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../models/goal_model.dart';
import '../../../models/reward_model.dart';
import '../shared/app_icon/app_icon.dart';
import '../shared/app_icon/app_icon_data.dart';
import '../shared/translated_text.dart';

class DashboardTopBar extends StatelessWidget {
  const DashboardTopBar({
    super.key,
    required this.totalPoints,
    required this.onPointsTap,
    required this.onNotificationsTap,
    this.onGoalsTap,
    this.hasUnread = false,
  });

  final int totalPoints;
  final VoidCallback onPointsTap;
  final VoidCallback onNotificationsTap;
  final VoidCallback? onGoalsTap;
  final bool hasUnread;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        InkWell(
          onTap: onPointsTap,
          borderRadius: BorderRadius.circular(14),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF6DC1E3), Color(0xFF658CC9)],
              ),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: [
                Text(
                  '$totalPoints',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 17,
                  ),
                ),
                const SizedBox(width: 8),
                const AppIcon(
                  AppIcons.starPoints,
                  color: Colors.white,
                  size: 20,
                ),
              ],
            ),
          ),
        ),
        const Spacer(),
        if (onGoalsTap != null) ...[
          GestureDetector(
            onTap: onGoalsTap,
            child: Container(
              width: 42,
              height: 42,
              decoration: const BoxDecoration(
                color: Color(0xFFD2DAE2),
                shape: BoxShape.circle,
              ),
              child: const AppIcon(
                AppIcons.target,
                color: Color(0xFF20252B),
              ),
            ),
          ),
          const SizedBox(width: 10),
        ],
        GestureDetector(
          onTap: onNotificationsTap,
          child: Stack(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: const BoxDecoration(
                  color: Color(0xFFD2DAE2),
                  shape: BoxShape.circle,
                ),
                child: const AppIcon(
                  AppIcons.bell,
                  color: Color(0xFF20252B),
                ),
              ),
              if (hasUnread)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(
                      color: Color(0xFFDE5A6A),
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
            ],
          ),
        ),


      ],
    );
  }
}

class DashboardSubmissionData {
  const DashboardSubmissionData({
    required this.title,
    required this.status,
    required this.statusColor,
    required this.timestamp,
    required this.medalColor,
    required this.ribbonColor,
  });

  final String title;
  final String status;
  final Color statusColor;
  final String timestamp;
  final Color medalColor;
  final Color ribbonColor;
}

class DashboardMetaRow extends StatelessWidget {
  const DashboardMetaRow({
    super.key,
    this.serviceLineName,
    this.primaryAreaName,
  });

  final String? serviceLineName;
  final String? primaryAreaName;

  @override
  Widget build(BuildContext context) {
    if (serviceLineName == null && primaryAreaName == null) {
      return const SizedBox.shrink();
    }

    return Padding(
      padding: const EdgeInsets.only(top: 6),
      child: Wrap(
        spacing: 12,
        runSpacing: 6,
        children: [
          if (serviceLineName != null && serviceLineName!.isNotEmpty)
            _MetaChip(
              icon: AppIcons.area,
              label: serviceLineName!,
            ),
          if (primaryAreaName != null && primaryAreaName!.isNotEmpty)
            _MetaChip(
              icon: AppIcons.badge,
              label: primaryAreaName!,
            ),
        ],
      ),
    );
  }
}

class _MetaChip extends StatelessWidget {
  const _MetaChip({required this.icon, required this.label});

  final String icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: const Color(0xFFD2DAE2),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          AppIcon(icon, color: const Color(0xFF3A4550), size: 14),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: Color(0xFF3A4550),
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}

class DashboardKpiRow extends StatelessWidget {
  const DashboardKpiRow({
    super.key,
    required this.badgesEarned,
    required this.objectivesCount,
    required this.badgesLabel,
    required this.objectivesLabel,
    this.onBadgesTap,
    this.onObjectivesTap,
  });

  final int badgesEarned;
  final int objectivesCount;
  final String badgesLabel;
  final String objectivesLabel;
  final VoidCallback? onBadgesTap;
  final VoidCallback? onObjectivesTap;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _KpiCard(
            label: badgesLabel,
            value: '$badgesEarned',
            icon: AppIcons.badge,
            accentColor: AppColors.primary,
            onTap: onBadgesTap,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _KpiCard(
            label: objectivesLabel,
            value: '$objectivesCount',
            icon: AppIcons.target,
            accentColor: AppColors.secondary,
            onTap: onObjectivesTap,
          ),
        ),
      ],
    );
  }
}

class _KpiCard extends StatelessWidget {
  const _KpiCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.accentColor,
    this.onTap,
  });

  final String label;
  final String value;
  final String icon;
  final Color accentColor;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF1A2530).withValues(alpha: 0.06),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: accentColor.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: AppIcon(icon, color: accentColor, size: 20),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    value,
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      color: accentColor,
                    ),
                  ),
                  Text(
                    label,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF6D7A85),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class ContinueObjectiveBanner extends StatelessWidget {
  const ContinueObjectiveBanner({
    super.key,
    required this.goal,
    required this.continueLabel,
    required this.proposedLabel,
    required this.resumeLabel,
    required this.startLabel,
    required this.onTap,
  });

  final GoalModel goal;
  final String continueLabel;
  final String proposedLabel;
  final String resumeLabel;
  final String startLabel;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final hasApplication = goal.applicationId != null;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: AppColors.primary.withValues(alpha: 0.3),
          ),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF1A2530).withValues(alpha: 0.05),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const AppIcon(
                AppIcons.target,
                color: AppColors.primary,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    hasApplication ? continueLabel : proposedLabel,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF6D7A85),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    goal.title,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF20252B),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                hasApplication ? resumeLabel : startLabel,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class DashboardRewardCard extends StatelessWidget {
  const DashboardRewardCard({
    super.key,
    required this.reward,
    required this.pointsLabel,
    this.onTap,
  });

  final RewardModel reward;
  final String pointsLabel;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 150,
        margin: const EdgeInsets.only(right: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: const [
            BoxShadow(
              color: Color(0x10000000),
              blurRadius: 6,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(14)),
              child: reward.imgUrl != null && reward.imgUrl!.isNotEmpty
                  ? Image.network(
                      reward.imgUrl!,
                      height: 80,
                      width: double.infinity,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => _buildPlaceholder(),
                    )
                  : _buildPlaceholder(),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TranslatedText(
                    reward.rewardName,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF20252B),
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const AppIcon(
                        AppIcons.starPoints,
                        size: 14,
                        color: AppColors.warning,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${reward.costPoints} $pointsLabel',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF6D7A85),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlaceholder() {
    return Container(
      height: 80,
      width: double.infinity,
      color: const Color(0xFFE8EDF2),
      child: const Center(
        child: AppIcon(
          AppIcons.certificate,
          size: 28,
          color: Color(0xFFADB8C3),
        ),
      ),
    );
  }
}
