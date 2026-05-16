import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../injection_container.dart';
import '../../data/repositories/badge_repo.dart';

/// Handler para processar as notificações com a App terminada ou em background.
/// OBRIGATÓRIO: Tem de ser uma função Top-Level e conter a anotação @pragma.
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // No Android, isolates em background requerem inicialização explícita do Firebase
  await Firebase.initializeApp();

  // [Risco de Isolate Resolvido]: Inicializar o getIt no Isolate de Background
  try {
    await setupDependencies();
  } catch (e) {
    debugPrint('Erro ao inicializar dependências em background: $e');
  }

  // Delegamos para a mesma função de barreira
  await FCMService.handleSyncMessage(message, isBackground: true);
}

class FCMService {
  // Constantes definidas. Valida com a API caso o backend utilize nomes diferentes.
  static const String topicName = 'badges_topic';
  static const String syncKey = 'synced_at';

  static Future<void> initialize() async {
    final messaging = FirebaseMessaging.instance;

    // 1. Pedido de permissões (Fundamental no Android 13+ e iOS)
    final settings = await messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      debugPrint('FCM: Permissões de notificação concedidas.');

      // Nota: A subscrição foi movida para o método subscribe() gerido pelo AuthStore
      // para evitar fugas de dados ou background actions sem sessão ativa.

      // 3. Registar o ouvinte para mensagens em Background/Terminated
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

      // 4. Registar o ouvinte para mensagens em Foreground
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint('FCM: Mensagem recebida em foreground.');
        handleSyncMessage(message, isBackground: false);
      });
    } else {
      debugPrint('FCM: Permissões de notificação negadas.');
    }
  }

  /// Subscreve ao tópico. Deve ser chamado estritamente após o Login ser bem-sucedido.
  static Future<void> subscribe() async {
    try {
      await FirebaseMessaging.instance.subscribeToTopic(topicName);
      debugPrint('FCM: Subscrito ao tópico de atualizações.');
    } catch (e) {
      debugPrint('FCM Erro ao subscrever: $e');
    }
  }

  /// Remove a subscrição e limpa tokens. Deve ser chamado no Logout.
  static Future<void> unsubscribe() async {
    try {
      await FirebaseMessaging.instance.unsubscribeFromTopic(topicName);
      await FirebaseMessaging.instance.deleteToken();
      debugPrint('FCM: Tópico removido e token limpo com sucesso.');
    } catch (e) {
      debugPrint('FCM Erro ao fazer unsubscribe: $e');
    }
  }

  /// Barreira de Sincronização: Processa, Compara e Injeta
  static Future<void> handleSyncMessage(
    RemoteMessage message, {
    required bool isBackground,
  }) async {
    try {
      final data = message.data;

      // Ignorar notificações irrelevantes
      if (!data.containsKey(syncKey)) return;

      final String? firebaseSyncDateStr = data[syncKey];
      if (firebaseSyncDateStr == null || firebaseSyncDateStr.isEmpty) return;

      // Converter a data do payload para um DateTime fiável
      final DateTime firebaseSyncDate = DateTime.parse(
        firebaseSyncDateStr,
      ).toUtc();

      // Leitura da data da última sincronização na cache local
      final prefs = getIt<SharedPreferences>();
      final String? localSyncDateStr = prefs.getString('badges_synced_at');

      DateTime? localSyncDate;
      if (localSyncDateStr != null) {
        localSyncDate = DateTime.tryParse(localSyncDateStr)?.toUtc();
      }

      // REGRA DE NEGÓCIO: O Firebase tem dados mais recentes?
      if (localSyncDate == null || firebaseSyncDate.isAfter(localSyncDate)) {
        debugPrint(
          'FCM Barreira Vencida: A sincronizar nova data ($firebaseSyncDate)',
        );

        // O FCMService atua APENAS como gatilho. O Repositório trata do resto.
        final badgeRepo = getIt<BadgeRepository>();
        await badgeRepo.refreshData(); // Fetch API + Local Save + Notify
      } else {
        debugPrint(
          'FCM Barreira Reprovada: Dados locais já estão atualizados.',
        );
      }
    } catch (e) {
      debugPrint('FCM Erro na sincronização: $e');
    }
  }
}
