import 'package:flutter/material.dart';

import '../../../core/sync_manager.dart';
import '../../../core/theme/app_colors.dart';
import 'badge_image.dart';
import '../shared/translated_text.dart';
import '../../../models/badge_model.dart';
import '../shared/app_icon/app_icon.dart';
import '../shared/app_icon/app_icon_data.dart';

class BadgeDetailTabButton extends StatelessWidget {
  const BadgeDetailTabButton({
    super.key,
    required this.title,
    required this.isActive,
    required this.onTap,
  });

  final String title;
  final bool isActive;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Text(
              title,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: Color(0xFF202020),
              ),
            ),
          ),
          Container(
            height: 3,
            color: isActive ? const Color(0xFF63B3E0) : const Color(0xFFAEB7C0),
          ),
        ],
      ),
    );
  }
}

class BadgeRequirementsSection extends StatelessWidget {
  const BadgeRequirementsSection({super.key, required this.requirements});

  final List<BadgeRequirement> requirements;

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 10),
      padding: const EdgeInsets.fromLTRB(14, 16, 14, 14),
      decoration: BoxDecoration(
        color: const Color(0xFFDDE2E7),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Text(
              tr.tr('requirements'),
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700),
            ),
          ),
          const SizedBox(height: 14),
          ...requirements.map(
            (requirement) => Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  AppIcon(requirement.icon, color: const Color(0xFF3A444C)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TranslatedText(
                      requirement.text,
                      style: const TextStyle(
                        fontSize: 16,
                        color: Color(0xFF2A2A2A),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  const AppIcon(
                    AppIcons.link,
                    color: Color(0xFF4B535A),
                    size: 22,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class BadgeInfoChip extends StatelessWidget {
  const BadgeInfoChip({super.key, required this.icon, required this.label});

  final String icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 4),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFFDDE2E7),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          AppIcon(icon, size: 16, color: const Color(0xFF3F5662)),
          const SizedBox(width: 5),
          Flexible(
            child: TranslatedText(
              label,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: Color(0xFF2A3640),
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}

class LargeBadgeIcon extends StatelessWidget {
  const LargeBadgeIcon({
    super.key,
    required this.medalColor,
    required this.ribbonColor,
    this.imageUrl,
  });

  final Color medalColor;
  final Color ribbonColor;

  /// The badge's actual (SVG) artwork; falls back to a generic badge icon.
  final String? imageUrl;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 142,
      height: 150,
      child: Center(
        child: BadgeImage(
          imageUrl: imageUrl,
          size: 130,
          fallbackColor: medalColor,
        ),
      ),
    );
  }
}

class BadgeInfoTag extends StatelessWidget {
  const BadgeInfoTag({super.key, required this.icon, required this.label});

  final String icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    // Cap the tag width so a long area name ellipsizes instead of overflowing
    // the screen when laid out inside a Wrap.
    final maxWidth = MediaQuery.of(context).size.width * 0.8;

    return ConstrainedBox(
      constraints: BoxConstraints(maxWidth: maxWidth),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFDDE2E8)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            AppIcon(icon, size: 15, color: const Color(0xFF4A5C6A)),
            const SizedBox(width: 6),
            Flexible(
              child: TranslatedText(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF2A3640),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class BadgeSectionCard extends StatelessWidget {
  const BadgeSectionCard({super.key, required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
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
            title,
            style: const TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w700,
              color: Color(0xFF1A1F25),
            ),
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

class BadgeDetailRow extends StatelessWidget {
  const BadgeDetailRow({super.key, required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Color(0xFF7A8894),
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1E2932),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class BadgeRewardsSection extends StatelessWidget {
  const BadgeRewardsSection({
    super.key,
    required this.badge,
    required this.hasObtained,
  });

  final BadgeModel badge;
  final bool hasObtained;

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    final specialTitleReward = badge.rewards
        .where((r) => r.specialTitle != null && r.specialTitle!.isNotEmpty)
        .toList();
    final specialTitle = specialTitleReward.isNotEmpty
        ? specialTitleReward.first.specialTitle!
        : (badge.serviceLine != null
            ? 'Pioneiro ${badge.serviceLine} Softinsa'
            : 'Especialista Softinsa');

    return BadgeSectionCard(
      title: tr.tr('rewardsTitle'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TranslatedText(
            tr.tr('rewardsDescription'),
            style: const TextStyle(
              fontSize: 13,
              color: Color(0xFF6B7986),
              height: 1.5,
            ),
          ),
          const SizedBox(height: 14),
          _RewardRow(
            icon: AppIcons.certificate,
            title: tr.tr('rewardCertificatePdf'),
            subtitle: tr.tr('rewardCertificateDesc'),
            obtained: hasObtained,
          ),
          const SizedBox(height: 10),
          _RewardRow(
            icon: AppIcons.certificate,
            title: tr.tr('rewardSpecialTitle'),
            subtitle: '"$specialTitle"',
            obtained: hasObtained,
          ),
        ],
      ),
    );
  }
}

class _RewardRow extends StatelessWidget {
  const _RewardRow({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.obtained,
  });

  final String icon;
  final String title;
  final String subtitle;
  final bool obtained;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: obtained
            ? AppColors.success.withValues(alpha: 0.04)
            : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: obtained
              ? AppColors.success.withValues(alpha: 0.25)
              : const Color(0xFFE2E8EE),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: obtained
                  ? AppColors.success.withValues(alpha: 0.1)
                  : const Color(0xFFEDF2F7),
              borderRadius: BorderRadius.circular(10),
            ),
            alignment: Alignment.center,
            child: AppIcon(
              obtained ? AppIcons.checkCircle : AppIcons.lock,
              size: 20,
              color: obtained ? AppColors.success : const Color(0xFF9CAAB6),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1A1F25),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontSize: 13,
                    color: Color(0xFF7A8894),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
