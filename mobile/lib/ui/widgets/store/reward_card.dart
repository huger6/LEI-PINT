import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../models/reward_model.dart';
import '../../../presentation/state/language_controller.dart';
import '../shared/translated_text.dart';
import '../shared/app_icon/app_icon.dart';
import '../shared/app_icon/app_icon_data.dart';

class RewardCard extends StatelessWidget {
  const RewardCard({
    super.key,
    required this.reward,
    required this.affordable,
    required this.onRedeem,
  });

  final RewardModel reward;
  final bool affordable;
  final VoidCallback onRedeem;

  static const _categoryStyle = <String, _CategoryLook>{
    'course': _CategoryLook(AppIcons.certificate, Color(0xFFE3F2FD), AppColors.primary),
    'voucher': _CategoryLook(AppIcons.starPoints, Color(0xFFFFF3E0), AppColors.warning),
    'title': _CategoryLook(AppIcons.certificate, Color(0xFFF3E5F5), Color(0xFF7B1FA2)),
    'physical': _CategoryLook(AppIcons.trophy, Color(0xFFE8F5E9), AppColors.success),
    'subscription': _CategoryLook(AppIcons.skills, Color(0xFFE3F2FD), AppColors.secondary),
  };

  static const _defaultStyle =
      _CategoryLook(AppIcons.certificate, Color(0xFFE3F2FD), AppColors.primary);

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    final cs = _categoryStyle[reward.rewardCategory] ?? _defaultStyle;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
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
          if (reward.imgUrl != null && reward.imgUrl!.isNotEmpty)
            ClipRRect(
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(16)),
              child: Image.network(
                reward.imgUrl!,
                height: 120,
                width: double.infinity,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => _buildIconHeader(cs),
              ),
            )
          else
            _buildIconHeader(cs),
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TranslatedText(
                  reward.rewardName,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppColors.titleDark,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                if (reward.rewardDescription != null &&
                    reward.rewardDescription!.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  TranslatedText(
                    reward.rewardDescription!,
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.bodyText,
                    ),
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
                const SizedBox(height: 12),
                Row(
                  children: [
                    const AppIcon(AppIcons.starPoints,
                        size: 16, color: AppColors.warning),
                    const SizedBox(width: 4),
                    Text(
                      '${reward.costPoints} ${tr.tr('storePoints')}',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.titleDark,
                      ),
                    ),
                    const Spacer(),
                    SizedBox(
                      height: 34,
                      child: ElevatedButton(
                        onPressed: affordable ? onRedeem : null,
                        style: ElevatedButton.styleFrom(
                          backgroundColor:
                              affordable ? AppColors.primary : AppColors.outline,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          padding: const EdgeInsets.symmetric(horizontal: 14),
                          elevation: 0,
                        ),
                        child: Text(
                          affordable
                              ? tr.tr('storeRedeem')
                              : tr.tr('storeNotEnough'),
                          style: const TextStyle(
                              fontSize: 12, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildIconHeader(_CategoryLook cs) {
    return Container(
      height: 80,
      width: double.infinity,
      decoration: BoxDecoration(
        color: cs.bg,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
      ),
      child: Center(
        child: AppIcon(cs.icon, size: 32, color: cs.color),
      ),
    );
  }
}

class _CategoryLook {
  const _CategoryLook(this.icon, this.bg, this.color);
  final String icon;
  final Color bg;
  final Color color;
}
