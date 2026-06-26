import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/routes/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../presentation/state/auth_store.dart';
import '../../../presentation/state/form_validators.dart';
import '../../../presentation/state/language_controller.dart';
import '../shared/password_strength_indicator.dart';
import '../shared/app_icon/app_icon.dart';
import '../shared/app_icon/app_icon_data.dart';

enum _ScreenState { loading, invalid, valid, success }

class ResetPasswordBody extends StatefulWidget {
  const ResetPasswordBody({super.key, required this.token});

  final String token;

  @override
  State<ResetPasswordBody> createState() => _ResetPasswordBodyState();
}

class _ResetPasswordBodyState extends State<ResetPasswordBody> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _newCtrl;
  late final TextEditingController _confirmCtrl;

  _ScreenState _state = _ScreenState.loading;
  String _errorMessage = '';
  bool _isSubmitting = false;
  bool _obscureNew = true;
  bool _obscureConfirm = true;
  String _newPasswordText = '';

  @override
  void initState() {
    super.initState();
    _newCtrl = TextEditingController();
    _confirmCtrl = TextEditingController();
    _newCtrl.addListener(() {
      if (_newPasswordText != _newCtrl.text) {
        setState(() => _newPasswordText = _newCtrl.text);
      }
    });
    _validateToken();
  }

  @override
  void dispose() {
    _newCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  Future<void> _validateToken() async {
    if (widget.token.isEmpty) {
      setState(() {
        _errorMessage = '';
        _state = _ScreenState.invalid;
      });
      return;
    }

    final authStore = context.read<AuthStore>();
    final result = await authStore.validateResetToken(widget.token);

    if (!mounted) return;

    if (result['success'] == true) {
      setState(() => _state = _ScreenState.valid);
    } else {
      final code = result['code']?.toString() ?? '';
      final tr = LanguageScope.of(context);
      setState(() {
        _errorMessage = code == 'AUTH_TOKEN_EXPIRED'
            ? tr.tr('tokenExpired')
            : (result['message']?.toString() ?? tr.tr('invalidOrExpiredDesc'));
        _state = _ScreenState.invalid;
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);

    final authStore = context.read<AuthStore>();
    final result = await authStore.resetPassword(
      widget.token,
      _newCtrl.text,
    );

    if (!mounted) return;
    setState(() => _isSubmitting = false);

    if (result['success'] == true) {
      setState(() => _state = _ScreenState.success);
    } else {
      final code = result['code']?.toString() ?? '';
      if (code == 'AUTH_TOKEN_EXPIRED' ||
          code == 'AUTH_TOKEN_INVALID_OR_USED') {
        final tr = LanguageScope.of(context);
        setState(() {
          _errorMessage = result['message']?.toString() ??
              tr.tr('invalidOrExpiredDesc');
          _state = _ScreenState.invalid;
        });
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              result['message']?.toString() ?? 'Erro ao redefinir password.',
            ),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    final colorScheme = Theme.of(context).colorScheme;
    FormValidators.configure(languageCode: tr.languageCode, translator: tr.tr);

    return switch (_state) {
      _ScreenState.loading => _buildLoading(tr, colorScheme),
      _ScreenState.invalid => _buildInvalid(tr, colorScheme),
      _ScreenState.valid => _buildForm(tr, colorScheme),
      _ScreenState.success => _buildSuccess(tr, colorScheme),
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
          tr.tr('validatingLink'),
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurface.withValues(alpha: 0.6),
              ),
        ),
        const SizedBox(height: 40),
      ],
    );
  }

  Widget _buildInvalid(LanguageController tr, ColorScheme colorScheme) {
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
          tr.tr('invalidOrExpiredTitle'),
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w700,
                color: colorScheme.onSurface,
              ),
        ),
        const SizedBox(height: 12),
        Text(
          _errorMessage.isNotEmpty
              ? _errorMessage
              : tr.tr('invalidOrExpiredDesc'),
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
            onPressed: () => context.go(AppRouter.forgotPassword),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.onPrimary,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
              elevation: 0,
            ),
            child: Text(
              tr.tr('requestNewLink'),
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
          ),
        ),
        const SizedBox(height: 12),
        TextButton(
          onPressed: () => context.go(AppRouter.login),
          child: Text(
            tr.tr('backToLogin'),
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: colorScheme.primary,
                  fontWeight: FontWeight.w600,
                ),
          ),
        ),
        const SizedBox(height: 12),
      ],
    );
  }

  Widget _buildForm(LanguageController tr, ColorScheme colorScheme) {
    return Form(
      key: _formKey,
      child: Column(
        children: [
          const SizedBox(height: 8),
          Text(
            tr.tr('resetPasswordTitle'),
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: colorScheme.onSurface,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            tr.tr('resetPasswordSubtitle'),
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: colorScheme.onSurface.withValues(alpha: 0.6),
                ),
          ),
          const SizedBox(height: 28),
          _PasswordField(
            label: tr.tr('newPassword'),
            controller: _newCtrl,
            obscure: _obscureNew,
            onToggle: () => setState(() => _obscureNew = !_obscureNew),
            validator: FormValidators.validatePassword,
          ),
          PasswordStrengthIndicator(password: _newPasswordText),
          const SizedBox(height: 14),
          _PasswordField(
            label: tr.tr('confirmNewPassword'),
            controller: _confirmCtrl,
            obscure: _obscureConfirm,
            onToggle: () =>
                setState(() => _obscureConfirm = !_obscureConfirm),
            validator: (v) => FormValidators.validatePasswordConfirm(
              v,
              password: _newCtrl.text,
            ),
          ),
          const SizedBox(height: 28),
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              onPressed: _isSubmitting ? null : _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                elevation: 0,
              ),
              child: _isSubmitting
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.5,
                        color: Colors.white,
                      ),
                    )
                  : Text(
                      tr.tr('resetPasswordBtn'),
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
            ),
          ),
          const SizedBox(height: 12),
        ],
      ),
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
          tr.tr('resetPasswordSuccess'),
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w700,
                color: colorScheme.onSurface,
              ),
        ),
        const SizedBox(height: 12),
        Text(
          tr.tr('resetPasswordSuccessDesc'),
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
}

class _PasswordField extends StatelessWidget {
  const _PasswordField({
    required this.label,
    required this.controller,
    required this.obscure,
    required this.onToggle,
    this.validator,
  });

  final String label;
  final TextEditingController controller;
  final bool obscure;
  final VoidCallback onToggle;
  final String? Function(String?)? validator;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: Color(0xFF2A3540),
          ),
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          obscureText: obscure,
          validator: validator,
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.white,
            hintText: label,
            hintStyle: const TextStyle(
              color: Color(0xFFACB5BE),
              fontWeight: FontWeight.w500,
            ),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 14,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFDDE3E9)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFDDE3E9)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(
                color: AppColors.primary,
                width: 1.5,
              ),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.error),
            ),
            suffixIcon: IconButton(
              icon: AppIcon(
                obscure ? AppIcons.eyeSlash : AppIcons.eye,
                color: const Color(0xFF8B96A1),
                size: 20,
              ),
              onPressed: onToggle,
            ),
          ),
        ),
      ],
    );
  }
}
