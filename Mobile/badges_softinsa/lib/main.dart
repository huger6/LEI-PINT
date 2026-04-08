import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'theme/app_theme.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/forgot_password_screen.dart';
import 'screens/select_area.dart';
import 'screens/newuser_confirm.dart';
import 'utils/language_controller.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  final LanguageController _languageController = LanguageController();

  @override
  void initState() {
    super.initState();
    _languageController.initialize();
  }

  @override
  void dispose() {
    _languageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return LanguageScope(
      controller: _languageController,
      child: AnimatedBuilder(
        animation: _languageController,
        builder: (context, _) {
          return MaterialApp(
            title: _languageController.tr('appTitle'),
            theme: AppTheme.lightTheme,
            debugShowCheckedModeBanner: false,
            locale: _languageController.locale,
            localizationsDelegates: const [
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            supportedLocales: const [
              Locale('pt'),
              Locale('en'),
              Locale('es'),
              Locale('fr'),
            ],
            initialRoute: '/',
            routes: {
              '/': (context) => const LoginScreen(),
              '/register': (context) => const RegisterScreen(),
              '/forgot-password': (context) => const ForgotPasswordScreen(),
              '/select-area': (context) {
                final args =
                    ModalRoute.of(context)?.settings.arguments
                        as Map<String, dynamic>?;
                return SelectAreaScreen(registrationData: args);
              },
              '/newuser-confirm': (context) {
                final args =
                    ModalRoute.of(context)?.settings.arguments
                        as Map<String, dynamic>?;
                return NewUserConfirmScreen(registrationData: args);
              },
            },
          );
        },
      ),
    );
  }
}
