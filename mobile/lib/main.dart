import 'dart:async';
import 'dart:ui';

import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart'; // Gerado pelo FlutterFire CLI

import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';

import 'package:go_router/go_router.dart';
import 'core/routes/app_router.dart';
import 'core/services/connectivity_service.dart';
import 'core/theme/app_theme.dart';
import 'data/remote/api_client.dart';
import 'data/remote/supabase_storage_service.dart';
import 'data/repositories/applications_repo.dart';
import 'data/repositories/area_repo.dart';
import 'data/repositories/auth_repo.dart';
import 'data/repositories/badge_repo.dart';
import 'data/repositories/lang_repo.dart';
import 'data/repositories/location_repo.dart';
import 'data/repositories/ranking_repo.dart';
import 'data/repositories/goals_repo.dart';
import 'data/repositories/statistics_repo.dart';
import 'data/local/current_user_dao.dart';
import 'data/local/lang_dao.dart';
import 'data/repositories/notification_repo.dart';
import 'data/repositories/validation_repo.dart';
import 'injection_container.dart';
import 'core/services/fcm_service.dart';
import 'core/services/sync_service.dart';
import 'core/services/translation_service.dart';
import 'ui/widgets/shared/app_icon/app_icon.dart';
import 'ui/widgets/shared/app_icon/app_icon_data.dart';

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

// Created once here. NEVER call criarRouter() inside a build method —
// GoRouter resets the entire navigation stack to "/" on every instantiation,
// which causes an infinite splash-screen loop whenever the language controller
// calls notifyListeners().
final GoRouter _appRouter = criarRouter(navigatorKey);

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  FlutterError.onError = (details) {
    FlutterError.presentError(details);
  };

  PlatformDispatcher.instance.onError = (error, stack) {
    return true;
  };

  // 1. Inicializar Firebase e Firebase Cloud Messaging
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    await FCMService.initialize();
  } catch (_) {}

  try {
    await setupDependencies().timeout(
      const Duration(seconds: 20),
      onTimeout: () {
        throw TimeoutException(
          'setupDependencies exceeded the initialization timeout',
        );
      },
    );
  } catch (e) {
    runApp(ErrorApp(errorMessage: 'Initialization failed: $e'));
    return;
  }

  final missingDependencies = <String>[];
  if (!getIt.isRegistered<ApiClient>()) {
    missingDependencies.add('ApiClient');
  }
  if (!getIt.isRegistered<AuthRepository>()) {
    missingDependencies.add('AuthRepository');
  }
  if (!getIt.isRegistered<LocationRepository>()) {
    missingDependencies.add('LocationRepository');
  }
  if (!getIt.isRegistered<LanguageRepository>()) {
    missingDependencies.add('LanguageRepository');
  }
  if (!getIt.isRegistered<AreaRepository>()) {
    missingDependencies.add('AreaRepository');
  }

  if (missingDependencies.isNotEmpty) {
    runApp(
      ErrorApp(
        errorMessage:
            'Unregistered dependencies: ${missingDependencies.join(', ')}',
      ),
    );
    return;
  }

  final languageController = LanguageController(
    getIt<TranslationService>(),
    getIt<LanguageDao>(),
  );
  await languageController.initialize();

  // Pre-download every supported language model and warm their translation
  // caches in the background, so the user starts the app with all languages
  // ready to use (and fully offline) without blocking the first frame.
  unawaited(languageController.prepareAllLanguages());

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider<ConnectivityService>.value(
          value: getIt<ConnectivityService>(),
        ),
        Provider.value(value: getIt<ApiClient>()),
        Provider.value(value: getIt<AuthRepository>()),
        Provider.value(value: getIt<LocationRepository>()),
        Provider.value(value: getIt<LanguageRepository>()),
        Provider.value(value: getIt<AreaRepository>()),
        Provider.value(value: getIt<BadgeRepository>()),
        Provider.value(value: getIt<ApplicationsRepository>()),
        Provider.value(value: getIt<RankingRepository>()),
        Provider.value(value: getIt<ValidationRepository>()),
        ChangeNotifierProvider<AuthStore>(
          create: (_) => AuthStore(
            getIt<AuthRepository>(),
            getIt<ApiClient>(),
            getIt<CurrentUserDao>(),
            storageService: getIt.isRegistered<SupabaseStorageService>()
                ? getIt<SupabaseStorageService>()
                : null,
          ),
        ),
        ChangeNotifierProvider<BadgeStore>(
          create: (_) =>
              BadgeStore(getIt<BadgeRepository>(), getIt<SyncService>()),
        ),
        ChangeNotifierProvider<ApplicationsStore>(
          create: (_) => ApplicationsStore(getIt<ApplicationsRepository>()),
        ),
        ChangeNotifierProvider<DashboardStore>(
          create: (_) => DashboardStore(
            getIt<BadgeRepository>(),
            getIt<ApplicationsRepository>(),
            getIt<RankingRepository>(),
            getIt<StatisticsRepository>(),
          ),
        ),
        ChangeNotifierProvider<NotificationStore>(
          create: (_) => NotificationStore(
            getIt<NotificationRepository>(),
            getIt<SyncService>(),
          ),
        ),
        ChangeNotifierProvider<GoalsStore>(
          create: (_) =>
              GoalsStore(getIt<GoalsRepository>(), getIt<BadgeRepository>()),
        ),
        ChangeNotifierProvider<LanguageController>.value(
          value: languageController,
        ),
      ],
      child: const MyApp(),
    ),
  );
}

class ErrorApp extends StatelessWidget {
  final String errorMessage;
  const ErrorApp({super.key, required this.errorMessage});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const AppIcon(AppIcons.danger, color: Colors.red, size: 60),
                const SizedBox(height: 16),
                Text(
                  errorMessage,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.grey),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () => main(),
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    final languageController = context.watch<LanguageController>();

    return LanguageScope(
      controller: languageController,
      child: AnimatedBuilder(
        animation: languageController,
        builder: (context, _) {
          return MaterialApp.router(
            title: languageController.tr('appTitle'),
            theme: AppTheme.lightTheme,
            debugShowCheckedModeBanner: false,
            locale: languageController.locale,
            localizationsDelegates: const [
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            supportedLocales: const [Locale('pt'), Locale('en'), Locale('es')],
            routerConfig: _appRouter,
          );
        },
      ),
    );
  }
}
