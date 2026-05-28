import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/services/connectivity_service.dart';
import '../../../../core/theme/app_colors.dart';

class OfflineBanner extends StatelessWidget {
  const OfflineBanner({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final isOnline = context.watch<ConnectivityService>().isOnline;

    return Column(
      children: [
        AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          height: isOnline ? 0 : 32,
          color: AppColors.error,
          child: isOnline
              ? const SizedBox.shrink()
              : const Center(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.cloud_off_rounded,
                          size: 14, color: AppColors.onError),
                      SizedBox(width: 8),
                      Text(
                        'Sem ligação à internet',
                        style: TextStyle(
                          color: AppColors.onError,
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
        ),
        Expanded(child: child),
      ],
    );
  }
}
