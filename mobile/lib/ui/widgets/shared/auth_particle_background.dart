import 'dart:math' as math;

import 'package:flutter/material.dart';

class AuthParticleBackground extends StatelessWidget {
  final int particleCount;

  const AuthParticleBackground({super.key, this.particleCount = 36});

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        const DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Color(0xFFF3F9FF),
                Color(0xFFEAF5FF),
                Color(0xFFF7FBFF),
                Color(0xFFFEFEFF),
              ],
              stops: [0, 0.32, 0.68, 1],
            ),
          ),
        ),
        const _SoftGlow(
          alignment: Alignment(-1.05, -1.04),
          size: 300,
          color: Color(0x4D00B8E0),
        ),
        const _SoftGlow(
          alignment: Alignment(1.08, -0.76),
          size: 250,
          color: Color(0x3339639C),
        ),
        const _SoftGlow(
          alignment: Alignment(0.92, 1.15),
          size: 320,
          color: Color(0x2900B8E0),
        ),
        const _SoftGlow(
          alignment: Alignment(-0.88, 1.05),
          size: 240,
          color: Color(0x1E39639C),
        ),
        IgnorePointer(child: _ParticleLayer(particleCount: particleCount)),
      ],
    );
  }
}

class _SoftGlow extends StatelessWidget {
  final Alignment alignment;
  final double size;
  final Color color;

  const _SoftGlow({
    required this.alignment,
    required this.size,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: alignment,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: RadialGradient(colors: [color, color.withValues(alpha: 0)]),
        ),
      ),
    );
  }
}

class _ParticleLayer extends StatefulWidget {
  final int particleCount;

  const _ParticleLayer({required this.particleCount});

  @override
  State<_ParticleLayer> createState() => _ParticleLayerState();
}

class _ParticleLayerState extends State<_ParticleLayer>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 18),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        return CustomPaint(
          painter: _ParticlePainter(
            progress: _controller.value,
            particleCount: widget.particleCount,
          ),
        );
      },
    );
  }
}

class _ParticlePainter extends CustomPainter {
  final double progress;
  final int particleCount;

  _ParticlePainter({required this.progress, required this.particleCount});

  static const List<Color> _palette = [
    Color(0xFF00B8E0),
    Color(0xFF39639C),
    Color(0xFF8ACEE3),
    Color(0xFFB9EBF6),
  ];

  @override
  void paint(Canvas canvas, Size size) {
    for (var i = 0; i < particleCount; i++) {
      final baseX = _hash(i * 31.7);
      final baseY = _hash(i * 72.4 + 0.23);
      final phase = _hash(i * 12.2 + 0.71) * math.pi * 2;
      final drift = _hash(i * 18.9 + 0.37);
      final speed = 0.35 + (_hash(i * 9.5 + 0.14) * 0.7);
      final oscillation = 12 + (_hash(i * 5.4 + 0.66) * 38);

      final yProgress = (baseY + progress * speed) % 1;
      final x =
          (baseX * size.width) +
          math.sin((progress * math.pi * 2) + phase) * oscillation;
      final y =
          yProgress * size.height +
          math.cos((progress * math.pi * 1.4) + phase) * (oscillation * 0.5);

      final radius = 1.2 + (drift * 3.8);
      final opacity = 0.12 + (_hash(i * 41.3 + 0.88) * 0.22);
      final color = _palette[i % _palette.length].withValues(alpha: opacity);

      final paint = Paint()
        ..color = color
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 3.5);

      canvas.drawCircle(Offset(x, y), radius, paint);
    }
  }

  double _hash(double input) {
    final sine = math.sin(input * 12.9898) * 43758.5453;
    return sine - sine.floorToDouble();
  }

  @override
  bool shouldRepaint(covariant _ParticlePainter oldDelegate) {
    return oldDelegate.progress != progress ||
        oldDelegate.particleCount != particleCount;
  }
}
