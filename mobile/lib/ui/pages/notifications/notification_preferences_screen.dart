import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_colors.dart';
import '../../../presentation/state/language_controller.dart';
import '../../../presentation/state/notification_store.dart';
import '../../widgets/notifications/notifications_widgets.dart';
import '../../widgets/shared/app_icon/app_icon.dart';
import '../../widgets/shared/app_icon/app_icon_data.dart';

/// Lets the consultant choose which notifications they receive and through
/// which channels (push / email), per notification type.
class NotificationPreferencesScreen extends StatefulWidget {
  const NotificationPreferencesScreen({super.key});

  @override
  State<NotificationPreferencesScreen> createState() =>
      _NotificationPreferencesScreenState();
}

class _NotificationPreferencesScreenState
    extends State<NotificationPreferencesScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NotificationStore>().loadPreferences();
    });
  }

  Future<void> _onChanged(
    int definitionId, {
    required bool isEnabled,
    required bool sendPush,
    required bool sendEmail,
  }) async {
    final store = context.read<NotificationStore>();
    final ok = await store.updatePreference(
      definitionId,
      isEnabled: isEnabled,
      sendPush: sendPush,
      sendEmail: sendEmail,
    );

    if (!mounted || ok) return;
    final tr = LanguageScope.of(context);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(tr.tr('notificationPreferencesError')),
        backgroundColor: AppColors.error,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    final store = context.watch<NotificationStore>();

    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        backgroundColor: Colors.grey[100],
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const AppIcon(
            AppIcons.chevronBackward,
            color: Color(0xFF1E2932),
            size: 22,
          ),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          tr.tr('notificationPreferences'),
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w800,
            color: Color(0xFF1E2932),
          ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: _buildBody(store, tr),
      ),
    );
  }

  Widget _buildBody(NotificationStore store, LanguageController tr) {
    if (store.isLoadingPreferences && store.preferences.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (store.preferencesError != null && store.preferences.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AppIcon(AppIcons.danger, size: 48, color: Colors.grey[400]),
              const SizedBox(height: 12),
              Text(
                tr.tr('notificationPreferencesError'),
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 15,
                  color: Colors.grey[600],
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 16),
              OutlinedButton(
                onPressed: () => store.loadPreferences(),
                child: Text(tr.tr('tryAgain')),
              ),
            ],
          ),
        ),
      );
    }

    if (store.preferences.isEmpty) {
      return Center(
        child: Text(
          tr.tr('notificationPreferencesEmpty'),
          textAlign: TextAlign.center,
          style: const TextStyle(
            fontSize: 15,
            color: Color(0xFF5B6773),
            fontWeight: FontWeight.w600,
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => store.loadPreferences(),
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        itemCount: store.preferences.length,
        itemBuilder: (context, index) {
          final pref = store.preferences[index];
          return NotificationPreferenceCard(
            preference: pref,
            onChanged: ({
              required bool isEnabled,
              required bool sendPush,
              required bool sendEmail,
            }) =>
                _onChanged(
              pref.definitionId,
              isEnabled: isEnabled,
              sendPush: sendPush,
              sendEmail: sendEmail,
            ),
          );
        },
      ),
    );
  }
}
