import 'package:flutter/material.dart';
import '../../ui/pages/auth/login_page.dart';
import '../../ui/pages/auth/register_screen.dart';
import '../../ui/pages/auth/forgot_password_page.dart';
import '../../ui/pages/auth/newuser_confirm.dart';
import '../../ui/pages/misc/select_areas_page.dart';
import '../../ui/pages/dashboard_page.dart';
import '../../ui/pages/badges/explore_badges.dart';

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

    selectArea: (context) => const SelectAreaScreen(),

    newUserConfirm: (context) => const NewUserConfirmScreen(),

    dashboard: (context) => const DashboardScreen(),
    exploreCompetencies: (context) => const ExploreCompetenciesScreen(),
  };
}
