import 'package:flutter/material.dart';

import '../../../core/constants/notification_defs.dart';
import '../../../models/notification_model.dart';

class NotificationsList extends StatelessWidget {
  const NotificationsList({
    super.key,
    required this.notifications,
    required this.onDismiss,
    this.onTap,
  });

  final List<NotificationModel> notifications;
  final ValueChanged<int> onDismiss;
  final ValueChanged<NotificationModel>? onTap;

  @override
  Widget build(BuildContext context) {
    if (notifications.isEmpty) {
      return const Center(
        child: Text(
          'Sem notificações para apresentar.',
          style: TextStyle(
            color: Color(0xFF5E6A75),
            fontSize: 16,
            fontWeight: FontWeight.w500,
          ),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
      itemCount: notifications.length,
      itemBuilder: (context, index) {
        final notification = notifications[index];
        return NotificationCard(
          item: notification,
          onClose: () => onDismiss(notification.id),
          onTap: onTap != null ? () => onTap!(notification) : null,
        );
      },
    );
  }
}

class NotificationCard extends StatelessWidget {
  const NotificationCard({
    super.key,
    required this.item,
    required this.onClose,
    this.onTap,
  });

  final NotificationModel item;
  final VoidCallback onClose;
  final VoidCallback? onTap;

  NotificationDisplay get _display =>
      NotificationDefs.getDisplay(item.definitionId, url: item.url);

  String get _title {
    final payload = item.payload;
    if (payload != null && payload.isNotEmpty) {
      final firstLine = payload.split('\n').first;
      if (firstLine.length <= 60) return firstLine;
      return '${firstLine.substring(0, 57)}...';
    }
    return _display.label;
  }

  String get _message {
    final payload = item.payload;
    if (payload != null && payload.isNotEmpty) {
      final lines = payload.split('\n');
      if (lines.length > 1) return lines.sublist(1).join('\n').trim();
      return payload;
    }
    return '';
  }

  String get _timestamp {
    final now = DateTime.now();
    final diff = now.difference(item.sentAt);

    if (diff.inMinutes < 1) return 'Agora';
    if (diff.inMinutes < 60) return 'Há ${diff.inMinutes} min';
    if (diff.inHours < 24) return 'Há ${diff.inHours}h';
    if (diff.inDays < 7) {
      return 'Há ${diff.inDays} ${diff.inDays == 1 ? 'dia' : 'dias'}';
    }
    final d = item.sentAt;
    return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
  }

  @override
  Widget build(BuildContext context) {
    final display = _display;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.fromLTRB(14, 12, 10, 10),
        decoration: BoxDecoration(
          color: item.isRead ? Colors.white : const Color(0xFFF0F7FC),
          borderRadius: BorderRadius.circular(16),
          boxShadow: const [
            BoxShadow(
              color: Color(0x22000000),
              blurRadius: 8,
              offset: Offset(0, 3),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 40,
              height: 40,
              margin: const EdgeInsets.only(right: 12, top: 2),
              decoration: BoxDecoration(
                color: display.color.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(display.icon, color: display.color, size: 22),
            ),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (!item.isRead)
                        Container(
                          width: 8,
                          height: 8,
                          margin: const EdgeInsets.only(top: 6, right: 6),
                          decoration: const BoxDecoration(
                            color: Color(0xFF5D9FD1),
                            shape: BoxShape.circle,
                          ),
                        ),
                      Expanded(
                        child: Text(
                          _title,
                          style: TextStyle(
                            color: display.color,
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                      IconButton(
                        onPressed: onClose,
                        icon: const Icon(Icons.close, size: 22),
                        color: const Color(0xFF8B96A1),
                        padding: EdgeInsets.zero,
                        constraints:
                            const BoxConstraints(minWidth: 28, minHeight: 28),
                        tooltip: 'Marcar como lida',
                      ),
                    ],
                  ),
                  if (_message.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      _message,
                      style: const TextStyle(
                        color: Color(0xFF202A33),
                        fontSize: 14,
                        height: 1.35,
                      ),
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  const SizedBox(height: 6),
                  Text(
                    _timestamp,
                    style: const TextStyle(
                      color: Color(0xFF6E7A86),
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
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
}
