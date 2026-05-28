import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/constants/notification_defs.dart';
import '../../../data/repositories/applications_repo.dart';
import '../../../models/notification_model.dart';
import '../../../presentation/state/notification_store.dart';
import '../../widgets/shared/app_bottom_nav_bar.dart';
import '../../widgets/notifications/notifications_widgets.dart';
import '../applications/application_detail_screen.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key, this.sourceTab = AppTab.home});

  final AppTab sourceTab;

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  String? _selectedType;
  Set<int> _unreadOnEntry = {};

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final store = context.read<NotificationStore>();
      await store.loadNotifications();
      if (mounted) {
        setState(() {
          _unreadOnEntry = store.unread.map((n) => n.id).toSet();
        });
      }
    });
  }

  @override
  void dispose() {
    _markSeenAsRead();
    _tabController.dispose();
    super.dispose();
  }

  void _markSeenAsRead() {
    if (_unreadOnEntry.isEmpty) return;
    final store = context.read<NotificationStore>();
    for (final id in _unreadOnEntry) {
      store.markRead(id);
    }
  }

  List<NotificationModel> _filterByType(List<NotificationModel> list) {
    if (_selectedType == null) return list;
    return list.where((n) => n.notificationType == _selectedType).toList();
  }

  Future<void> _handleNotificationTap(NotificationModel notification) async {
    final store = context.read<NotificationStore>();
    if (!notification.isRead) {
      store.markRead(notification.id);
    }

    final isBadgeWorkflow = _isBadgeWorkflowNotification(notification);
    final appGuid = _extractApplicationGuid(notification);

    if (isBadgeWorkflow && appGuid != null && appGuid.isNotEmpty) {
      await _navigateToApplication(appGuid);
    }
  }

  bool _isBadgeWorkflowNotification(NotificationModel notification) {
    final id = notification.definitionId;
    return id == NotificationDefs.applicationSubmitted ||
        id == NotificationDefs.approvedByTm ||
        id == NotificationDefs.approvedBySll ||
        id == NotificationDefs.applicationRejected;
  }

  String? _extractApplicationGuid(NotificationModel notification) {
    final url = notification.url;
    if (url == null || url.isEmpty) return null;
    final match = RegExp(r'applications?/([a-zA-Z0-9\-]+)').firstMatch(url);
    return match?.group(1);
  }

  Future<void> _navigateToApplication(String applicationGuid) async {
    try {
      final repo = context.read<ApplicationsRepository>();
      final application = await repo.getApplicationById(applicationGuid);
      if (!mounted || application == null) return;

      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) =>
              ApplicationDetailScreen(application: application),
        ),
      );
    } catch (_) {}
  }

  Set<String> _availableTypes(List<NotificationModel> notifications) {
    return notifications.map((n) => n.notificationType).toSet();
  }

  @override
  Widget build(BuildContext context) {
    final store = context.watch<NotificationStore>();
    final allNotifications = store.all;
    final unreadNotifications = store.unread;
    final types = _availableTypes(allNotifications);

    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        backgroundColor: Colors.grey[100],
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back,
            color: Color(0xFF212D36),
            size: 28,
          ),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'As suas notificações',
          style: TextStyle(
            color: Color(0xFF212D36),
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        actions: [
          if (store.unreadCount > 0)
            TextButton(
              onPressed: () => store.markAllRead(),
              child: const Text(
                'Marcar todas',
                style: TextStyle(
                  color: Color(0xFF5D9FD1),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
        ],
      ),
      body: Column(
        children: [
          if (types.length > 1)
            SizedBox(
              height: 44,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  NotificationTypeChip(
                    label: 'Todas',
                    icon: Icons.notifications_outlined,
                    color: const Color(0xFF5D9FD1),
                    isSelected: _selectedType == null,
                    onTap: () => setState(() => _selectedType = null),
                  ),
                  ...types.map((type) {
                    final display = NotificationDefs.getTypeDisplay(type);
                    return NotificationTypeChip(
                      label: display.label,
                      icon: display.icon,
                      color: display.color,
                      isSelected: _selectedType == type,
                      onTap: () => setState(() {
                        _selectedType = _selectedType == type ? null : type;
                      }),
                    );
                  }),
                ],
              ),
            ),
          const SizedBox(height: 4),
          Container(
            color: Colors.grey[100],
            child: TabBar(
              controller: _tabController,
              tabs: const [
                Tab(text: 'Recentes'),
                Tab(text: 'Todas'),
              ],
              labelColor: const Color(0xFF1E2932),
              unselectedLabelColor: const Color(0xFF1E2932),
              labelStyle: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
              unselectedLabelStyle: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
              indicator: const UnderlineTabIndicator(
                borderSide: BorderSide(color: Color(0xFF62B7E4), width: 4),
                insets: EdgeInsets.symmetric(horizontal: 18),
              ),
              dividerColor: const Color(0xFFE3E8ED),
            ),
          ),
          Expanded(
            child: store.isLoading && allNotifications.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : TabBarView(
                    controller: _tabController,
                    children: [
                      NotificationsList(
                        notifications: _filterByType(unreadNotifications),
                        onDismiss: (id) => store.markRead(id),
                        onTap: _handleNotificationTap,
                      ),
                      NotificationsList(
                        notifications: _filterByType(allNotifications),
                        onDismiss: (id) => store.markRead(id),
                        onTap: _handleNotificationTap,
                      ),
                    ],
                  ),
          ),
        ],
      ),
      bottomNavigationBar: AppBottomNavBar(currentTab: widget.sourceTab),
    );
  }
}
