import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../../core/sync_manager.dart';
import '../../../presentation/state/dashboard_store.dart';

class SimpleLineStatsCard extends StatefulWidget {
  const SimpleLineStatsCard({
    super.key,
    required this.completedBadges,
    required this.growthPercent,
    required this.monthlyBadgeCounts,
  });

  final int completedBadges;
  final int growthPercent;
  final List<MonthBadgeCount> monthlyBadgeCounts;

  @override
  State<SimpleLineStatsCard> createState() => _SimpleLineStatsCardState();
}

class _SimpleLineStatsCardState extends State<SimpleLineStatsCard> {
  int? _selectedIndex;
  bool _isTouching = false;

  static const _fullMonthKeys = [
    'monthJanuary', 'monthFebruary', 'monthMarch',
    'monthApril', 'monthMay', 'monthJune',
    'monthJuly', 'monthAugust', 'monthSeptember',
    'monthOctober', 'monthNovember', 'monthDecember',
  ];

  static const _shortMonthKeys = [
    'monthShortJan', 'monthShortFeb', 'monthShortMar',
    'monthShortApr', 'monthShortMay', 'monthShortJun',
    'monthShortJul', 'monthShortAug', 'monthShortSep',
    'monthShortOct', 'monthShortNov', 'monthShortDec',
  ];

  List<MonthBadgeCount> get _counts {
    if (widget.monthlyBadgeCounts.isNotEmpty) return widget.monthlyBadgeCounts;
    final now = DateTime.now();
    return List.generate(5, (i) {
      final d = DateTime(now.year, now.month - (4 - i));
      return MonthBadgeCount(year: d.year, month: d.month, count: 0);
    });
  }

  void _onTouchUpdate(Offset localPosition, double chartWidth) {
    final counts = _counts;
    if (counts.isEmpty) return;

    final n = counts.length;
    final segmentWidth = chartWidth / (n - 1);
    int nearest = (localPosition.dx / segmentWidth).round().clamp(0, n - 1);

    if (nearest != _selectedIndex) {
      setState(() {
        _selectedIndex = nearest;
        _isTouching = true;
      });
    }
  }

  void _onTouchEnd() {
    setState(() => _isTouching = false);
  }

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    final isPositive = widget.growthPercent >= 0;
    final counts = _counts;

    final shortLabels = counts.map((m) {
      if (m.month >= 1 && m.month <= 12) return tr.tr(_shortMonthKeys[m.month - 1]);
      return '${m.month}';
    }).toList();

    final selectedIdx = _isTouching ? _selectedIndex : null;

    String? tooltipLabel;
    int? tooltipCount;
    if (selectedIdx != null && selectedIdx < counts.length) {
      final m = counts[selectedIdx];
      tooltipLabel = m.month >= 1 && m.month <= 12
          ? tr.tr(_fullMonthKeys[m.month - 1])
          : '${m.month}';
      tooltipCount = m.count;
    }

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
                  '${widget.completedBadges}',
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
                  '${widget.growthPercent.abs()}%',
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
            child: LayoutBuilder(
              builder: (context, constraints) {
                final chartWidth = constraints.maxWidth;
                return GestureDetector(
                  onPanStart: (d) => _onTouchUpdate(d.localPosition, chartWidth),
                  onPanUpdate: (d) => _onTouchUpdate(d.localPosition, chartWidth),
                  onPanEnd: (_) => _onTouchEnd(),
                  onPanCancel: _onTouchEnd,
                  onTapDown: (d) => _onTouchUpdate(d.localPosition, chartWidth),
                  onTapUp: (_) => _onTouchEnd(),
                  child: Stack(
                    clipBehavior: Clip.none,
                    children: [
                      Positioned.fill(
                        child: CustomPaint(
                          painter: _DataLineChartPainter(
                            counts: counts.map((m) => m.count).toList(),
                            selectedIndex: selectedIdx,
                          ),
                        ),
                      ),
                      if (selectedIdx != null && tooltipLabel != null)
                        _buildTooltip(
                          counts: counts,
                          selectedIdx: selectedIdx,
                          chartWidth: chartWidth,
                          label: '$tooltipLabel: $tooltipCount',
                        ),
                    ],
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: shortLabels
                .map((label) => Text(
                      label,
                      style: const TextStyle(color: Color(0xFFA9B1BD)),
                    ))
                .toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildTooltip({
    required List<MonthBadgeCount> counts,
    required int selectedIdx,
    required double chartWidth,
    required String label,
  }) {
    final n = counts.length;
    final xFraction = n <= 1 ? 0.5 : selectedIdx / (n - 1);
    final xPos = xFraction * chartWidth;

    const tooltipWidth = 130.0;
    final leftPos = (xPos - tooltipWidth / 2).clamp(0.0, chartWidth - tooltipWidth);

    return Positioned(
      left: leftPos,
      bottom: 0,
      child: Container(
        width: tooltipWidth,
        height: 34,
        decoration: BoxDecoration(
          color: const Color(0xFF66B1E6),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Center(
          child: Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ),
    );
  }
}

class _DataLineChartPainter extends CustomPainter {
  _DataLineChartPainter({required this.counts, this.selectedIndex});

  final List<int> counts;
  final int? selectedIndex;

  @override
  void paint(Canvas canvas, Size size) {
    if (counts.isEmpty) return;

    final maxVal = counts.reduce(math.max);
    final effectiveMax = maxVal > 0 ? maxVal.toDouble() : 1.0;

    final points = <Offset>[];
    final n = counts.length;
    for (var i = 0; i < n; i++) {
      final x = n == 1 ? size.width / 2 : (i / (n - 1)) * size.width;
      final y = size.height - (counts[i] / effectiveMax) * (size.height * 0.85);
      points.add(Offset(x, y));
    }

    final path = Path()..moveTo(points.first.dx, points.first.dy);
    for (var i = 0; i < points.length - 1; i++) {
      final p0 = points[i];
      final p1 = points[i + 1];
      final cpx1 = p0.dx + (p1.dx - p0.dx) * 0.4;
      final cpx2 = p0.dx + (p1.dx - p0.dx) * 0.6;
      path.cubicTo(cpx1, p0.dy, cpx2, p1.dy, p1.dx, p1.dy);
    }

    final areaPath = Path.from(path)
      ..lineTo(points.last.dx, size.height)
      ..lineTo(points.first.dx, size.height)
      ..close();

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

    canvas.drawPath(areaPath, areaPaint);
    canvas.drawPath(path, linePaint);

    if (selectedIndex != null && selectedIndex! < points.length) {
      final point = points[selectedIndex!];
      final markerLine = Paint()
        ..color = const Color(0xFF66B1E6)
        ..strokeWidth = 3;
      canvas.drawLine(point, Offset(point.dx, size.height), markerLine);

      final markerOuter = Paint()..color = const Color(0xFF66B1E6);
      final markerInner = Paint()..color = const Color(0xFFF4F6FA);
      canvas.drawCircle(point, 10, markerOuter);
      canvas.drawCircle(point, 6, markerInner);
    }
  }

  @override
  bool shouldRepaint(covariant _DataLineChartPainter oldDelegate) {
    return oldDelegate.counts != counts || oldDelegate.selectedIndex != selectedIndex;
  }
}
