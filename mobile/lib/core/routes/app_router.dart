import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../injection_container.dart';
import '../../ui/pages/auth/auth_loading_screen.dart';
import '../../ui/pages/auth/login_page.dart';
import '../../ui/pages/auth/register_screen.dart';
import '../../ui/pages/auth/forgot_password_page.dart';
import '../../ui/pages/auth/newuser_confirm.dart';
import '../../ui/pages/auth/change_password_screen.dart';
import '../../ui/pages/auth/email_confirmation_screen.dart';
import '../../ui/pages/misc/select_areas_page.dart';
import '../../ui/pages/dashboard_page.dart';
import '../../ui/pages/badges/explore_badges.dart';
import '../../ui/pages/badges/my_badges_screen.dart';
import '../../ui/pages/evolution/evolucao_screen.dart';
import '../../ui/pages/profile/profile_screen.dart';
import '../../ui/pages/profile/email_signature_screen.dart';
import '../../ui/pages/profile/edit_profile_screen.dart';
import '../../ui/pages/profile/choose_areas_screen.dart';
import '../../ui/pages/profile/characteristics_screen.dart';
import '../../ui/pages/profile/help_screen.dart';
import '../../ui/pages/profile/badge_gallery_screen.dart';
import '../../ui/pages/profile/terms_conditions_screen.dart';
import '../../ui/pages/goals/goals_screen.dart';
import '../../ui/widgets/shared/no_connection/no_connection_widget.dart';
import '../../ui/widgets/shared/screen_scope/screen_scope.dart';
import '../constants/screen_data_scope.dart';
import '../services/connectivity_service.dart';

class AppRouter {
  static const String initial = '/';
  static const String login = '/login';
  static const String register = '/register';
  static const String forgotPassword = '/forgot-password';
  static const String selectArea = '/select-area';
  static const String newUserConfirm = '/newuser-confirm';
  static const String emailConfirmation = '/email-confirmation';
  static const String dashboard = '/dashboard';
  static const String exploreCompetencies = '/explore-competencies';
  static const String myBadges = '/my-badges';
  static const String evolucao = '/evolucao';
  static const String profile = '/profile';
  static const String emailSignature = '/email-signature';
  static const String editProfile = '/edit-profile';
  static const String chooseAreas = '/choose-areas';
  static const String termsConditions = '/terms-conditions';
  static const String changePassword = '/change-password';
  static const String characteristics = '/characteristics';
  static const String help = '/help';
  static const String badgeGallery = '/badge-gallery';
  static const String goals = '/goals';
}

GoRouter criarRouter(GlobalKey<NavigatorState> navigatorKey) {
  return GoRouter(
    navigatorKey: navigatorKey,
    initialLocation: AppRouter.initial,
    routes: [
      GoRoute(
        path: AppRouter.initial,
        builder: (context, state) => const AuthLoadingScreen(),
      ),
      GoRoute(
        path: AppRouter.login,
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: AppRouter.register,
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: AppRouter.forgotPassword,
        builder: (context, state) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: AppRouter.selectArea,
        builder: (context, state) => const SelectAreaScreen(),
      ),
      GoRoute(
        path: AppRouter.newUserConfirm,
        builder: (context, state) => const NewUserConfirmScreen(),
      ),
      GoRoute(
        path: AppRouter.emailConfirmation,
        builder: (context, state) {
          final email = state.extra as String? ?? '';
          return EmailConfirmationScreen(email: email);
        },
      ),
      GoRoute(
        path: AppRouter.changePassword,
        builder: (context, state) {
          final isFirstLogin = state.extra as bool? ?? false;
          return ChangePasswordScreen(isFirstLogin: isFirstLogin);
        },
      ),
      GoRoute(
        path: AppRouter.dashboard,
        builder: (context, state) => _buildWithScope(
          AppRouter.dashboard,
          const DashboardScreen(),
        ),
      ),
      GoRoute(
        path: AppRouter.exploreCompetencies,
        builder: (context, state) => _buildWithScope(
          AppRouter.exploreCompetencies,
          const ExploreCompetenciesScreen(),
        ),
      ),
      GoRoute(
        path: AppRouter.myBadges,
        builder: (context, state) => _buildWithScope(
          AppRouter.myBadges,
          const MyBadgesScreen(),
        ),
      ),
      GoRoute(
        path: AppRouter.evolucao,
        builder: (context, state) => _buildWithScope(
          AppRouter.evolucao,
          const EvolucaoScreen(),
        ),
      ),
      GoRoute(
        path: AppRouter.profile,
        builder: (context, state) => _buildWithScope(
          AppRouter.profile,
          const ProfileScreen(),
        ),
      ),
      GoRoute(
        path: AppRouter.emailSignature,
        builder: (context, state) => _buildWithScope(
          AppRouter.emailSignature,
          const EmailSignatureScreen(),
        ),
      ),
      GoRoute(
        path: AppRouter.editProfile,
        builder: (context, state) => _buildWithScope(
          AppRouter.editProfile,
          const EditProfileScreen(),
        ),
      ),
      GoRoute(
        path: AppRouter.chooseAreas,
        builder: (context, state) => _buildWithScope(
          AppRouter.chooseAreas,
          const ChooseAreasScreen(),
        ),
      ),
      GoRoute(
        path: AppRouter.termsConditions,
        builder: (context, state) => const TermsConditionsScreen(),
      ),
      GoRoute(
        path: AppRouter.characteristics,
        builder: (context, state) => _buildWithScope(
          AppRouter.characteristics,
          const CharacteristicsScreen(),
        ),
      ),
      GoRoute(
        path: AppRouter.help,
        builder: (context, state) => const HelpScreen(),
      ),
      GoRoute(
        path: AppRouter.badgeGallery,
        builder: (context, state) => _buildWithScope(
          AppRouter.badgeGallery,
          const BadgeGalleryScreen(),
        ),
      ),
      GoRoute(
        path: AppRouter.goals,
        builder: (context, state) => _buildWithScope(
          AppRouter.goals,
          const GoalsScreen(),
        ),
      ),
    ],
  );
}

Widget _buildWithScope(String route, Widget child) {
  final connectivity = getIt<ConnectivityService>();
  if (!connectivity.isOnline && !ScreenDataScope.isStaticRoute(route)) {
    return NoConnectionWidget(targetRoute: route);
  }
  return ScreenScope(route: route, child: child);
}
