import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/theme/app_colors.dart';
import '../../../models/badge_model.dart';
import '../../../models/awarded_badge_model.dart';

Future<bool> showShareBadgeSheet(
  BuildContext context, {
  required BadgeModel badge,
  required AwardedBadgeModel award,
  required String verificationBaseUrl,
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
        verificationBaseUrl: verificationBaseUrl,
      );
    },
  );

  return result ?? false;
}

class _ShareBadgeContent extends StatelessWidget {
  const _ShareBadgeContent({
    required this.badge,
    required this.award,
    required this.verificationBaseUrl,
  });

  final BadgeModel badge;
  final AwardedBadgeModel award;
  final String verificationBaseUrl;

  String get _verificationUrl {
    final link = award.verificationLink ?? '';
    if (link.isEmpty) return '';
    if (link.startsWith('http')) return link;
    return '$verificationBaseUrl/verify/$link';
  }

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
                  icon: const Icon(Icons.close_rounded),
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
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: badge.medalColor,
                      border: Border.all(
                        color: const Color(0xFF7A7A7A),
                        width: 1.4,
                      ),
                    ),
                    child: const Icon(
                      Icons.star_rounded,
                      color: Colors.white,
                      size: 36,
                    ),
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
                icon: const Icon(Icons.open_in_new_rounded, size: 20),
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
            const SizedBox(height: 10),
            if (_verificationUrl.isNotEmpty)
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
                    const Icon(
                      Icons.link_rounded,
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
        ),
      ),
    );
  }

  Future<void> _shareOnLinkedIn(BuildContext context) async {
    final text = Uri.encodeComponent(
      'Acabei de obter o badge "${badge.title}" na Plataforma de Badges da Softinsa!'
      '${_verificationUrl.isNotEmpty ? '\n\nVerificação: $_verificationUrl' : ''}',
    );

    final linkedInUrl = Uri.parse(
      'https://www.linkedin.com/sharing/share-offsite/?url=${Uri.encodeComponent(_verificationUrl.isNotEmpty ? _verificationUrl : 'https://softinsa.pt')}&text=$text',
    );

    if (await canLaunchUrl(linkedInUrl)) {
      await launchUrl(linkedInUrl, mode: LaunchMode.externalApplication);
      if (context.mounted) {
        Navigator.pop(context, true);
      }
    } else {
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
