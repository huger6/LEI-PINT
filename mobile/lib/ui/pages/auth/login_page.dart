import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../widgets/shared/auth_header.dart';
import '../../widgets/shared/custom_text_field.dart';
import '../../widgets/shared/custom_button.dart';
import '../../widgets/shared/nav_link.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/routes/app_router.dart';
import '../../../injection_container.dart';

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

  Future<void> _handleLogin() async {
    final tr = LanguageScope.of(context);
    if (_formKey.currentState!.validate()) {
      setState(() => _isLoading = true);

      try {
        final authStore = context.read<AuthStore>();

        final result = await authStore.login(
          _loginController.text.trim(),
          _passwordController.text,
          _saveLoginData,
        );

        if (!mounted) return;

        setState(() => _isLoading = false);

        if (result['success'] == true) {
          final user = result['user'];

          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                tr
                    .tr('loginSuccess')
                    .replaceAll(
                      '{user}',
                      user?.fullName ?? _loginController.text,
                    ),
              ),
              backgroundColor: AppColors.success,
            ),
          );

          Navigator.pushReplacementNamed(context, AppRouter.dashboard);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                result['message'] ?? tr.tr('loginErrorInvalidCredentials'),
              ),
              backgroundColor: AppColors.error,
            ),
          );
        }
      } catch (e) {
        if (!mounted) return;
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(tr.tr('loginErrorServer')),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    FormValidators.configure(
      languageCode: tr.languageCode,
      translator: tr.tr,
    );

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              children: [
                const SizedBox(height: 40),

                AuthHeader(
                  title: tr.tr('welcomeBack'),
                  subtitle: tr.tr('loginSubtitle'),
                  imagePath: 'assets/images/logotipo_softinsa.png',
                ),

                const SizedBox(height: 48),

                // Email/Username field
                CustomTextField(
                  label: tr.tr('emailOrUsername'),
                  isRequired: true,
                  hintText: tr.tr('emailOrUsernameHint'),
                  prefixIcon: Icons.email_outlined,
                  keyboardType: TextInputType.text,
                  controller: _loginController,
                  validator: (value) {
                    final text = value?.trim() ?? '';
                    if (text.isEmpty) {
                      return tr.tr('emailOrUsernameRequired');
                    }

                    if (text.contains('@')) {
                      return FormValidators.validateEmail(text);
                    }

                    if (text.length < 3) {
                      return tr.tr('usernameMinChars');
                    }

                    return null;
                  },
                ),

                // Password field
                CustomTextField(
                  label: tr.tr('password'),
                  isRequired: true,
                  hintText: tr.tr('enterPasswordHint'),
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
                  title: Text(tr.tr('saveLoginData')),
                  controlAffinity: ListTileControlAffinity.leading,
                ),

                // Forgot password link
                Align(
                  alignment: Alignment.centerRight,
                  child: GestureDetector(
                    onTap: () {
                      Navigator.pushNamed(context, AppRouter.forgotPassword);
                    },
                    child: Text(
                      tr.tr('forgotPassword'),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 32),

                // Login button
                CustomButton(
                  text: tr.tr('login'),
                  isLoading: _isLoading,
                  onPressed: _handleLogin,
                ),

                const SizedBox(height: 24),

                // Sign up link
                NavLink(
                  text: tr.tr('noAccount'),
                  linkText: tr.tr('register'),
                  onPressed: () {
                    Navigator.pushNamed(context, AppRouter.register);
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
