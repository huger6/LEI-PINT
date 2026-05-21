import 'dart:async';

import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

class BadgeEmailConfirmationBody extends StatefulWidget {
  const BadgeEmailConfirmationBody({
    super.key,
    required this.badgeTitle,
    required this.userEmail,
    required this.onSendConfirmation,
    required this.onViewApplication,
    required this.onGoToDashboard,
  });

  final String badgeTitle;
  final String userEmail;
  final Future<Map<String, dynamic>> Function() onSendConfirmation;
  final VoidCallback onViewApplication;
  final VoidCallback onGoToDashboard;

  @override
  State<BadgeEmailConfirmationBody> createState() =>
      _BadgeEmailConfirmationBodyState();
}

class _BadgeEmailConfirmationBodyState
    extends State<BadgeEmailConfirmationBody> {
  bool _isSending = false;
  bool _emailSent = false;
  int _cooldownSeconds = 0;
  Timer? _cooldownTimer;

  @override
  void dispose() {
    _cooldownTimer?.cancel();
    super.dispose();
  }

  Future<void> _handleSend() async {
    if (_cooldownSeconds > 0 || _isSending) return;

    setState(() => _isSending = true);

    try {
      final result = await widget.onSendConfirmation();

      if (!mounted) return;

      if (result['success'] == true) {
        setState(() => _emailSent = true);
        _startCooldown();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              result['message']?.toString() ??
                  'Erro ao enviar email de confirmação.',
            ),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Erro ao enviar email. Tente novamente.'),
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
    return _emailSent ? _buildSentState(context) : _buildInitialState(context);
  }

  Widget _buildInitialState(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Column(
      children: [
        const SizedBox(height: 16),
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: AppColors.primaryContainer.withValues(alpha: 0.6),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.mark_email_unread_outlined,
            size: 42,
            color: AppColors.primary,
          ),
        ),
        const SizedBox(height: 24),
        Text(
          'Confirme a sua candidatura',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w700,
                color: colorScheme.onSurface,
              ),
        ),
        const SizedBox(height: 12),
        Text(
          'A sua candidatura foi submetida com sucesso!',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurface.withValues(alpha: 0.7),
              ),
        ),
        const SizedBox(height: 6),
        Text(
          'Para finalizar, envie o email de confirmação '
          'da sua candidatura para a badge:',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurface.withValues(alpha: 0.7),
                height: 1.5,
              ),
        ),
        const SizedBox(height: 12),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: AppColors.primaryContainer.withValues(alpha: 0.3),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: AppColors.primary.withValues(alpha: 0.2),
            ),
          ),
          child: Row(
            children: [
              const Icon(
                Icons.workspace_premium_rounded,
                size: 22,
                color: AppColors.secondary,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  widget.badgeTitle,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: AppColors.secondary,
                      ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 28),
        SizedBox(
          width: double.infinity,
          height: 50,
          child: ElevatedButton.icon(
            onPressed: _isSending ? null : _handleSend,
            icon: _isSending
                ? SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.5,
                      color: AppColors.onPrimary,
                    ),
                  )
                : const Icon(Icons.send_rounded, size: 20),
            label: Text(
              _isSending ? 'A enviar...' : 'Enviar email de confirmação',
              style:
                  const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.onPrimary,
              disabledBackgroundColor:
                  AppColors.primary.withValues(alpha: 0.6),
              disabledForegroundColor:
                  AppColors.onPrimary.withValues(alpha: 0.8),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
              elevation: 0,
            ),
          ),
        ),
        const SizedBox(height: 12),
      ],
    );
  }

  Widget _buildSentState(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Column(
      children: [
        const SizedBox(height: 16),
        Container(
          width: 80,
          height: 80,
          decoration: const BoxDecoration(
            color: Color(0xFFE8F5E9),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.mark_email_read_outlined,
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
          widget.userEmail,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                fontWeight: FontWeight.w700,
                color: AppColors.primary,
              ),
        ),
        const SizedBox(height: 16),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: AppColors.primaryContainer.withValues(alpha: 0.3),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: AppColors.primary.withValues(alpha: 0.2),
            ),
          ),
          child: Row(
            children: [
              const Icon(
                Icons.workspace_premium_rounded,
                size: 22,
                color: AppColors.secondary,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  widget.badgeTitle,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: AppColors.secondary,
                      ),
                ),
              ),
            ],
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
            'A sua candidatura será avaliada pelo Talent Manager '
            'e pelo Service Line Leader. Receberá uma notificação '
            'com o resultado.',
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
            onPressed: widget.onViewApplication,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.onPrimary,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
              elevation: 0,
            ),
            child: const Text(
              'Ver estado da candidatura',
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
                (_cooldownSeconds > 0 || _isSending) ? null : _handleSend,
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
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          height: 46,
          child: TextButton(
            onPressed: widget.onGoToDashboard,
            child: Text(
              'Voltar ao Menu',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: colorScheme.outline,
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),
        Divider(color: colorScheme.outline.withValues(alpha: 0.22)),
        const SizedBox(height: 16),
        Icon(
          Icons.info_outline_rounded,
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
