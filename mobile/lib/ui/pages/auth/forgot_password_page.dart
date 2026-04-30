import 'package:flutter/material.dart';
import '../../widgets/shared/auth_header.dart';
import '../../widgets/shared/auth_particle_background.dart';
import '../../widgets/shared/auth_content_card.dart';
import '../../widgets/shared/custom_text_field.dart';
import '../../widgets/shared/custom_button.dart';
import '../../../core/sync_manager.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({Key? key}) : super(key: key);

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  bool _isLoading = false;
  bool _emailSent = false;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  void _handleSendInstructions() {
    final tr = LanguageScope.of(context);
    if (_formKey.currentState!.validate()) {
      setState(() => _isLoading = true);

      Future.delayed(const Duration(seconds: 2), () {
        setState(() {
          _isLoading = false;
          _emailSent = true;
        });

        // Mostrar mensagem de sucesso
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              tr.tr('emailSentTo').replaceAll('{email}', _emailController.text),
            ),
            backgroundColor: Colors.green,
          ),
        );

        Future.delayed(const Duration(seconds: 3), () {
          Navigator.pop(context);
        });
      });
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
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(tr.tr('recoverPassword')),
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
                              prefixIcon: Icons.email_outlined,
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
                            Icon(
                              Icons.check_circle,
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
                          ],
                        ),
                      ),
                      const SizedBox(height: 28),
                      TextButton(
                        onPressed: () => Navigator.pop(context),
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
