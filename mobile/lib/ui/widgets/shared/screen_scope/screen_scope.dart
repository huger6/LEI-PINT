import 'package:flutter/material.dart';

import '../../../../core/services/connectivity_service.dart';
import '../../../../core/services/sync_service.dart';
import '../../../../injection_container.dart';

class ScreenScope extends StatefulWidget {
  const ScreenScope({
    super.key,
    required this.route,
    required this.child,
  });

  final String route;
  final Widget child;

  @override
  State<ScreenScope> createState() => _ScreenScopeState();
}

class _ScreenScopeState extends State<ScreenScope> {
  @override
  void initState() {
    super.initState();
    final syncService = getIt<SyncService>();
    syncService.setActiveRoute(widget.route);
    _syncInBackground();
  }

  Future<void> _syncInBackground() async {
    final connectivity = getIt<ConnectivityService>();
    if (!connectivity.isOnline) return;

    try {
      await getIt<SyncService>().syncForScreen(widget.route);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
