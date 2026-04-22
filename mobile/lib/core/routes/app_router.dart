import 'package:flutter/material.dart';
import '../screens/login_screen.dart';
import '../screens/register_screen.dart';
import '../screens/forgot_password_screen.dart';
import '../screens/select_area.dart';
import '../screens/newuser_confirm.dart';
import '../screens/dashboard_screen.dart';
import '../screens/explore_competencies_screen.dart';

class AppRouter {
  static const String initial = '/';
  static const String login = '/';
  static const String register = '/register';
  static const String forgotPassword = '/forgot-password';
  static const String selectArea = '/select-area';
  static const String newUserConfirm = '/newuser-confirm';
  static const String dashboard = '/dashboard';
  static const String exploreCompetencies = '/explore-competencies';

  static Map<String, WidgetBuilder> get routes => {
    login: (context) => const LoginScreen(),
    register: (context) => const RegisterScreen(),
    forgotPassword: (context) => const ForgotPasswordScreen(),
    selectArea: (context) {
      final args =
          ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
      return SelectAreaScreen(registrationData: args);
    },
    newUserConfirm: (context) {
      final args =
          ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
      return NewUserConfirmScreen(registrationData: args);
    },
    dashboard: (context) => const DashboardScreen(),
    exploreCompetencies: (context) => const ExploreCompetenciesScreen(),
  };
}
