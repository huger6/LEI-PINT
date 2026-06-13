import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:get_it/get_it.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../data/local/area_dao.dart';
import '../data/local/awarded_badge_dao.dart';
import '../data/local/badge_dao.dart';
import '../data/local/current_user_dao.dart';
import '../data/local/gdpr_policy_dao.dart';
import '../data/local/lang_dao.dart';
import '../data/local/translation_cache_dao.dart';
import '../data/local/location_dao.dart';
import '../data/local/my_application_dao.dart';
import '../data/local/my_favorite_dao.dart';
import '../data/local/my_skill_dao.dart';
import '../data/local/notification_dao.dart';
import '../data/remote/api_client.dart';
import '../data/remote/supabase_storage_service.dart';
import '../data/repositories/area_repo.dart';
import '../data/repositories/applications_repo.dart';
import '../data/repositories/auth_repo.dart';
import '../data/repositories/badge_repo.dart';
import '../data/repositories/lang_repo.dart';
import '../data/repositories/location_repo.dart';
import '../data/repositories/ranking_repo.dart';
import '../data/repositories/statistics_repo.dart';
import '../data/repositories/goals_repo.dart';
import '../data/repositories/notification_repo.dart';
import '../data/repositories/validation_repo.dart';
import 'database/database_helper.dart';
import 'services/connectivity_service.dart';
import 'services/sync_service.dart';
import 'services/translation_service.dart';

final GetIt getIt = GetIt.instance;

