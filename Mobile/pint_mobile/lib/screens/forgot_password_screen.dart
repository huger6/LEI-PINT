import 'package:flutter/material.dart';
import '../widgets/auth_header.dart';
import '../widgets/custom_text_field.dart';
import '../widgets/custom_button.dart';
import '../utils/form_validators.dart';

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
              'Instruções enviadas para ${_emailController.text}',
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
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('Recuperar Password'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const SizedBox(height: 40),

              // Header
              AuthHeader(
                title: 'Recuperar Password',
                subtitle: 'Insira seu email para receber instruções',
              ),

              const SizedBox(height: 48),

              if (!_emailSent) ...[
                // Email input form
                Form(
                  key: _formKey,
                  child: Column(
                    children: [
                      CustomTextField(
                        label: 'Email',
                        hintText: 'seu.email@softinsa.com',
                        prefixIcon: Icons.email_outlined,
                        keyboardType: TextInputType.emailAddress,
                        controller: _emailController,
                        validator: FormValidators.validateEmail,
                      ),
                      const SizedBox(height: 32),
                      CustomButton(
                        text: 'Enviar Instruções',
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
                        'Email Enviado!',
                        style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          color: Colors.green[800],
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Verifique sua caixa de correio para as instruções de recuperação de password.',
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
                    'Voltar para Login',
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
                      'Não recebeu o email?',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Verifique a pasta de spam ou tente novamente com outro email.',
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
