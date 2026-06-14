import '../constants/sync_codes.dart';
import '../routes/app_router.dart';

abstract class ScreenDataScope {
  static const _routeSyncCodes = <String, List<int>>{
    AppRouter.dashboard: [
      SyncCodes.userProfile,
      SyncCodes.badges,
      SyncCodes.awardedBadges,
      SyncCodes.applications,
      SyncCodes.points,
      SyncCodes.announcements,
      SyncCodes.notifications,
    ],
    AppRouter.exploreCompetencies: [
      SyncCodes.badges,
      SyncCodes.learningPaths,
      SyncCodes.serviceLines,
      SyncCodes.areas,
      SyncCodes.progressionStages,
    ],
    AppRouter.myBadges: [
      SyncCodes.awardedBadges,
      SyncCodes.badges,
      SyncCodes.applications,
    ],
    AppRouter.evolucao: [
      SyncCodes.points,
      SyncCodes.awardedBadges,
    ],
    AppRouter.profile: [
      SyncCodes.userProfile,
    ],
    AppRouter.editProfile: [
      SyncCodes.userProfile,
    ],
    AppRouter.chooseAreas: [
      SyncCodes.userProfile,
      SyncCodes.areas,
    ],
    AppRouter.emailSignature: [
      SyncCodes.userProfile,
      SyncCodes.awardedBadges,
    ],
    AppRouter.characteristics: [
      SyncCodes.userProfile,
    ],
    AppRouter.badgeGallery: [
      SyncCodes.awardedBadges,
      SyncCodes.badges,
    ],
  };

  static const _syncCodeToTable = <int, String>{
    SyncCodes.userProfile: 'current_user_profile',
    SyncCodes.badges: 'badges_cache',
    SyncCodes.awardedBadges: 'awarded_badges_cache',
    SyncCodes.applications: 'my_applications',
    SyncCodes.points: 'points_history_cache',
    SyncCodes.announcements: 'announcements_cache',
    SyncCodes.learningPaths: 'learning_paths_cache',
    SyncCodes.serviceLines: 'service_lines_cache',
    SyncCodes.areas: 'areas_cache',
    SyncCodes.progressionStages: 'progression_stages_cache',
    SyncCodes.notifications: 'notifications_cache',
  };

  static List<int> requiredSyncCodes(String route) {
    return _routeSyncCodes[route] ?? const [];
  }

  static List<String> requiredTables(String route) {
    final codes = requiredSyncCodes(route);
    return codes
        .map((code) => _syncCodeToTable[code])
        .whereType<String>()
        .toList();
  }

  static bool isStaticRoute(String route) {
    return route == AppRouter.help || route == AppRouter.termsConditions;
  }

  static bool isAuthRoute(String route) {
    return route == AppRouter.initial ||
        route == AppRouter.login ||
        route == AppRouter.register ||
        route == AppRouter.forgotPassword ||
        route == AppRouter.emailConfirmation ||
        route == AppRouter.changePassword ||
        route == AppRouter.newUserConfirm;
  }

  static bool requiresSync(String route) {
    return !isAuthRoute(route) &&
        !isStaticRoute(route) &&
        _routeSyncCodes.containsKey(route);
  }
}