Future<void> setupDependencies() async {
  if (!dotenv.isInitialized) {
    // Client env files only. Each candidate must also be declared under
    // `flutter > assets` in pubspec.yaml. Never bundle server-secret files.
    const envCandidates = ['.env', 'project.env'];
    var envLoaded = false;
    for (final fileName in envCandidates) {
      try {
        await dotenv.load(fileName: fileName);
        envLoaded = true;
        break;
      } catch (_) {
        // Try the next candidate.
      }
    }
    if (!envLoaded) {
      debugPrint(
        'No environment file loaded (expected .env). '
        'Continuing with fallback config.',
      );
    }
  }

  final supabaseUrl =
      (dotenv.env['SUPABASE_URL'] ?? dotenv.env['SUPABASE_STORAGE_URL'])
          ?.trim() ??
      '';
  final supabaseAnonKey =
      (dotenv.env['SUPABASE_ANON_KEY'] ??
              dotenv.env['SUPABASE_STORAGE_API_KEY'])
          ?.trim() ??
      '';

  var hasSupabaseClient = false;
  try {
    Supabase.instance.client;
    hasSupabaseClient = true;
  } catch (_) {
    hasSupabaseClient = false;
  }

  if (!hasSupabaseClient) {
    if (supabaseUrl.isNotEmpty && supabaseAnonKey.isNotEmpty) {
      try {
        await Supabase.initialize(url: supabaseUrl, anonKey: supabaseAnonKey);
        hasSupabaseClient = true;
      } catch (e, stackTrace) {
        debugPrint('Supabase initialization failed: $e');
        debugPrintStack(stackTrace: stackTrace);
      }
    } else {
      debugPrint(
        'Supabase credentials missing in environment. Skipping Supabase initialization.',
      );
    }
  }

  if (hasSupabaseClient && !getIt.isRegistered<SupabaseClient>()) {
    getIt.registerSingleton<SupabaseClient>(Supabase.instance.client);
  }

  if (hasSupabaseClient && !getIt.isRegistered<SupabaseStorageService>()) {
    getIt.registerLazySingleton<SupabaseStorageService>(
      () => SupabaseStorageService(getIt<SupabaseClient>()),
    );
  }

  if (!getIt.isRegistered<ConnectivityService>()) {
    getIt.registerSingleton<ConnectivityService>(ConnectivityService());
  }

  if (!getIt.isRegistered<Dio>()) {
    getIt.registerSingleton<Dio>(Dio());
  }

  if (!getIt.isRegistered<LocalDatabase>()) {
    getIt.registerSingleton<LocalDatabase>(LocalDatabase.instance);
  }

  if (!getIt.isRegistered<ApiClient>()) {
    getIt.registerLazySingleton<ApiClient>(() => ApiClient(getIt<Dio>()));
  }

  // ── DAOs ──────────────────────────────────────────────────────────────────

  if (!getIt.isRegistered<AreaDao>()) {
    getIt.registerLazySingleton<AreaDao>(() => AreaDao(getIt<LocalDatabase>()));
  }

  if (!getIt.isRegistered<LanguageDao>()) {
    getIt.registerLazySingleton<LanguageDao>(
      () => LanguageDao(getIt<LocalDatabase>()),
    );
  }

  if (!getIt.isRegistered<LocationDao>()) {
    getIt.registerLazySingleton<LocationDao>(
      () => LocationDao(getIt<LocalDatabase>()),
    );
  }

  if (!getIt.isRegistered<BadgeDao>()) {
    getIt.registerLazySingleton<BadgeDao>(
      () => BadgeDao(getIt<LocalDatabase>()),
    );
  }

  if (!getIt.isRegistered<AwardedBadgeDao>()) {
    getIt.registerLazySingleton<AwardedBadgeDao>(
      () => AwardedBadgeDao(getIt<LocalDatabase>()),
    );
  }

  if (!getIt.isRegistered<CurrentUserDao>()) {
    getIt.registerLazySingleton<CurrentUserDao>(
      () => CurrentUserDao(getIt<LocalDatabase>()),
    );
  }

  if (!getIt.isRegistered<NotificationDao>()) {
    getIt.registerLazySingleton<NotificationDao>(
      () => NotificationDao(getIt<LocalDatabase>()),
    );
  }

  if (!getIt.isRegistered<MyApplicationDao>()) {
    getIt.registerLazySingleton<MyApplicationDao>(
      () => MyApplicationDao(getIt<LocalDatabase>()),
    );
  }

  if (!getIt.isRegistered<MyFavoriteDao>()) {
    getIt.registerLazySingleton<MyFavoriteDao>(
      () => MyFavoriteDao(getIt<LocalDatabase>()),
    );
  }

  if (!getIt.isRegistered<MySkillDao>()) {
    getIt.registerLazySingleton<MySkillDao>(
      () => MySkillDao(getIt<LocalDatabase>()),
    );
  }

  if (!getIt.isRegistered<TranslationCacheDao>()) {
    getIt.registerLazySingleton<TranslationCacheDao>(
      () => TranslationCacheDao(getIt<LocalDatabase>()),
    );
  }

  if (!getIt.isRegistered<GdprPolicyDao>()) {
    getIt.registerLazySingleton<GdprPolicyDao>(
      () => GdprPolicyDao(getIt<LocalDatabase>()),
    );
  }

  // ── Services ──────────────────────────────────────────────────────────────

  if (!getIt.isRegistered<TranslationService>()) {
    getIt.registerLazySingleton<TranslationService>(
      () => TranslationService(getIt<TranslationCacheDao>()),
    );
  }

  // ── Repositories ──────────────────────────────────────────────────────────

  if (!getIt.isRegistered<AuthRepository>()) {
    getIt.registerLazySingleton<AuthRepository>(
      () => AuthRepository(getIt<ApiClient>()),
    );
  }

  if (!getIt.isRegistered<LocationRepository>()) {
    getIt.registerLazySingleton<LocationRepository>(
      () => LocationRepository(getIt<ApiClient>(), getIt<LocationDao>()),
    );
  }

  if (!getIt.isRegistered<LanguageRepository>()) {
    getIt.registerLazySingleton<LanguageRepository>(
      () => LanguageRepository(getIt<ApiClient>(), getIt<LanguageDao>()),
    );
  }

  if (!getIt.isRegistered<AreaRepository>()) {
    getIt.registerLazySingleton<AreaRepository>(
      () => AreaRepository(getIt<ApiClient>(), getIt<AreaDao>()),
    );
  }

  if (!getIt.isRegistered<BadgeRepository>()) {
    getIt.registerLazySingleton<BadgeRepository>(
      () => BadgeRepository(
        getIt<ApiClient>(),
        getIt<BadgeDao>(),
        getIt<AwardedBadgeDao>(),
        getIt<MyFavoriteDao>(),
      ),
    );
  }

  if (!getIt.isRegistered<ApplicationsRepository>()) {
    getIt.registerLazySingleton<ApplicationsRepository>(
      () => ApplicationsRepository(
        getIt<ApiClient>(),
        getIt<MyApplicationDao>(),
        getIt<BadgeDao>(),
      ),
    );
  }

  if (!getIt.isRegistered<RankingRepository>()) {
    getIt.registerLazySingleton<RankingRepository>(
      () => RankingRepository(getIt<ApiClient>()),
    );
  }

  if (!getIt.isRegistered<ValidationRepository>()) {
    getIt.registerLazySingleton<ValidationRepository>(
      () => ValidationRepository(getIt<ApiClient>()),
    );
  }

  if (!getIt.isRegistered<StatisticsRepository>()) {
    getIt.registerLazySingleton<StatisticsRepository>(
      () => StatisticsRepository(getIt<ApiClient>()),
    );
  }

  if (!getIt.isRegistered<GoalsRepository>()) {
    getIt.registerLazySingleton<GoalsRepository>(
      () => GoalsRepository(getIt<ApiClient>()),
    );
  }

  if (!getIt.isRegistered<NotificationRepository>()) {
    getIt.registerLazySingleton<NotificationRepository>(
      () => NotificationRepository(getIt<ApiClient>(), getIt<NotificationDao>()),
    );
  }

  // ── SyncService ───────────────────────────────────────────────────────────

  if (!getIt.isRegistered<SyncService>()) {
    getIt.registerLazySingleton<SyncService>(
      () => SyncService(getIt<ApiClient>(), getIt<LocalDatabase>()),
    );
  }

  try {
    await getIt<ApiClient>().init();
  } catch (e, stackTrace) {
    debugPrint(
      'ApiClient init failed. App will continue without persisted cookies: $e',
    );
    debugPrintStack(stackTrace: stackTrace);
  }
}
