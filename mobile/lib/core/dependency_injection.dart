import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:get_it/get_it.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../data/local/area_dao.dart';
import '../data/local/lang_dao.dart';
import '../data/local/location_dao.dart';
import '../data/remote/api_client.dart';
import '../data/remote/supabase_storage_service.dart';
import '../data/repositories/area_repo.dart';
import '../data/repositories/applications_repo.dart';
import '../data/repositories/auth_repo.dart';
import '../data/repositories/badge_repo.dart';
import '../data/repositories/lang_repo.dart';
import '../data/repositories/location_repo.dart';
import '../data/repositories/ranking_repo.dart';
import 'database/database_helper.dart';

final GetIt getIt = GetIt.instance;

Future<void> setupDependencies() async {
  if (!dotenv.isInitialized) {
    try {
      await dotenv.load(fileName: 'badges_softinsa/project.env');
    } catch (e, stackTrace) {
      try {
        await dotenv.load(fileName: '.env');
      } catch (_) {
        debugPrint(
          'Environment file not loaded. Continuing with fallback config: $e',
        );
      }
      debugPrintStack(stackTrace: stackTrace);
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

  if (!getIt.isRegistered<Dio>()) {
    getIt.registerSingleton<Dio>(Dio());
  }

  if (!getIt.isRegistered<LocalDatabase>()) {
    getIt.registerSingleton<LocalDatabase>(LocalDatabase.instance);
  }

  if (!getIt.isRegistered<ApiClient>()) {
    getIt.registerLazySingleton<ApiClient>(() => ApiClient(getIt<Dio>()));
  }

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
      () => BadgeRepository(getIt<ApiClient>()),
    );
  }

  if (!getIt.isRegistered<ApplicationsRepository>()) {
    getIt.registerLazySingleton<ApplicationsRepository>(
      () => ApplicationsRepository(getIt<ApiClient>()),
    );
  }

  if (!getIt.isRegistered<RankingRepository>()) {
    getIt.registerLazySingleton<RankingRepository>(
      () => RankingRepository(getIt<ApiClient>()),
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
