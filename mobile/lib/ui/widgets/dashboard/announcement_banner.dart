import 'dart:async';

import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';

import '../../../core/constants/sync_codes.dart';
import '../../../core/services/sync_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/local/announcement_dao.dart';
import '../../../models/announcement_model.dart';
import '../shared/app_icon/app_icon.dart';
import '../shared/app_icon/app_icon_data.dart';

class AnnouncementBanner extends StatefulWidget {
  const AnnouncementBanner({super.key});

  @override
  State<AnnouncementBanner> createState() => _AnnouncementBannerState();
}

class _AnnouncementBannerState extends State<AnnouncementBanner> {
  List<AnnouncementModel> _announcements = [];
  final Set<int> _dismissed = {};
  StreamSubscription<int>? _syncSub;

  @override
  void initState() {
    super.initState();
    _loadAnnouncements();
    _syncSub = GetIt.instance<SyncService>().onSyncComplete.listen((code) {
      if (code == SyncCodes.announcements) _loadAnnouncements();
    });
  }

  @override
  void dispose() {
    _syncSub?.cancel();
    super.dispose();
  }

  Future<void> _loadAnnouncements() async {
    final dao = GetIt.instance<AnnouncementDao>();
    final active = await dao.getActive();
    if (mounted) setState(() => _announcements = active);
  }

  @override
  Widget build(BuildContext context) {
    final visible = _announcements
        .where((a) => !_dismissed.contains(a.id))
        .toList();

    if (visible.isEmpty) return const SizedBox.shrink();

    return Column(
      children: visible.map((ann) => _buildCard(ann)).toList(),
    );
  }

  Widget _buildCard(AnnouncementModel ann) {
    final isWarning = ann.type?.toLowerCase() == 'warning';
    final accentColor = isWarning ? AppColors.warning : AppColors.primary;
    final bgColor = isWarning
        ? const Color(0xFFFFF8E1)
        : const Color(0xFFE3F2FD);

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.fromLTRB(14, 12, 10, 12),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: accentColor.withValues(alpha: 0.3)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                color: accentColor.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(10),
              ),
              child: AppIcon(
                AppIcons.bell,
                size: 18,
                color: accentColor,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    ann.title,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: accentColor,
                    ),
                  ),
                  if (ann.message.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      ann.message,
                      style: const TextStyle(
                        fontSize: 13,
                        color: Color(0xFF3A4A56),
                        height: 1.3,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            GestureDetector(
              onTap: () => setState(() => _dismissed.add(ann.id)),
              child: Padding(
                padding: const EdgeInsets.all(4),
                child: AppIcon(
                  AppIcons.close,
                  size: 16,
                  color: accentColor.withValues(alpha: 0.6),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
