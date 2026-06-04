import 'dart:math';
import 'package:flutter/material.dart';

import '../../../core/services/celebration_service.dart';
import '../../../core/theme/app_colors.dart';
import 'confetti_painter.dart';

Future<void> showCelebrationOverlay(
  BuildContext context, {
  required Milestone milestone,
  required String title,
  required String description,
  required int badgeCount,
}) {
  return showGeneralDialog(
    context: context,
    barrierDismissible: false,
    barrierColor: Colors.black54,
    transitionDuration: const Duration(milliseconds: 400),
    pageBuilder: (_, __, ___) {
      return _CelebrationDialog(
        milestone: milestone,
        title: title,
        description: description,
        badgeCount: badgeCount,
      );
    },
    transitionBuilder: (context, animation, secondaryAnimation, child) {
      return FadeTransition(
        opacity: CurvedAnimation(parent: animation, curve: Curves.easeOut),
        child: ScaleTransition(
          scale: CurvedAnimation(
            parent: animation,
            curve: Curves.elasticOut,
          ),
          child: child,
        ),
      );
    },
  );
}

class _CelebrationDialog extends StatefulWidget {
  const _CelebrationDialog({
    required this.milestone,
    required this.title,
    required this.description,
    required this.badgeCount,
  });

  final Milestone milestone;
  final String title;
  final String description;
  final int badgeCount;

  @override
  State<_CelebrationDialog> createState() => _CelebrationDialogState();
}

class _CelebrationDialogState extends State<_CelebrationDialog>
    with TickerProviderStateMixin {
  late final AnimationController _confettiController;
  late final AnimationController _iconBounceController;
  late final AnimationController _shimmerController;
  late List<ConfettiPiece> _confettiPieces;
  final Random _random = Random();

  @override
  void initState() {
    super.initState();

    _confettiController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    );

    _iconBounceController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );

    _shimmerController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat();

    _confettiPieces = [];

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final size = MediaQuery.of(context).size;
      setState(() {
        _confettiPieces = List.generate(
          80,
          (_) => ConfettiPiece(random: _random, bounds: size),
        );
      });

      _confettiController.addListener(_updateConfetti);
      _confettiController.forward();
      _iconBounceController.forward();
    });
  }

  void _updateConfetti() {
    for (final piece in _confettiPieces) {
      piece.update();
    }
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _confettiController.removeListener(_updateConfetti);
    _confettiController.dispose();
    _iconBounceController.dispose();
    _shimmerController.dispose();
    super.dispose();
  }

  IconData _milestoneIcon() {
    switch (widget.milestone.icon) {
      case 'star':
        return Icons.star_rounded;
      case 'rocket':
        return Icons.rocket_launch_rounded;
      case 'trophy':
        return Icons.emoji_events_rounded;
      case 'medal':
        return Icons.military_tech_rounded;
      case 'crown':
        return Icons.workspace_premium_rounded;
      default:
        return Icons.celebration_rounded;
    }
  }

  Color _milestoneAccentColor() {
    switch (widget.milestone.icon) {
      case 'star':
        return AppColors.primary;
      case 'rocket':
        return const Color(0xFF5C4FE0);
      case 'trophy':
        return AppColors.badgePremium;
      case 'medal':
        return const Color(0xFFE57D97);
      case 'crown':
        return const Color(0xFFCFA600);
      default:
        return AppColors.primary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final accentColor = _milestoneAccentColor();
    final screenSize = MediaQuery.of(context).size;

    return Material(
      color: Colors.transparent,
      child: Stack(
        children: [
          if (_confettiPieces.isNotEmpty)
            Positioned.fill(
              child: CustomPaint(
                painter: ConfettiPainter(
                  pieces: _confettiPieces,
                  progress: _confettiController.value,
                ),
              ),
            ),
          Center(
            child: Container(
              width: screenSize.width * 0.85,
              constraints: const BoxConstraints(maxWidth: 360),
              padding: const EdgeInsets.fromLTRB(24, 32, 24, 24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: accentColor.withValues(alpha: 0.25),
                    blurRadius: 40,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _buildAnimatedIcon(accentColor),
                  const SizedBox(height: 20),
                  _buildBadgeCountChip(accentColor),
                  const SizedBox(height: 16),
                  Text(
                    widget.title,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                      color: accentColor,
                      height: 1.2,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    widget.description,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 15,
                      color: Color(0xFF46535E),
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: () => Navigator.of(context).pop(),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: accentColor,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                        elevation: 0,
                        textStyle: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.celebration_rounded, size: 20),
                          SizedBox(width: 8),
                          Text('OK'),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAnimatedIcon(Color accentColor) {
    return AnimatedBuilder(
      animation: _iconBounceController,
      builder: (context, child) {
        final bounce = Curves.elasticOut.transform(
          _iconBounceController.value,
        );
        return Transform.scale(
          scale: bounce,
          child: child,
        );
      },
      child: AnimatedBuilder(
        animation: _shimmerController,
        builder: (context, child) {
          final glow = (sin(_shimmerController.value * 2 * pi) + 1) / 2;
          return Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  accentColor.withValues(alpha: 0.15 + glow * 0.1),
                  accentColor.withValues(alpha: 0.05),
                ],
              ),
              boxShadow: [
                BoxShadow(
                  color: accentColor.withValues(alpha: 0.2 + glow * 0.15),
                  blurRadius: 20 + glow * 10,
                  spreadRadius: glow * 4,
                ),
              ],
            ),
            child: Icon(
              _milestoneIcon(),
              size: 52,
              color: accentColor,
            ),
          );
        },
      ),
    );
  }

  Widget _buildBadgeCountChip(Color accentColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      decoration: BoxDecoration(
        color: accentColor.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        '${widget.badgeCount} ${widget.badgeCount == 1 ? 'badge' : 'badges'}',
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w700,
          color: accentColor,
        ),
      ),
    );
  }
}
