import 'dart:async';

import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../shared/app_icon/app_icon.dart';
import '../shared/app_icon/app_icon_data.dart';

class EmailConfirmationBody extends StatefulWidget {
  const EmailConfirmationBody({
    super.key,
    required this.email,
    required this.onSendConfirmation,
    required this.onGoToLogin,
  });

  final String email;
  final Future<Map<String, dynamic>> Function() onSendConfirmation;
  final VoidCallback onGoToLogin;

  @override
  State<EmailConfirmationBody> createState() => _EmailConfirmationBodyState();
}

class _EmailConfirmationBodyState extends State<EmailConfirmationBody> {
  bool _isSending = false;
  int _cooldownSeconds = 0;
  Timer? _cooldownTimer;

  @override
  void initState() {
    super.initState();
    _startCooldown();
  }

  @override
  void dispose() {
    _cooldownTimer?.cancel();
    super.dispose();
  }

  Future<void> _handleResend() async {
    if (_cooldownSeconds > 0 || _isSending) return;

    setState(() => _isSending = true);

    try {
      final result = await widget.onSendConfirmation();

      if (!mounted) return;

      if (result['success'] == true) {
        _startCooldown();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              result['message']?.toString() ??
                  'Erro ao reenviar email de confirmação.',
            ),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Erro ao reenviar email. Tente novamente.'),
          backgroundColor: AppColors.error,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isSending = false);
      }
    }
  }

  void _startCooldown() {
    _cooldownSeconds = 60;
    _cooldownTimer?.cancel();
    _cooldownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      setState(() {
        _cooldownSeconds--;
        if (_cooldownSeconds <= 0) {
          timer.cancel();
        }
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Column(
      children: [
        const SizedBox(height: 16),
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: const Color(0xFFE8F5E9),
            shape: BoxShape.circle,
          ),
          child: const AppIcon(
            AppIcons.email,
            size: 42,
            color: AppColors.success,
          ),
        ),
        const SizedBox(height: 24),
        Text(
          'Email enviado!',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.w700,
            color: colorScheme.onSurface,
          ),
        ),
        const SizedBox(height: 12),
        Text(
          'Enviámos um email de confirmação para:',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: colorScheme.onSurface.withValues(alpha: 0.7),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          widget.email,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
            fontWeight: FontWeight.w700,
            color: colorScheme.primary,
          ),
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: colorScheme.primaryContainer.withValues(alpha: 0.3),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: colorScheme.primary.withValues(alpha: 0.2),
            ),
          ),
          child: Text(
            'Clique no link enviado para o seu email para ativar a sua conta. '
            'Após a confirmação, poderá fazer login na aplicação.',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: colorScheme.onSurface.withValues(alpha: 0.8),
              height: 1.5,
            ),
          ),
        ),
        const SizedBox(height: 28),
        SizedBox(
          width: double.infinity,
          height: 50,
          child: ElevatedButton(
            onPressed: widget.onGoToLogin,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.onPrimary,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
              elevation: 0,
            ),
            child: const Text(
              'Ir para Login',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          height: 50,
          child: OutlinedButton(
            onPressed:
                (_cooldownSeconds > 0 || _isSending) ? null : _handleResend,
            style: OutlinedButton.styleFrom(
              side: BorderSide(
                color: (_cooldownSeconds > 0 || _isSending)
                    ? colorScheme.outline.withValues(alpha: 0.3)
                    : colorScheme.primary,
                width: 1.5,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            child: _isSending
                ? SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.5,
                      color: colorScheme.primary,
                    ),
                  )
                : Text(
                    _cooldownSeconds > 0
                        ? 'Reenviar email ($_cooldownSeconds s)'
                        : 'Reenviar email',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: _cooldownSeconds > 0
                          ? colorScheme.outline
                          : colorScheme.primary,
                    ),
                  ),
          ),
        ),
        const SizedBox(height: 24),
        Divider(color: colorScheme.outline.withValues(alpha: 0.22)),
        const SizedBox(height: 16),
        AppIcon(
          AppIcons.help,
          size: 18,
          color: colorScheme.onSurface.withValues(alpha: 0.5),
        ),
        const SizedBox(height: 6),
        Text(
          'Não recebeu o email? Verifique a sua pasta de spam '
          'ou tente reenviar.',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: colorScheme.onSurface.withValues(alpha: 0.5),
            height: 1.4,
          ),
        ),
        const SizedBox(height: 12),
      ],
    );
  }
}
