import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../presentation/state/notification_store.dart';
import '../../widgets/shared/app_bottom_nav_bar.dart';
import '../../widgets/notifications/notifications_widgets.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key, this.sourceTab = AppTab.home});

  final AppTab sourceTab;

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NotificationStore>().loadNotifications();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final store = context.watch<NotificationStore>();
    final allNotifications = store.all;
    final unreadNotifications = store.unread;

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
                        notifications: unreadNotifications,
                        onDismiss: (id) => store.markRead(id),
                      ),
                      NotificationsList(
                        notifications: allNotifications,
                        onDismiss: (id) => store.markRead(id),
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
