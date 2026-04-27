import 'package:flutter/material.dart';

import '../../widgets/shared/app_bottom_nav_bar.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key, this.sourceTab = AppTab.home});

  final AppTab sourceTab;

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  final List<_NotificationItem> _allNotifications = [
    const _NotificationItem(
      id: 'n1',
      title: 'Candidatura aprovada',
      message:
          'A candidatura ao badge “Master of CSS” foi aprovada pelo Service Line Leader e está agora disponível para partilha pública no seu perfil.',
      timestamp: 'Há 12 minutos',
      type: _NotificationType.approved,
      isRecent: true,
    ),
    const _NotificationItem(
      id: 'n2',
      title: 'Candidatura devolvida',
      message:
          'A candidatura ao badge “LLM With Python” foi rejeitada, acompanhada da observação “Faltam evidências para a completação do requisito Nº3”. Tem 14 dias úteis para corrigir a sua candidatura. Bom trabalho!',
      timestamp: 'Há 1 dia',
      type: _NotificationType.returned,
      isRecent: true,
    ),
    const _NotificationItem(
      id: 'n3',
      title: 'Badge a expirar',
      message:
          'O badge “PHP Expert” expira no dia 31/12/2025 e possui 2 requisitos por completar. Após a expiração dos badges esses requisitos ficam indisponíveis para obtenção.',
      timestamp: 'Há 4 dias',
      type: _NotificationType.expiring,
      isRecent: true,
    ),
    const _NotificationItem(
      id: 'n4',
      title: 'Candidatura aprovada',
      message:
          'A candidatura ao badge “Master of CSS” foi aprovada pelo Service Line Leader e está agora disponível para partilha pública no seu perfil.',
      timestamp: 'Há 2 dias',
      type: _NotificationType.approved,
      isRecent: false,
    ),
    const _NotificationItem(
      id: 'n5',
      title: 'Candidatura devolvida',
      message:
          'A candidatura ao badge “LLM With Python” foi rejeitada, acompanhada da observação “Faltam evidências para a completação do requisito Nº3”.',
      timestamp: 'Há 6 dias',
      type: _NotificationType.returned,
      isRecent: false,
    ),
  ];

  List<_NotificationItem> get _recentNotifications => _allNotifications
      .where((notification) => notification.isRecent)
      .toList(growable: false);

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _dismissNotification(String id) {
    setState(() {
      _allNotifications.removeWhere((item) => item.id == id);
    });
  }

  @override
  Widget build(BuildContext context) {
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
            child: TabBarView(
              controller: _tabController,
              children: [
                _NotificationsList(
                  notifications: _recentNotifications,
                  onDismiss: _dismissNotification,
                ),
                _NotificationsList(
                  notifications: _allNotifications,
                  onDismiss: _dismissNotification,
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

class _NotificationsList extends StatelessWidget {
  const _NotificationsList({
    required this.notifications,
    required this.onDismiss,
  });

  final List<_NotificationItem> notifications;
  final ValueChanged<String> onDismiss;

  @override
  Widget build(BuildContext context) {
    if (notifications.isEmpty) {
      return const Center(
        child: Text(
          'Sem notificações para apresentar.',
          style: TextStyle(
            color: Color(0xFF5E6A75),
            fontSize: 16,
            fontWeight: FontWeight.w500,
          ),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
      itemCount: notifications.length,
      itemBuilder: (context, index) {
        final notification = notifications[index];
        return _NotificationCard(
          item: notification,
          onClose: () => onDismiss(notification.id),
        );
      },
    );
  }
}

class _NotificationCard extends StatelessWidget {
  const _NotificationCard({required this.item, required this.onClose});

  final _NotificationItem item;
  final VoidCallback onClose;

  Color get _titleColor {
    switch (item.type) {
      case _NotificationType.approved:
        return const Color(0xFF4BB62A);
      case _NotificationType.returned:
        return const Color(0xFFD94827);
      case _NotificationType.expiring:
        return const Color(0xFFC6A12A);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.fromLTRB(14, 12, 10, 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [
          BoxShadow(
            color: Color(0x22000000),
            blurRadius: 8,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  item.title,
                  style: TextStyle(
                    color: _titleColor,
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              IconButton(
                onPressed: onClose,
                icon: const Icon(Icons.close, size: 30),
                color: const Color(0xFF1E2932),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                tooltip: 'Ignorar notificação',
              ),
            ],
          ),
          const SizedBox(height: 2),
          Text(
            item.message,
            style: const TextStyle(
              color: Color(0xFF202A33),
              fontSize: 14,
              height: 1.35,
            ),
          ),
          const SizedBox(height: 6),
          Align(
            alignment: Alignment.bottomRight,
            child: Text(
              item.timestamp,
              style: const TextStyle(
                color: Color(0xFF6E7A86),
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

enum _NotificationType { approved, returned, expiring }

class _NotificationItem {
  const _NotificationItem({
    required this.id,
    required this.title,
    required this.message,
    required this.timestamp,
    required this.type,
    required this.isRecent,
  });

  final String id;
  final String title;
  final String message;
  final String timestamp;
  final _NotificationType type;
  final bool isRecent;
}
