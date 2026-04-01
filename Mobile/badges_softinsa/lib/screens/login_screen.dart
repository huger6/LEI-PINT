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
  final _loginController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _saveLoginData = false;

  @override
  void dispose() {
    _loginController.dispose();
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
            content: Text(
              'Login bem-sucedido! Utilizador: ${_loginController.text}',
            ),
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

                // Email/Username field
                CustomTextField(
                  label: 'Email ou username',
                  isRequired: true,
                  hintText: 'seu.email@softinsa.com ou joaosilva',
                  prefixIcon: Icons.email_outlined,
                  keyboardType: TextInputType.text,
                  controller: _loginController,
                  validator: (value) {
                    final text = value?.trim() ?? '';
                    if (text.isEmpty) {
                      return 'Email ou username é obrigatório';
                    }

                    if (text.contains('@')) {
                      return FormValidators.validateEmail(text);
                    }

                    if (text.length < 3) {
                      return 'Username deve ter no mínimo 3 caracteres';
                    }

                    return null;
                  },
                ),

                // Password field
                CustomTextField(
                  label: 'Password',
                  isRequired: true,
                  hintText: 'Insira sua password',
                  prefixIcon: Icons.lock_outlined,
                  obscureText: true,
                  controller: _passwordController,
                  validator: FormValidators.validatePassword,
                ),

                CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  value: _saveLoginData,
                  onChanged: (value) {
                    setState(() => _saveLoginData = value ?? false);
                  },
                  title: const Text('Guardar dados de login'),
                  controlAffinity: ListTileControlAffinity.leading,
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
