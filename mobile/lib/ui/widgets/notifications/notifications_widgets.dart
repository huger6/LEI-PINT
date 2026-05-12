import 'package:flutter/material.dart';

class NotificationsList extends StatelessWidget {
  const NotificationsList({
    super.key,
    required this.notifications,
    required this.onDismiss,
  });

  final List<NotificationItem> notifications;
  final ValueChanged<String> onDismiss;

  @override
  Widget build(BuildContext context) {
    if (notifications.isEmpty) {
      return const Center(
        child: Text(
          'Sem notifica\u00e7\u00f5es para apresentar.',
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

  final NotificationItem item;
  final VoidCallback onClose;

  Color get _titleColor {
    switch (item.type) {
      case NotificationType.approved:
        return const Color(0xFF4BB62A);
      case NotificationType.returned:
        return const Color(0xFFD94827);
      case NotificationType.expiring:
        return const Color(0xFFC6A12A);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.fromLTRB(14, 12, 10, 10),
      decoration: BoxDecoration(
        color: Colors.white,
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
              Expanded(
                child: Text(
                  item.title,
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
                tooltip: 'Ignorar notifica\u00e7\u00e3o',
              ),
            ],
          ),
          const SizedBox(height: 2),
          Text(
            item.message,
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
              item.timestamp,
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

enum NotificationType { approved, returned, expiring }

class NotificationItem {
  const NotificationItem({
    required this.id,
    required this.title,
    required this.message,
    required this.timestamp,
    required this.type,
    required this.isRecent,
  });

  final String id;
  final String title;
  final String message;
  final String timestamp;
  final NotificationType type;
  final bool isRecent;
}
