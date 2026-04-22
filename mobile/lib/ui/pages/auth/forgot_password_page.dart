import 'package:flutter/material.dart';
import '../../widgets/shared/auth_header.dart';
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

      // Simular chamada ao backend
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

        // Voltar para login após alguns segundos
        Future.delayed(const Duration(seconds: 3), () {
          Navigator.pop(context);
        });
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    FormValidators.setLanguageCode(tr.languageCode);

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(tr.tr('recoverPassword')),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const SizedBox(height: 40),

              // Header
              AuthHeader(
                title: tr.tr('recoverPassword'),
                subtitle: tr.tr('recoverSubtitle'),
              ),

              const SizedBox(height: 48),

              if (!_emailSent) ...[
                // Email input form
                Form(
                  key: _formKey,
                  child: Column(
                    children: [
                      CustomTextField(
                        label: tr.tr('email'),
                        hintText: 'seu.email@softinsa.com',
                        prefixIcon: Icons.email_outlined,
                        keyboardType: TextInputType.emailAddress,
                        controller: _emailController,
                        validator: FormValidators.validateEmail,
                      ),
                      const SizedBox(height: 32),
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
                    color: const Color(0xFFF1F8E9),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: const Color(0xFF558B2F),
                      width: 2,
                    ),
                  ),
                  child: Column(
                    children: [
                      Icon(
                        Icons.check_circle,
                        color: Colors.green[700],
                        size: 48,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        tr.tr('emailSent'),
                        style: Theme.of(context).textTheme.headlineSmall
                            ?.copyWith(color: Colors.green[800]),
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
                const SizedBox(height: 32),
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: Text(
                    tr.tr('backToLogin'),
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: Theme.of(context).primaryColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],

              const SizedBox(height: 60),

              // Help section
              if (!_emailSent)
                Column(
                  children: [
                    const Divider(),
                    const SizedBox(height: 24),
                    Text(
                      tr.tr('didNotReceiveEmail'),
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      tr.tr('checkSpam'),
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
            ],
          ),
        ),
      ),
    );
  }
}
