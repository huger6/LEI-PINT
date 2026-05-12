import 'package:flutter/material.dart';

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

  final List<NotificationItem> _allNotifications = [
    const NotificationItem(
      id: 'n1',
      title: 'Candidatura aprovada',
      message:
          'A candidatura ao badge “Master of CSS” foi aprovada pelo Service Line Leader e está agora disponível para partilha pública no seu perfil.',
      timestamp: 'Há 12 minutos',
      type: NotificationType.approved,
      isRecent: true,
    ),
    const NotificationItem(
      id: 'n2',
      title: 'Candidatura devolvida',
      message:
          'A candidatura ao badge “LLM With Python” foi rejeitada, acompanhada da observação “Faltam evidências para a completação do requisito Nº3”. Tem 14 dias úteis para corrigir a sua candidatura. Bom trabalho!',
      timestamp: 'Há 1 dia',
      type: NotificationType.returned,
      isRecent: true,
    ),
    const NotificationItem(
      id: 'n3',
      title: 'Badge a expirar',
      message:
          'O badge “PHP Expert” expira no dia 31/12/2025 e possui 2 requisitos por completar. Após a expiração dos badges esses requisitos ficam indisponíveis para obtenção.',
      timestamp: 'Há 4 dias',
      type: NotificationType.expiring,
      isRecent: true,
    ),
    const NotificationItem(
      id: 'n4',
      title: 'Candidatura aprovada',
      message:
          'A candidatura ao badge “Master of CSS” foi aprovada pelo Service Line Leader e está agora disponível para partilha pública no seu perfil.',
      timestamp: 'Há 2 dias',
      type: NotificationType.approved,
      isRecent: false,
    ),
    const NotificationItem(
      id: 'n5',
      title: 'Candidatura devolvida',
      message:
          'A candidatura ao badge “LLM With Python” foi rejeitada, acompanhada da observação “Faltam evidências para a completação do requisito Nº3”.',
      timestamp: 'Há 6 dias',
      type: NotificationType.returned,
      isRecent: false,
    ),
  ];

  List<NotificationItem> get _recentNotifications => _allNotifications
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
                NotificationsList(
                  notifications: _recentNotifications,
                  onDismiss: _dismissNotification,
                ),
                NotificationsList(
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
