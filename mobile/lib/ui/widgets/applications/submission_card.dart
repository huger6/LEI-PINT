import 'package:flutter/material.dart';

class SubmissionCard extends StatelessWidget {
  const SubmissionCard({
    super.key,
    required this.title,
    required this.status,
    required this.statusColor,
    required this.timestamp,
    required this.medalColor,
    required this.ribbonColor,
    this.onTap,
  });

  final String title;
  final String status;
  final Color statusColor;
  final String timestamp;
  final Color medalColor;
  final Color ribbonColor;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(20),
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFFF2F5F8),
          borderRadius: BorderRadius.circular(20),
          boxShadow: const [
            BoxShadow(
              color: Color(0x1A000000),
              blurRadius: 8,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _MedalIcon(medalColor: medalColor, ribbonColor: ribbonColor),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF20252B),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    status,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: statusColor,
                    ),
                  ),
                  const SizedBox(height: 20),
                  Align(
                    alignment: Alignment.bottomRight,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.history_toggle_off_rounded, size: 20),
                        const SizedBox(width: 4),
                        Text(
                          timestamp,
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF20252B),
                          ),
                        ),
                      ],
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

class _MedalIcon extends StatelessWidget {
  const _MedalIcon({required this.medalColor, required this.ribbonColor});

  final Color medalColor;
  final Color ribbonColor;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 64,
      height: 86,
      child: Stack(
        alignment: Alignment.topCenter,
        children: [
          Positioned(
            top: 40,
            child: Row(
              children: [
                Icon(Icons.bookmark, color: ribbonColor, size: 24),
                const SizedBox(width: 2),
                Icon(Icons.bookmark, color: ribbonColor, size: 24),
              ],
            ),
          ),
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: medalColor,
              border: Border.all(color: const Color(0xFF7A7A7A), width: 1.5),
            ),
            child: const Icon(
              Icons.star_rounded,
              color: Colors.white,
              size: 30,
            ),
          ),
        ],
      ),
    );
  }
}
