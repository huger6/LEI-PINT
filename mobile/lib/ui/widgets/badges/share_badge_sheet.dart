import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/app_links.dart';
import '../../../models/badge_model.dart';
import '../../../models/awarded_badge_model.dart';
import 'badge_image.dart';
import '../shared/app_icon/app_icon.dart';
import '../shared/app_icon/app_icon_data.dart';

Future<bool> showShareBadgeSheet(
  BuildContext context, {
  required BadgeModel badge,
  required AwardedBadgeModel award,
}) async {
  final result = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    backgroundColor: const Color(0xFFF6F7F9),
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20.0)),
    ),
    builder: (context) {
      return _ShareBadgeContent(
        badge: badge,
        award: award,
      );
    },
  );

  return result ?? false;
}

class _ShareBadgeContent extends StatelessWidget {
  const _ShareBadgeContent({
    required this.badge,
    required this.award,
  });

  final BadgeModel badge;
  final AwardedBadgeModel award;

  // Public verification URL (our web badges platform: /verify/:link).
  String get _verificationUrl =>
      AppLinks.verificationUrl(award.verificationLink ?? '');

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 10, 20, 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Center(
              child: Container(
                width: 46,
                height: 5,
                decoration: BoxDecoration(
                  color: const Color(0xFFD0D5DB),
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: Center(
                    child: Text(
                      'Partilhar Badge',
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF1D2A35),
                      ),
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context, false),
                  icon: const AppIcon(AppIcons.close),
                  color: const Color(0xFF46535E),
                ),
              ],
            ),
            const Divider(color: Color(0xFFE5E8EC), height: 14),
            const SizedBox(height: 8),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE5E8EC)),
              ),
              child: Column(
                children: [
                  BadgeImage(
                    imageUrl: badge.imageUrl,
                    size: 72,
                    fallbackColor: badge.medalColor,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    badge.title,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF1D2A35),
                    ),
                  ),
                  if (badge.level.isNotEmpty || badge.points > 0) ...[
                    const SizedBox(height: 6),
                    Text(
                      [
                        if (badge.level.isNotEmpty) badge.level,
                        if (badge.points > 0) '${badge.points} pts',
                      ].join('  '),
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF445967),
                      ),
                    ),
                  ],
                  const SizedBox(height: 6),
                  Text(
                    'Obtido em ${_formatDate(award.awardedAt)}',
                    style: const TextStyle(
                      fontSize: 13,
                      color: Color(0xFF6B7C8A),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'Partilhar no LinkedIn',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: Color(0xFF1D2A35),
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Partilhe esta conquista com a sua rede profissional no LinkedIn.',
              style: TextStyle(
                fontSize: 14,
                color: Color(0xFF46535E),
                height: 1.4,
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton.icon(
                onPressed: () => _shareOnLinkedIn(context),
                icon: const AppIcon(AppIcons.linkedin, size: 20),
                label: const Text('Partilhar no LinkedIn'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0A66C2),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  textStyle: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
            if (_verificationUrl.isNotEmpty) ...[
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: OutlinedButton.icon(
                  onPressed: () => _copyLink(context),
                  icon: const AppIcon(
                    AppIcons.link,
                    size: 20,
                    color: Color(0xFF0A66C2),
                  ),
                  label: const Text('Copiar link'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF0A66C2),
                    side: const BorderSide(color: Color(0xFF0A66C2), width: 1.4),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    textStyle: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 10),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 10,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF2F5),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  children: [
                    const AppIcon(
                      AppIcons.link,
                      size: 18,
                      color: Color(0xFF46535E),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _verificationUrl,
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(0xFF46535E),
                        ),
                        overflow: TextOverflow.ellipsis,
                        maxLines: 1,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _copyLink(BuildContext context) async {
    if (_verificationUrl.isEmpty) return;
    await Clipboard.setData(ClipboardData(text: _verificationUrl));
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Link copiado para a área de transferência.'),
        backgroundColor: Color(0xFF59C13E),
      ),
    );
  }

  Future<void> _shareOnLinkedIn(BuildContext context) async {
    final shareTarget =
        _verificationUrl.isNotEmpty ? _verificationUrl : AppLinks.frontendBaseUrl;
    final shareText =
      'Acabei de obter o badge "${badge.title}" na Plataforma de Badges da Softinsa!'
      '${_verificationUrl.isNotEmpty ? '\n\nVerificação: $_verificationUrl' : ''}';

    // Try the LinkedIn app deep link first so the native app opens when
    // installed, then fall back to the web share endpoint.
    final appUri = Uri.parse(
      'linkedin://shareArticle?mini=true'
      '&url=${Uri.encodeComponent(shareTarget)}'
      '&text=${Uri.encodeComponent(shareText)}',
    );
    final webUri = Uri.parse(
      'https://www.linkedin.com/sharing/share-offsite/'
      '?url=${Uri.encodeComponent(shareTarget)}'
      '&text=${Uri.encodeComponent(shareText)}',
    );

    try {
      var launched = await launchUrl(appUri, mode: LaunchMode.externalApplication);
      if (!launched) {
        launched = await launchUrl(webUri, mode: LaunchMode.externalApplication);
      }
      if (!context.mounted) return;
      if (launched) {
        Navigator.pop(context, true);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Não foi possível abrir o LinkedIn.'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Não foi possível abrir o LinkedIn.'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  String _formatDate(DateTime date) {
    final day = date.day.toString().padLeft(2, '0');
    final month = date.month.toString().padLeft(2, '0');
    final year = date.year;
    return '$day/$month/$year';
  }
}
