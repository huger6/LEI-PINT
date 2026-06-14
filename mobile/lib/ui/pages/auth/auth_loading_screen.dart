import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/routes/app_router.dart';
import '../../../injection_container.dart';
import '../../widgets/shared/auth_particle_background.dart';

class AuthLoadingScreen extends StatefulWidget {
  const AuthLoadingScreen({super.key});

  @override
  State<AuthLoadingScreen> createState() => _AuthLoadingScreenState();
}

class _AuthLoadingScreenState extends State<AuthLoadingScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _openNextScreen());
  }

  Future<void> _openNextScreen() async {
    await Future.delayed(const Duration(milliseconds: 1450));
    if (!mounted) return;

    final authStore = context.read<AuthStore>();
    final langCtrl = LanguageScope.of(context);

    if (authStore.isAuthenticated) {
      await langCtrl.setLanguageFromId(authStore.currentUser?.preferredLangId);
      if (!mounted) return;
      context.go(AppRouter.dashboard);
      return;
    }

    final restored = await authStore.tryRestoreSession();
    if (!mounted) return;

    if (restored) {
      await langCtrl.setLanguageFromId(authStore.currentUser?.preferredLangId);
      if (!mounted) return;
    }

    final targetRoute = restored ? AppRouter.dashboard : AppRouter.login;
    context.go(targetRoute);
  }

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          const AuthParticleBackground(particleCount: 42),
          SafeArea(
            child: Center(
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 28),
                padding: const EdgeInsets.symmetric(
                  horizontal: 28,
                  vertical: 30,
                ),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.84),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: colorScheme.primary.withValues(alpha: 0.14),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: colorScheme.primary.withValues(alpha: 0.13),
                      blurRadius: 28,
                      offset: const Offset(0, 14),
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Image.asset(
                      'assets/images/logotipo_softinsa.png',
                      width: 94,
                      height: 94,
                    ),
                    const SizedBox(height: 18),
                    Text(
                      tr.tr('appTitle'),
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: colorScheme.onSurface,
                      ),
                    ),
                    const SizedBox(height: 18),
                    SizedBox(
                      width: 30,
                      height: 30,
                      child: CircularProgressIndicator(
                        strokeWidth: 3,
                        color: colorScheme.primary,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      tr.tr('loading'),
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: colorScheme.onSurface.withValues(alpha: 0.72),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
