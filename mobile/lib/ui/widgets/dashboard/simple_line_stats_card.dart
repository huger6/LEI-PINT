import 'package:flutter/material.dart';

import '../../../core/sync_manager.dart';

class SimpleLineStatsCard extends StatelessWidget {
  const SimpleLineStatsCard({
    super.key,
    required this.completedBadges,
    required this.growthPercent,
  });

  final int completedBadges;
  final int growthPercent;

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    final isPositive = growthPercent >= 0;

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 12),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFFF4F6FA),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            tr.tr('statistics'),
            style: const TextStyle(fontSize: 16, color: Color(0xFF8D97A5)),
          ),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Text(
              tr.tr('completedBadges'),
              style: const TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.w700,
                color: Color(0xFF66B1E6),
              ),
            ),
          ),
          const SizedBox(height: 8),
          const Divider(height: 1),
          const SizedBox(height: 8),
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  '$completedBadges',
                  style: const TextStyle(
                    fontSize: 58,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF66B1E6),
                  ),
                ),
                const SizedBox(width: 8),
                Icon(
                  isPositive
                      ? Icons.arrow_drop_up_rounded
                      : Icons.arrow_drop_down_rounded,
                  color: isPositive
                      ? const Color(0xFF5BBF76)
                      : const Color(0xFFD63D2B),
                  size: 28,
                ),
                Text(
                  '${growthPercent.abs()}%',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: isPositive
                        ? const Color(0xFF5BBF76)
                        : const Color(0xFFD63D2B),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            height: 180,
            child: Stack(
              children: [
                Positioned.fill(
                  child: CustomPaint(painter: _LineChartPainter()),
                ),
                Align(
                  alignment: Alignment.bottomCenter,
                  child: Container(
                    width: 92,
                    height: 34,
                    decoration: BoxDecoration(
                      color: const Color(0xFF66B1E6),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Center(
                      child: Text(
                        tr.tr('monthJune'),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                tr.tr('monthApril'),
                style: const TextStyle(color: Color(0xFFA9B1BD)),
              ),
              Text(
                tr.tr('monthMay'),
                style: const TextStyle(color: Color(0xFFA9B1BD)),
              ),
              Text(
                tr.tr('monthJune'),
                style: const TextStyle(color: Color(0xFFA9B1BD)),
              ),
              Text(
                tr.tr('monthJuly'),
                style: const TextStyle(color: Color(0xFFA9B1BD)),
              ),
              Text(
                tr.tr('monthAugust'),
                style: const TextStyle(color: Color(0xFFA9B1BD)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _LineChartPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final areaPaint = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [Color(0x88C5D2F4), Color(0x15C5D2F4)],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));

    final linePaint = Paint()
      ..color = const Color(0xFF5C6EA8)
      ..strokeWidth = 5
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final path = Path()
      ..moveTo(0, size.height * 0.72)
      ..cubicTo(
        size.width * 0.12,
        size.height * 0.45,
        size.width * 0.2,
        size.height * 0.68,
        size.width * 0.28,
        size.height * 0.56,
      )
      ..cubicTo(
        size.width * 0.38,
        size.height * 0.5,
        size.width * 0.47,
        size.height * 0.8,
        size.width * 0.58,
        size.height * 0.65,
      )
      ..cubicTo(
        size.width * 0.68,
        size.height * 0.52,
        size.width * 0.75,
        size.height * 0.35,
        size.width * 0.84,
        size.height * 0.58,
      )
      ..cubicTo(
        size.width * 0.9,
        size.height * 0.72,
        size.width * 0.94,
        size.height * 0.6,
        size.width,
        size.height * 0.76,
      );

    final areaPath = Path.from(path)
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..close();

    canvas.drawPath(areaPath, areaPaint);
    canvas.drawPath(path, linePaint);

    final markerX = size.width * 0.5;
    final markerY = size.height * 0.62;

    final markerLine = Paint()
      ..color = const Color(0xFF66B1E6)
      ..strokeWidth = 3;

    canvas.drawLine(
      Offset(markerX, markerY),
      Offset(markerX, size.height),
      markerLine,
    );

    final markerOuter = Paint()..color = const Color(0xFF66B1E6);
    final markerInner = Paint()..color = const Color(0xFFF4F6FA);
    canvas.drawCircle(Offset(markerX, markerY), 10, markerOuter);
    canvas.drawCircle(Offset(markerX, markerY), 6, markerInner);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
