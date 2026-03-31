import 'package:flutter/material.dart';
import '../widgets/auth_header.dart';
import '../widgets/custom_text_field.dart';
import '../widgets/custom_button.dart';
import '../widgets/nav_link.dart';
import '../utils/form_validators.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _handleLogin() {
    if (_formKey.currentState!.validate()) {
      setState(() => _isLoading = true);

      // Simular chamada ao backend
      Future.delayed(const Duration(seconds: 2), () {
        setState(() => _isLoading = false);

        // Mostrar mensagem de sucesso
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Login bem-sucedido! Email: ${_emailController.text}'),
            backgroundColor: Colors.green,
          ),
        );

        // Aqui você poderia navegar para a tela principal da aplicação
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              children: [
                const SizedBox(height: 40),

                // Header com logo e título
                AuthHeader(
                  title: 'Bem-vindo de volta',
                  subtitle: 'Faça login na sua conta',
                  imagePath: 'images/logotipo_softinsa.png',
                ),

                const SizedBox(height: 48),

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
                  hintText: 'Insira sua password',
                  prefixIcon: Icons.lock_outlined,
                  obscureText: true,
                  controller: _passwordController,
                  validator: FormValidators.validatePassword,
                ),

                // Forgot password link
                Align(
                  alignment: Alignment.centerRight,
                  child: GestureDetector(
                    onTap: () {
                      Navigator.pushNamed(context, '/forgot-password');
                    },
                    child: Text(
                      'Esqueci-me da password',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Theme.of(context).primaryColor,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 32),

                // Login button
                CustomButton(
                  text: 'Entrar',
                  isLoading: _isLoading,
                  onPressed: _handleLogin,
                ),

                const SizedBox(height: 24),

                // Sign up link
                NavLink(
                  text: 'Não tem conta?',
                  linkText: 'Criar conta',
                  onPressed: () {
                    Navigator.pushNamed(context, '/register');
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
