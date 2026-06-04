import 'dart:math';
import 'package:flutter/material.dart';

class ConfettiPiece {
  ConfettiPiece({required Random random, required Size bounds})
      : x = random.nextDouble() * bounds.width,
        y = -(random.nextDouble() * bounds.height * 0.5),
        size = 6.0 + random.nextDouble() * 8.0,
        speed = 1.5 + random.nextDouble() * 3.0,
        drift = (random.nextDouble() - 0.5) * 2.0,
        rotation = random.nextDouble() * 2 * pi,
        rotationSpeed = (random.nextDouble() - 0.5) * 0.15,
        color = _confettiColors[random.nextInt(_confettiColors.length)],
        shape = random.nextInt(3);

  double x;
  double y;
  final double size;
  final double speed;
  final double drift;
  double rotation;
  final double rotationSpeed;
  final Color color;
  final int shape; // 0 = rect, 1 = circle, 2 = triangle

  static const _confettiColors = [
    Color(0xFF00B8E0),
    Color(0xFF39639C),
    Color(0xFFFFCC00),
    Color(0xFF04CE00),
    Color(0xFFE57D97),
    Color(0xFF5C4FE0),
    Color(0xFF6DC1E3),
    Color(0xFFCFA600),
  ];

  void update() {
    y += speed;
    x += drift * 0.5;
    rotation += rotationSpeed;
  }
}

class ConfettiPainter extends CustomPainter {
  ConfettiPainter({required this.pieces, required this.progress});

  final List<ConfettiPiece> pieces;
  final double progress;

  @override
  void paint(Canvas canvas, Size size) {
    final opacity = progress < 0.8 ? 1.0 : (1.0 - progress) / 0.2;

    for (final piece in pieces) {
      final paint = Paint()
        ..color = piece.color.withValues(alpha: opacity.clamp(0.0, 1.0))
        ..style = PaintingStyle.fill;

      canvas.save();
      canvas.translate(piece.x, piece.y);
      canvas.rotate(piece.rotation);

      switch (piece.shape) {
        case 0:
          canvas.drawRect(
            Rect.fromCenter(
              center: Offset.zero,
              width: piece.size,
              height: piece.size * 0.6,
            ),
            paint,
          );
          break;
        case 1:
          canvas.drawCircle(Offset.zero, piece.size * 0.4, paint);
          break;
        case 2:
          final path = Path()
            ..moveTo(0, -piece.size * 0.4)
            ..lineTo(piece.size * 0.35, piece.size * 0.3)
            ..lineTo(-piece.size * 0.35, piece.size * 0.3)
            ..close();
          canvas.drawPath(path, paint);
          break;
      }

      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(covariant ConfettiPainter oldDelegate) => true;
}
