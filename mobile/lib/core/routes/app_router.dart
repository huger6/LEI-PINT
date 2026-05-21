import 'package:flutter/material.dart';
import '../../ui/pages/auth/auth_loading_screen.dart';
import '../../ui/pages/auth/login_page.dart';
import '../../ui/pages/auth/register_screen.dart';
import '../../ui/pages/auth/forgot_password_page.dart';
import '../../ui/pages/auth/newuser_confirm.dart';
import '../../ui/pages/auth/change_password_screen.dart';
import '../../ui/pages/misc/select_areas_page.dart';
import '../../ui/pages/dashboard_page.dart';
import '../../ui/pages/badges/explore_badges.dart';
import '../../ui/pages/badges/my_badges_screen.dart';
import '../../ui/pages/evolution/evolucao_screen.dart';
import '../../ui/pages/profile/profile_screen.dart';
import '../../ui/pages/profile/email_signature_screen.dart';
import '../../ui/pages/profile/edit_profile_screen.dart';
import '../../ui/pages/profile/characteristics_screen.dart';
import '../../ui/pages/profile/help_screen.dart';
import '../../ui/pages/profile/badge_gallery_screen.dart';
import '../../ui/pages/profile/terms_conditions_screen.dart';

class AppRouter {
  static const String initial = '/';
  static const String login = '/login';
  static const String register = '/register';
  static const String forgotPassword = '/forgot-password';
  static const String selectArea = '/select-area';
  static const String newUserConfirm = '/newuser-confirm';
  static const String dashboard = '/dashboard';
  static const String exploreCompetencies = '/explore-competencies';
  static const String myBadges = '/my-badges';
  static const String evolucao = '/evolucao';
  static const String profile = '/profile';
  static const String emailSignature = '/email-signature';
  static const String editProfile = '/edit-profile';
  static const String termsConditions = '/terms-conditions';
  static const String changePassword = '/change-password';
  static const String characteristics = '/characteristics';
  static const String help = '/help';
  static const String badgeGallery = '/badge-gallery';

  static Map<String, WidgetBuilder> get routes => {
    initial: (context) => const AuthLoadingScreen(),
    login: (context) => const LoginScreen(),
    register: (context) => const RegisterScreen(),
    forgotPassword: (context) => const ForgotPasswordScreen(),

    selectArea: (context) => const SelectAreaScreen(),

    newUserConfirm: (context) => const NewUserConfirmScreen(),

    dashboard: (context) => const DashboardScreen(),
    exploreCompetencies: (context) => const ExploreCompetenciesScreen(),
    myBadges: (context) => const MyBadgesScreen(),
    evolucao: (context) => const EvolucaoScreen(),
    profile: (context) => const ProfileScreen(),
    emailSignature: (context) => const EmailSignatureScreen(),
    editProfile: (context) => const EditProfileScreen(),
    termsConditions: (context) => const TermsConditionsScreen(),
    changePassword: (context) => const ChangePasswordScreen(),
    characteristics: (context) => const CharacteristicsScreen(),
    help: (context) => const HelpScreen(),
    badgeGallery: (context) => const BadgeGalleryScreen(),
  };
}
