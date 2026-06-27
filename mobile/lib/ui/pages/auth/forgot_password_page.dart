import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../widgets/shared/auth_header.dart';
import '../../widgets/shared/auth_particle_background.dart';
import '../../widgets/shared/auth_content_card.dart';
import '../../widgets/shared/custom_text_field.dart';
import '../../widgets/shared/custom_button.dart';
import '../../../core/routes/app_router.dart';
import '../../../core/sync_manager.dart';
import '../../../core/utils/email_utils.dart';
import '../../../core/theme/app_colors.dart';
import '../../../presentation/state/auth_store.dart';
import '../../widgets/shared/app_icon/app_icon.dart';
import '../../widgets/shared/app_icon/app_icon_data.dart';
import '../../widgets/auth/auth_language_button.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _emailController;
  bool _isLoading = false;
  bool _emailSent = false;

  @override
  void initState() {
    super.initState();
    _emailController = TextEditingController();
  }

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _handleSendInstructions() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final authStore = context.read<AuthStore>();
    final result = await authStore.forgotPassword(_emailController.text.trim());

    if (!mounted) return;
    setState(() {
      _isLoading = false;
      if (result['success'] == true) {
        _emailSent = true;
      }
    });

    if (result['success'] != true) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            result['message']?.toString() ?? 'Erro ao enviar email.',
          ),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    final colorScheme = Theme.of(context).colorScheme;
    FormValidators.configure(languageCode: tr.languageCode, translator: tr.tr);

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const AppIcon(AppIcons.chevronBackward),
          onPressed: () => context.go(AppRouter.login),
        ),
        title: Text(tr.tr('recoverPassword')),
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: 8),
            child: AuthLanguageButton(),
          ),
        ],
      ),
      body: Stack(
        fit: StackFit.expand,
        children: [
          const AuthParticleBackground(),
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
              child: AuthContentCard(
                child: Column(
                  children: [
                    const SizedBox(height: 8),

                    // Header
                    AuthHeader(
                      title: tr.tr('recoverPassword'),
                      subtitle: tr.tr('recoverSubtitle'),
                    ),

                    const SizedBox(height: 36),

                    if (!_emailSent) ...[
                      // Email input form
                      Form(
                        key: _formKey,
                        child: Column(
                          children: [
                            CustomTextField(
                              label: tr.tr('email'),
                              hintText: tr.tr('emailHint'),
                              prefixIcon: AppIcons.email,
                              keyboardType: TextInputType.emailAddress,
                              controller: _emailController,
                              validator: FormValidators.validateEmail,
                            ),
                            const SizedBox(height: 28),
                            CustomButton(
                              text: tr.tr('sendInstructions'),
                              isLoading: _isLoading,
                              onPressed: _handleSendInstructions,
                            ),
                          ],
                        ),
                      ),
                    ] else ...[
                      // Success message
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: colorScheme.primaryContainer.withValues(
                            alpha: 0.56,
                          ),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: colorScheme.primary.withValues(alpha: 0.35),
                          ),
                        ),
                        child: Column(
                          children: [
                            AppIcon(
                              AppIcons.checkCircle,
                              color: colorScheme.primary,
                              size: 50,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              tr.tr('emailSent'),
                              style: Theme.of(context).textTheme.headlineSmall
                                  ?.copyWith(color: colorScheme.onSurface),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              tr.tr('checkMailbox'),
                              textAlign: TextAlign.center,
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              maskEmail(_emailController.text.trim()),
                              textAlign: TextAlign.center,
                              style: Theme.of(context).textTheme.bodyLarge
                                  ?.copyWith(
                                    fontWeight: FontWeight.w700,
                                    color: colorScheme.primary,
                                  ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 28),
                      TextButton(
                        onPressed: () => context.go(AppRouter.login),
                        child: Text(
                          tr.tr('backToLogin'),
                          style: Theme.of(context).textTheme.bodyLarge
                              ?.copyWith(
                                color: colorScheme.primary,
                                fontWeight: FontWeight.w600,
                              ),
                        ),
                      ),
                    ],

                    const SizedBox(height: 30),

                    // Help section
                    if (!_emailSent)
                      Column(
                        children: [
                          Divider(
                            color: colorScheme.outline.withValues(alpha: 0.22),
                          ),
                          const SizedBox(height: 20),
                          Text(
                            tr.tr('didNotReceiveEmail'),
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                          const SizedBox(height: 14),
                          Text(
                            tr.tr('checkSpam'),
                            textAlign: TextAlign.center,
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ],
                      ),
                    const SizedBox(height: 8),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
