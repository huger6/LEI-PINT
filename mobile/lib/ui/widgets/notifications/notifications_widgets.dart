import 'package:flutter/material.dart';

import '../../../models/notification_model.dart';

class NotificationsList extends StatelessWidget {
  const NotificationsList({
    super.key,
    required this.notifications,
    required this.onDismiss,
  });

  final List<NotificationModel> notifications;
  final ValueChanged<int> onDismiss;

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
  });

  final NotificationModel item;
  final VoidCallback onClose;

  Color get _titleColor {
    final type = (item.url ?? '').toLowerCase();
    if (type.contains('accept') || type.contains('approve')) {
      return const Color(0xFF4BB62A);
    }
    if (type.contains('reject') || type.contains('return')) {
      return const Color(0xFFD94827);
    }
    if (type.contains('expir')) {
      return const Color(0xFFC6A12A);
    }
    return const Color(0xFF1E2932);
  }

  String get _title {
    final payload = item.payload;
    if (payload != null && payload.isNotEmpty) {
      final firstLine = payload.split('\n').first;
      if (firstLine.length <= 60) return firstLine;
      return '${firstLine.substring(0, 57)}...';
    }
    return 'Notificação';
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
    return Container(
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
                  margin: const EdgeInsets.only(top: 6, right: 8),
                  decoration: const BoxDecoration(
                    color: Color(0xFF5D9FD1),
                    shape: BoxShape.circle,
                  ),
                ),
              Expanded(
                child: Text(
                  _title,
                  style: TextStyle(
                    color: _titleColor,
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              IconButton(
                onPressed: onClose,
                icon: const Icon(Icons.close, size: 30),
                color: const Color(0xFF1E2932),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                tooltip: 'Marcar como lida',
              ),
            ],
          ),
          const SizedBox(height: 2),
          if (_message.isNotEmpty)
            Text(
              _message,
              style: const TextStyle(
                color: Color(0xFF202A33),
                fontSize: 14,
                height: 1.35,
              ),
            ),
          const SizedBox(height: 6),
          Align(
            alignment: Alignment.bottomRight,
            child: Text(
              _timestamp,
              style: const TextStyle(
                color: Color(0xFF6E7A86),
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
