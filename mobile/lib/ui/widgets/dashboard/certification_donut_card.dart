import 'dart:math';

import 'package:flutter/material.dart';

import '../../../core/sync_manager.dart';

class CertificationDonutCard extends StatefulWidget {
  const CertificationDonutCard({
    super.key,
    required this.totalAreas,
    required this.segments,
  });

  final int totalAreas;
  final List<DonutSegmentData> segments;

  @override
  State<CertificationDonutCard> createState() =>
      _CertificationDonutCardState();
}

class _CertificationDonutCardState extends State<CertificationDonutCard> {
  int? _selectedIndex;

  int get _centerValue {
    if (_selectedIndex != null &&
        _selectedIndex! < widget.segments.length) {
      return widget.segments[_selectedIndex!].value;
    }
    return widget.segments.fold<int>(0, (sum, s) => sum + s.value);
  }

  String _centerLabel(String Function(String) tr) {
    if (_selectedIndex != null &&
        _selectedIndex! < widget.segments.length) {
      return widget.segments[_selectedIndex!].label;
    }
    return tr('totalBadges');
  }

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 12, bottom: 12),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFFF4F6FA),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        children: [
          LayoutBuilder(
            builder: (context, constraints) {
              final size = min(constraints.maxWidth * 0.7, 250.0);
              return SizedBox(
                height: size,
                width: size,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    Positioned.fill(
                      child: CustomPaint(
                        painter: _DonutChartPainter(
                          segments: widget.segments,
                          selectedIndex: _selectedIndex,
                        ),
                      ),
                    ),
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '$_centerValue',
                          style: const TextStyle(
                            fontSize: 48,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF66B1E6),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          child: Text(
                            _centerLabel(tr.tr),
                            textAlign: TextAlign.center,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 14,
                              color: Color(0xFF454A52),
                              height: 1.3,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            },
          ),
          const SizedBox(height: 10),
          ...widget.segments.asMap().entries.map(
            (entry) {
              final index = entry.key;
              final segment = entry.value;
              final isSelected = _selectedIndex == index;

              return GestureDetector(
                onTap: () {
                  setState(() {
                    _selectedIndex = isSelected ? null : index;
                  });
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(
                    vertical: 7,
                    horizontal: 8,
                  ),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? segment.color.withValues(alpha: 0.1)
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 12,
                        height: 12,
                        decoration: BoxDecoration(
                          color: segment.color,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          segment.label,
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight:
                                isSelected ? FontWeight.w700 : FontWeight.w600,
                            color: const Color(0xFF555B76),
                          ),
                        ),
                      ),
                      Text(
                        '${segment.value}',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight:
                              isSelected ? FontWeight.w800 : FontWeight.w700,
                          color: const Color(0xFF30353C),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

class DonutSegmentData {
  const DonutSegmentData({
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final int value;
  final Color color;
}

class _DonutChartPainter extends CustomPainter {
  _DonutChartPainter({required this.segments, this.selectedIndex});

  final List<DonutSegmentData> segments;
  final int? selectedIndex;

  @override
  void paint(Canvas canvas, Size size) {
    final total = segments.fold<int>(0, (sum, item) => sum + item.value);
    if (total <= 0) {
      return;
    }

    final center = Offset(size.width / 2, size.height / 2);
    final radius = min(size.width, size.height) * 0.38;
    const strokeWidth = 30.0;
    const gapRadians = 0.08;

    final rect = Rect.fromCircle(center: center, radius: radius);

    var startAngle = -pi / 2;

    for (int i = 0; i < segments.length; i++) {
      final segment = segments[i];
      final sweep = (segment.value / total) * (2 * pi);
      final adjustedSweep = max(0.0, sweep - gapRadians);

      final isSelected = selectedIndex == i;
      final currentStroke = isSelected ? strokeWidth + 8 : strokeWidth;

      final paint = Paint()
        ..color = isSelected
            ? segment.color
            : (selectedIndex != null
                ? segment.color.withValues(alpha: 0.4)
                : segment.color)
        ..style = PaintingStyle.stroke
        ..strokeWidth = currentStroke
        ..strokeCap = StrokeCap.round;

      canvas.drawArc(rect, startAngle, adjustedSweep, false, paint);

      if (selectedIndex == null || isSelected) {
        final labelAngle = startAngle + (adjustedSweep / 2);
        final labelRadius = radius;
        final labelOffset = Offset(
          center.dx + cos(labelAngle) * labelRadius,
          center.dy + sin(labelAngle) * labelRadius,
        );

        final percent = ((segment.value / total) * 100).round();
        final textPainter = TextPainter(
          text: TextSpan(
            text: '$percent%',
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w700,
              fontSize: 13,
            ),
          ),
          textDirection: TextDirection.ltr,
        )..layout();

        textPainter.paint(
          canvas,
          Offset(
            labelOffset.dx - textPainter.width / 2,
            labelOffset.dy - textPainter.height / 2,
          ),
        );
      }

      startAngle += sweep;
    }
  }

  @override
  bool shouldRepaint(covariant _DonutChartPainter oldDelegate) {
    return oldDelegate.segments != segments ||
        oldDelegate.selectedIndex != selectedIndex;
  }
}
