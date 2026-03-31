import 'package:flutter/material.dart';
import '../widgets/auth_header.dart';
import '../widgets/custom_text_field.dart';
import '../widgets/custom_button.dart';
import '../widgets/nav_link.dart';
import '../utils/form_validators.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({Key? key}) : super(key: key);

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _isLoading = false;
  bool _agreedToTerms = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _handleRegister() {
    if (_formKey.currentState!.validate() && _agreedToTerms) {
      setState(() => _isLoading = true);

      // Simular chamada ao backend
      Future.delayed(const Duration(seconds: 2), () {
        setState(() => _isLoading = false);

        // Mostrar mensagem de sucesso
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Conta criada com sucesso! Email: ${_emailController.text}',
            ),
            backgroundColor: Colors.green,
          ),
        );

        // Navegar de volta para login
        Future.delayed(const Duration(seconds: 1), () {
          Navigator.pop(context);
        });
      });
    } else if (!_agreedToTerms) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Você deve aceitar os termos para continuar'),
          backgroundColor: Colors.orange,
        ),
      );
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
        title: const Text('Criar Conta'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              children: [
                const SizedBox(height: 24),

                // Header
                AuthHeader(
                  title: 'Crie sua conta',
                  subtitle: 'Junte-se à Softinsa',
                  imagePath: 'images/logotipo_softinsa.png',
                ),

                const SizedBox(height: 48),

                // Name field
                CustomTextField(
                  label: 'Nome Completo',
                  hintText: 'João Silva',
                  prefixIcon: Icons.person_outlined,
                  keyboardType: TextInputType.name,
                  controller: _nameController,
                  validator: FormValidators.validateName,
                ),

                // Email field
                CustomTextField(
                  label: 'Email',
                  hintText: 'seu.email@softinsa.com',
                  prefixIcon: Icons.email_outlined,
                  keyboardType: TextInputType.emailAddress,
                  controller: _emailController,
                  validator: FormValidators.validateEmail,
                ),

                // Password field
                CustomTextField(
                  label: 'Password',
                  hintText: 'Crie uma password segura',
                  prefixIcon: Icons.lock_outlined,
                  obscureText: true,
                  controller: _passwordController,
                  validator: FormValidators.validatePassword,
                ),

                // Confirm password field
                CustomTextField(
                  label: 'Confirmar Password',
                  hintText: 'Confirme sua password',
                  prefixIcon: Icons.lock_outlined,
                  obscureText: true,
                  controller: _confirmPasswordController,
                  validator: (value) => FormValidators.validatePasswordConfirm(
                    value,
                    _passwordController.text,
                  ),
                ),

                // Terms and conditions checkbox
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: Row(
                    children: [
                      Checkbox(
                        value: _agreedToTerms,
                        onChanged: (value) {
                          setState(() => _agreedToTerms = value ?? false);
                        },
                      ),
                      Expanded(
                        child: RichText(
                          text: TextSpan(
                            text: 'Eu aceito os ',
                            style: Theme.of(context).textTheme.bodySmall,
                            children: [
                              TextSpan(
                                text: 'Termos e Condições',
                                style:
                                    Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: Theme.of(context).primaryColor,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 32),

                // Register button
                CustomButton(
                  text: 'Registar',
                  isLoading: _isLoading,
                  onPressed: _handleRegister,
                ),

                const SizedBox(height: 24),

                // Login link
                NavLink(
                  text: 'Já tem conta?',
                  linkText: 'Fazer login',
                  onPressed: () {
                    Navigator.pop(context);
                  },
                ),

                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
