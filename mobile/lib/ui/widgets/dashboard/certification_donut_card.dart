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

class _CertificationDonutCardState extends State<CertificationDonutCard>
    with SingleTickerProviderStateMixin {
  int? _selectedIndex;
  late AnimationController _animController;
  late Animation<double> _animProgress;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _animProgress = CurvedAnimation(
      parent: _animController,
      curve: Curves.easeOutCubic,
    );
    _animController.forward();
  }

  @override
  void didUpdateWidget(covariant CertificationDonutCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.segments.length != widget.segments.length) {
      _animController.forward(from: 0);
    }
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  int get _total => widget.segments.fold<int>(0, (sum, s) => sum + s.value);

  int get _centerValue {
    if (_selectedIndex != null && _selectedIndex! < widget.segments.length) {
      return widget.segments[_selectedIndex!].value;
    }
    return _total;
  }

  String _centerLabel(String Function(String) tr) {
    if (_selectedIndex != null && _selectedIndex! < widget.segments.length) {
      return widget.segments[_selectedIndex!].label;
    }
    return tr('totalBadges');
  }

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    final total = _total;

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 12, bottom: 12),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0C000000),
            blurRadius: 12,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Text(
            tr.tr('certificationsByArea'),
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: Color(0xFF2A3040),
            ),
          ),
          const SizedBox(height: 16),
          LayoutBuilder(
            builder: (context, constraints) {
              final size = min(constraints.maxWidth * 0.6, 200.0);
              return AnimatedBuilder(
                animation: _animProgress,
                builder: (context, _) {
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
                              progress: _animProgress.value,
                            ),
                          ),
                        ),
                        Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              total == 0 ? '0' : '$_centerValue',
                              style: const TextStyle(
                                fontSize: 40,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFF3A4A5C),
                              ),
                            ),
                            const SizedBox(height: 2),
                            Padding(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 8),
                              child: Text(
                                total == 0
                                    ? tr.tr('noBadgesYet')
                                    : _centerLabel(tr.tr),
                                textAlign: TextAlign.center,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontSize: 13,
                                  color: Color(0xFF6B7685),
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
              );
            },
          ),
          if (widget.segments.isNotEmpty) ...[
            const SizedBox(height: 16),
            const Divider(height: 1, color: Color(0xFFEDF0F3)),
            const SizedBox(height: 12),
            ...widget.segments.asMap().entries.map(
              (entry) {
                final index = entry.key;
                final segment = entry.value;
                final isSelected = _selectedIndex == index;
                final percent =
                    total > 0 ? ((segment.value / total) * 100).round() : 0;

                return GestureDetector(
                  onTap: () {
                    setState(() {
                      _selectedIndex = isSelected ? null : index;
                    });
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(
                      vertical: 8,
                      horizontal: 10,
                    ),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? segment.color.withValues(alpha: 0.08)
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
                            borderRadius: BorderRadius.circular(3),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            segment.label,
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: isSelected
                                  ? FontWeight.w700
                                  : FontWeight.w500,
                              color: const Color(0xFF3A4550),
                            ),
                          ),
                        ),
                        Text(
                          '$percent%',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: isSelected
                                ? segment.color
                                : const Color(0xFF8A95A0),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          '${segment.value}',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: isSelected
                                ? FontWeight.w800
                                : FontWeight.w700,
                            color: const Color(0xFF2A3040),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ],
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
  _DonutChartPainter({
    required this.segments,
    this.selectedIndex,
    this.progress = 1.0,
  });

  final List<DonutSegmentData> segments;
  final int? selectedIndex;
  final double progress;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = min(size.width, size.height) * 0.42;
    const strokeWidth = 24.0;

    final bgPaint = Paint()
      ..color = const Color(0xFFF0F2F5)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;

    final bgRect = Rect.fromCircle(center: center, radius: radius);
    canvas.drawCircle(center, radius, bgPaint);

    final total = segments.fold<int>(0, (sum, item) => sum + item.value);
    if (total <= 0) return;

    final gapRadians = segments.length > 1 ? 0.06 : 0.0;
    var startAngle = -pi / 2;

    for (int i = 0; i < segments.length; i++) {
      final segment = segments[i];
      final sweep = (segment.value / total) * (2 * pi) * progress;
      final adjustedSweep = max(0.0, sweep - gapRadians);
      if (adjustedSweep <= 0) continue;

      final isSelected = selectedIndex == i;
      final currentStroke = isSelected ? strokeWidth + 6 : strokeWidth;

      final paint = Paint()
        ..color = isSelected
            ? segment.color
            : (selectedIndex != null
                ? segment.color.withValues(alpha: 0.35)
                : segment.color)
        ..style = PaintingStyle.stroke
        ..strokeWidth = currentStroke
        ..strokeCap = StrokeCap.round;

      canvas.drawArc(bgRect, startAngle, adjustedSweep, false, paint);
      startAngle += sweep;
    }
  }

  @override
  bool shouldRepaint(covariant _DonutChartPainter oldDelegate) {
    return oldDelegate.segments != segments ||
        oldDelegate.selectedIndex != selectedIndex ||
        oldDelegate.progress != progress;
  }
}
