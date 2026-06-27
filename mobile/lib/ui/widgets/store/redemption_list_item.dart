import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/theme/app_colors.dart';
import '../../../models/redemption_model.dart';
import '../../../presentation/state/language_controller.dart';
import '../shared/app_icon/app_icon.dart';
import '../shared/app_icon/app_icon_data.dart';

class RedemptionListItem extends StatelessWidget {
  const RedemptionListItem({super.key, required this.redemption});

  final RedemptionModel redemption;

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  redemption.name ?? '',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.titleDark,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '${_formatDate(redemption.redeemedAt)} · −${redemption.pointsSpent} ${tr.tr('storePoints')}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.bodyText,
                  ),
                ),
              ],
            ),
          ),
          if (redemption.accessLink != null &&
              redemption.accessLink!.isNotEmpty)
            InkWell(
              onTap: () => _openLink(redemption.accessLink!),
              borderRadius: BorderRadius.circular(8),
              child: Padding(
                padding: const EdgeInsets.all(6),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const AppIcon(AppIcons.link,
                        size: 14, color: AppColors.primary),
                    const SizedBox(width: 4),
                    Text(
                      tr.tr('storeAccess'),
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    final day = date.day.toString().padLeft(2, '0');
    final month = date.month.toString().padLeft(2, '0');
    final year = date.year;
    return '$day/$month/$year';
  }

  Future<void> _openLink(String url) async {
    final uri = Uri.tryParse(url);
    if (uri != null && await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}
