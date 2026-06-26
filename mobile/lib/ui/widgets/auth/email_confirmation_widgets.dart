import 'dart:async';

import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/email_utils.dart';
import '../../../presentation/state/language_controller.dart';
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
    _startCooldown(60);
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
        _startCooldown(60);
      } else {
        final code = result['code']?.toString() ?? '';
        final tr = LanguageScope.of(context);

        if (code == 'AUTH_RESEND_RATE_LIMITED') {
          final retryAfter = result['retryAfter'] as int? ?? 120;
          _startCooldown(retryAfter);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                tr
                    .tr('rateLimitedRetry')
                    .replaceAll('{seconds}', retryAfter.toString()),
              ),
              backgroundColor: AppColors.error,
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                result['message']?.toString() ??
                    tr.tr('resendConfirmationError'),
              ),
              backgroundColor: AppColors.error,
            ),
          );
        }
      }
    } catch (_) {
      if (!mounted) return;
      final tr = LanguageScope.of(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(tr.tr('resendConfirmationErrorRetry')),
          backgroundColor: AppColors.error,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isSending = false);
      }
    }
  }

  void _startCooldown(int seconds) {
    _cooldownSeconds = seconds;
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
    final tr = LanguageScope.of(context);
    final maskedEmail = maskEmail(widget.email);

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
          child: const AppIcon(
            AppIcons.email,
            size: 42,
            color: AppColors.success,
          ),
        ),
        const SizedBox(height: 24),
        Text(
          tr.tr('emailConfirmationTitle'),
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.w700,
            color: colorScheme.onSurface,
          ),
        ),
        const SizedBox(height: 12),
        Text(
          tr.tr('emailConfirmationSentTo'),
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: colorScheme.onSurface.withValues(alpha: 0.7),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          maskedEmail.isNotEmpty ? maskedEmail : widget.email,
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
            tr.tr('emailConfirmationInstructions'),
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
            child: Text(
              tr.tr('goToLogin'),
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
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
                        ? tr
                            .tr('resendConfirmationCooldown')
                            .replaceAll(
                              '{seconds}',
                              _cooldownSeconds.toString(),
                            )
                        : tr.tr('resendConfirmationBtn'),
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
          tr.tr('checkSpamHint'),
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
