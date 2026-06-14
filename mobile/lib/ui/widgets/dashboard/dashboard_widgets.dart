import 'package:flutter/material.dart';

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
                const Icon(
                  Icons.workspace_premium_rounded,
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
              child: const Icon(
                Icons.emoji_flags_rounded,
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
                child: const Icon(
                  Icons.notifications_none,
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
