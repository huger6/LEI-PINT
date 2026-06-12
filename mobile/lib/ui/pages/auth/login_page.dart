import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../widgets/shared/auth_header.dart';
import '../../widgets/shared/auth_particle_background.dart';
import '../../widgets/shared/auth_content_card.dart';
import '../../widgets/shared/custom_text_field.dart';
import '../../widgets/shared/custom_button.dart';
import '../../widgets/shared/nav_link.dart';
import '../../../core/theme/app_colors.dart';
import 'package:go_router/go_router.dart';

import '../../../core/routes/app_router.dart';
import '../../../injection_container.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _loginController;
  late final TextEditingController _passwordController;
  bool _isLoading = false;
  bool _saveLoginData = false;

  String? _loginError;
  String? _passwordError;

  @override
  void initState() {
    super.initState();
    _loginController = TextEditingController();
    _passwordController = TextEditingController();

    _loginController.addListener(_clearFieldErrors);
    _passwordController.addListener(_clearFieldErrors);
  }

  @override
  void dispose() {
    _loginController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _clearFieldErrors() {
    if (_loginError != null || _passwordError != null) {
      setState(() {
        _loginError = null;
        _passwordError = null;
      });
    }
  }

  Future<void> _handleLogin() async {
    final tr = LanguageScope.of(context);

    setState(() {
      _loginError = null;
      _passwordError = null;
    });

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

          final role = (user?.role ?? authStore.currentUser?.role ?? '')
              .toString()
              .trim();
          if (role.isNotEmpty &&
              role.toLowerCase() != 'consultant') {
            await authStore.clearSession();
            if (!mounted) return;
            setState(() => _isLoading = false);
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text(
                  'Apenas contas de Consultores podem aceder à aplicação móvel.',
                ),
                backgroundColor: Color(0xFFD94827),
                duration: Duration(seconds: 4),
              ),
            );
            return;
          }

          final forcePasswordChange =
              result['forcePasswordChange'] == true;
          final firstLogin = result['firstLogin'] == true;

          final langId = authStore.currentUser?.preferredLangId;
          await LanguageScope.of(context).setLanguageFromId(langId);

          if (!mounted) return;

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

          if (forcePasswordChange || firstLogin) {
            context.go(AppRouter.changePassword, extra: true);
          } else {
            context.go(AppRouter.dashboard);
          }
        } else if (result['emailNotConfirmed'] == true) {
          final identifier = _loginController.text.trim();
          final email = identifier.contains('@') ? identifier : '';

          if (email.isNotEmpty) {
            context.push(AppRouter.emailConfirmation, extra: email);
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  result['message'] ??
                      'O seu email ainda não foi confirmado. '
                          'Verifique a sua caixa de correio.',
                ),
                backgroundColor: AppColors.warning,
                duration: const Duration(seconds: 5),
              ),
            );
          }
        } else {
          final code = result['code']?.toString() ?? '';
          final statusCode = result['statusCode'] as int? ?? 0;

          if (code == 'AUTH_INVALID_CREDENTIALS') {
            if (statusCode == 400) {
              setState(() {
                _loginError = tr.tr('loginErrorUserNotFound');
              });
            } else {
              setState(() {
                _passwordError = tr.tr('loginErrorWrongPassword');
              });
            }
          } else if (code == 'AUTH_ACCOUNT_DEACTIVATED') {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(tr.tr('loginErrorAccountDeactivated')),
                backgroundColor: AppColors.error,
              ),
            );
          } else if (code == 'AUTH_ACCOUNT_LOCKED') {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(tr.tr('loginErrorAccountLocked')),
                backgroundColor: AppColors.error,
                duration: const Duration(seconds: 5),
              ),
            );
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
    final colorScheme = Theme.of(context).colorScheme;
    FormValidators.configure(languageCode: tr.languageCode, translator: tr.tr);

    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          const AuthParticleBackground(),
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
              child: AuthContentCard(
                child: Form(
                  key: _formKey,
                  child: Column(
                    children: [
                      const SizedBox(height: 8),

                      AuthHeader(
                        title: tr.tr('welcomeBack'),
                        subtitle: tr.tr('loginSubtitle'),
                        imagePath: 'assets/images/logotipo_softinsa.png',
                      ),

                      const SizedBox(height: 36),

                      CustomTextField(
                        label: tr.tr('emailOrUsername'),
                        isRequired: true,
                        hintText: tr.tr('emailOrUsernameHint'),
                        prefixIcon: Icons.email_outlined,
                        keyboardType: TextInputType.text,
                        controller: _loginController,
                        hasError: _loginError != null,
                        errorText: _loginError,
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

                      CustomTextField(
                        label: tr.tr('password'),
                        isRequired: true,
                        hintText: tr.tr('enterPasswordHint'),
                        prefixIcon: Icons.lock_outlined,
                        obscureText: true,
                        controller: _passwordController,
                        hasError: _passwordError != null,
                        errorText: _passwordError,
                        validator: FormValidators.validatePassword,
                      ),

                      Material(
                        color: Colors.transparent,
                        child: CheckboxListTile(
                          contentPadding: EdgeInsets.zero,
                          value: _saveLoginData,
                          onChanged: (value) {
                            setState(() => _saveLoginData = value ?? false);
                          },
                          activeColor: colorScheme.primary,
                          title: Text(tr.tr('saveLoginData')),
                          controlAffinity: ListTileControlAffinity.leading,
                        ),
                      ),

                      Align(
                        alignment: Alignment.centerRight,
                        child: GestureDetector(
                          onTap: () {
                            context.push(AppRouter.forgotPassword);
                          },
                          child: Text(
                            tr.tr('forgotPassword'),
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(
                                  color: colorScheme.primary,
                                  fontWeight: FontWeight.w600,
                                ),
                          ),
                        ),
                      ),

                      const SizedBox(height: 28),

                      CustomButton(
                        text: tr.tr('login'),
                        isLoading: _isLoading,
                        onPressed: _handleLogin,
                      ),

                      const SizedBox(height: 22),

                      NavLink(
                        text: tr.tr('noAccount'),
                        linkText: tr.tr('register'),
                        onPressed: () {
                          context.push(AppRouter.register);
                        },
                      ),

                      const SizedBox(height: 8),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
