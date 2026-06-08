import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/services/connectivity_service.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../injection_container.dart';

class NoConnectionWidget extends StatefulWidget {
  const NoConnectionWidget({super.key, required this.targetRoute});

  final String targetRoute;

  @override
  State<NoConnectionWidget> createState() => _NoConnectionWidgetState();
}

class _NoConnectionWidgetState extends State<NoConnectionWidget> {
  late final ConnectivityService _connectivity;
  bool _retrying = false;

  @override
  void initState() {
    super.initState();
    _connectivity = getIt<ConnectivityService>();
    _connectivity.addListener(_onConnectivityChanged);
  }

  @override
  void dispose() {
    _connectivity.removeListener(_onConnectivityChanged);
    super.dispose();
  }

  void _onConnectivityChanged() {
    if (_connectivity.isOnline && mounted) {
      context.go(widget.targetRoute);
    }
  }

  Future<void> _retry() async {
    setState(() => _retrying = true);
    await _connectivity.recheckNow();
    if (mounted && _connectivity.isOnline) {
      context.go(widget.targetRoute);
    } else if (mounted) {
      setState(() => _retrying = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: Navigator.of(context).canPop()
            ? IconButton(
                icon: const Icon(Icons.arrow_back_rounded,
                    color: AppColors.onBackground),
                onPressed: () => Navigator.of(context).pop(),
              )
            : null,
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  color: AppColors.primaryContainer.withValues(alpha: 0.3),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.cloud_off_rounded,
                  size: 56,
                  color: AppColors.outline,
                ),
              ),
              const SizedBox(height: 32),
              Text(
                'Sem ligação à internet',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      color: AppColors.onBackground,
                      fontWeight: FontWeight.w600,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              Text(
                'Os dados deste ecrã não estão disponíveis offline.\n'
                'Verifique a sua ligação e tente novamente.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.outline,
                      height: 1.5,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 40),
              SizedBox(
                width: 200,
                height: 48,
                child: ElevatedButton.icon(
                  onPressed: _retrying ? null : _retry,
                  icon: _retrying
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: AppColors.onPrimary,
                          ),
                        )
                      : const Icon(Icons.refresh_rounded),
                  label: Text(_retrying ? 'A verificar...' : 'Tentar novamente'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: AppColors.onPrimary,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
