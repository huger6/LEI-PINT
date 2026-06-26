import 'dart:async';

import 'package:flutter/material.dart';

import '../../../core/sync_manager.dart';
import '../../../core/theme/app_colors.dart';
import '../shared/app_icon/app_icon.dart';
import '../shared/app_icon/app_icon_data.dart';

class BadgeEmailConfirmationBody extends StatefulWidget {
  const BadgeEmailConfirmationBody({
    super.key,
    required this.badgeTitle,
    required this.userEmail,
    required this.onSendConfirmation,
    required this.onViewApplication,
    required this.onGoToDashboard,
    this.alreadySent = false,
  });

  final String badgeTitle;
  final String userEmail;
  final Future<Map<String, dynamic>> Function() onSendConfirmation;
  final VoidCallback onViewApplication;
  final VoidCallback onGoToDashboard;
  final bool alreadySent;

  @override
  State<BadgeEmailConfirmationBody> createState() =>
      _BadgeEmailConfirmationBodyState();
}

class _BadgeEmailConfirmationBodyState
    extends State<BadgeEmailConfirmationBody> {
  bool _isSending = false;
  late bool _emailSent;
  int _cooldownSeconds = 0;
  Timer? _cooldownTimer;

  @override
  void initState() {
    super.initState();
    _emailSent = widget.alreadySent;
  }

  @override
  void dispose() {
    _cooldownTimer?.cancel();
    super.dispose();
  }

  Future<void> _handleSend() async {
    if (_cooldownSeconds > 0 || _isSending) return;

    setState(() => _isSending = true);

    final tr = LanguageScope.of(context);

    try {
      final result = await widget.onSendConfirmation();

      if (!mounted) return;

      if (result['success'] == true) {
        setState(() => _emailSent = true);
        _startCooldown();
      } else {
        final msg = result['message']?.toString() ?? '';
        final friendlyMsg = msg.contains('DioException') || msg.contains('404') || msg.contains('status code')
            ? tr.tr('emailResendUnavailable')
            : (msg.isNotEmpty ? msg : tr.tr('emailSendError'));
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(friendlyMsg),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(tr.tr('emailResendFailed')),
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
    final tr = LanguageScope.of(context);

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
          child: const AppIcon(
            AppIcons.email,
            size: 42,
            color: AppColors.primary,
          ),
        ),
        const SizedBox(height: 24),
        Text(
          tr.tr('confirmYourApplication'),
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w700,
                color: colorScheme.onSurface,
              ),
        ),
        const SizedBox(height: 12),
        Text(
          tr.tr('applicationSubmittedSuccess'),
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurface.withValues(alpha: 0.7),
              ),
        ),
        const SizedBox(height: 6),
        Text(
          tr.tr('sendConfirmationInstruction'),
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
              const AppIcon(
                AppIcons.badgePremium,
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
                : const AppIcon(AppIcons.send, size: 20),
            label: Text(
              _isSending ? tr.tr('sending') : tr.tr('sendConfirmationEmail'),
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
    final tr = LanguageScope.of(context);

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
          tr.tr('emailSent'),
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w700,
                color: colorScheme.onSurface,
              ),
        ),
        const SizedBox(height: 12),
        Text(
          tr.tr('confirmationEmailSentTo'),
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
              const AppIcon(
                AppIcons.badgePremium,
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
            tr.tr('applicationWillBeEvaluated'),
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
            child: Text(
              tr.tr('viewApplicationStatus'),
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
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
              tr.tr('backToMenu'),
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: colorScheme.outline,
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),
      ],
    );
  }
}
