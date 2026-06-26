import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/routes/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../presentation/state/auth_store.dart';
import '../../../presentation/state/language_controller.dart';
import '../shared/app_icon/app_icon.dart';
import '../shared/app_icon/app_icon_data.dart';

enum _ConfirmState { loading, success, error }

class ConfirmEmailTokenBody extends StatefulWidget {
  const ConfirmEmailTokenBody({super.key, required this.token});

  final String token;

  @override
  State<ConfirmEmailTokenBody> createState() => _ConfirmEmailTokenBodyState();
}

class _ConfirmEmailTokenBodyState extends State<ConfirmEmailTokenBody> {
  _ConfirmState _state = _ConfirmState.loading;
  String _errorMessage = '';

  @override
  void initState() {
    super.initState();
    _confirmEmail();
  }

  Future<void> _confirmEmail() async {
    if (widget.token.isEmpty) {
      setState(() {
        _errorMessage = '';
        _state = _ConfirmState.error;
      });
      return;
    }

    final authStore = context.read<AuthStore>();
    final result = await authStore.confirmEmailToken(widget.token);

    if (!mounted) return;

    if (result['success'] == true) {
      setState(() => _state = _ConfirmState.success);
    } else {
      setState(() {
        _errorMessage = result['message']?.toString() ?? '';
        _state = _ConfirmState.error;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    final colorScheme = Theme.of(context).colorScheme;

    return switch (_state) {
      _ConfirmState.loading => _buildLoading(tr, colorScheme),
      _ConfirmState.success => _buildSuccess(tr, colorScheme),
      _ConfirmState.error => _buildError(tr, colorScheme),
    };
  }

  Widget _buildLoading(LanguageController tr, ColorScheme colorScheme) {
    return Column(
      children: [
        const SizedBox(height: 40),
        SizedBox(
          width: 36,
          height: 36,
          child: CircularProgressIndicator(
            strokeWidth: 3,
            color: colorScheme.primary,
          ),
        ),
        const SizedBox(height: 20),
        Text(
          tr.tr('confirmingEmail'),
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurface.withValues(alpha: 0.6),
              ),
        ),
        const SizedBox(height: 40),
      ],
    );
  }

  Widget _buildSuccess(LanguageController tr, ColorScheme colorScheme) {
    return Column(
      children: [
        const SizedBox(height: 16),
        Container(
          width: 64,
          height: 64,
          decoration: const BoxDecoration(
            color: Color(0xFFE8F5E9),
            shape: BoxShape.circle,
          ),
          child: AppIcon(
            AppIcons.checkCircle,
            size: 32,
            color: AppColors.success,
          ),
        ),
        const SizedBox(height: 20),
        Text(
          tr.tr('emailConfirmedTitle'),
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w700,
                color: colorScheme.onSurface,
              ),
        ),
        const SizedBox(height: 12),
        Text(
          tr.tr('emailConfirmedDesc'),
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurface.withValues(alpha: 0.7),
                height: 1.5,
              ),
        ),
        const SizedBox(height: 28),
        SizedBox(
          width: double.infinity,
          height: 50,
          child: ElevatedButton(
            onPressed: () => context.go(AppRouter.login),
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
      ],
    );
  }

  Widget _buildError(LanguageController tr, ColorScheme colorScheme) {
    return Column(
      children: [
        const SizedBox(height: 16),
        Container(
          width: 64,
          height: 64,
          decoration: const BoxDecoration(
            color: Color(0xFFFDECEC),
            shape: BoxShape.circle,
          ),
          child: const AppIcon(AppIcons.closeCircle, size: 32, color: AppColors.error),
        ),
        const SizedBox(height: 20),
        Text(
          tr.tr('confirmationFailed'),
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w700,
                color: colorScheme.onSurface,
              ),
        ),
        const SizedBox(height: 12),
        Text(
          _errorMessage.isNotEmpty
              ? _errorMessage
              : tr.tr('confirmationFailedDesc'),
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurface.withValues(alpha: 0.7),
                height: 1.5,
              ),
        ),
        const SizedBox(height: 28),
        SizedBox(
          width: double.infinity,
          height: 50,
          child: ElevatedButton(
            onPressed: () => context.go(AppRouter.emailConfirmation, extra: ''),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.onPrimary,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
              elevation: 0,
            ),
            child: Text(
              tr.tr('resendConfirmationBtn'),
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          height: 50,
          child: OutlinedButton(
            onPressed: () => context.go(AppRouter.login),
            style: OutlinedButton.styleFrom(
              side: BorderSide(color: colorScheme.primary, width: 1.5),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            child: Text(
              tr.tr('backToLogin'),
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: colorScheme.primary,
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),
      ],
    );
  }
}
