import 'dart:async';
import 'dart:io';

import 'package:shared_preferences/shared_preferences.dart';
import '../../injection_container.dart';

import '../../core/constants/api_endpoints.dart';
import '../../models/badge_model.dart';
import '../remote/api_client.dart';

class BadgeRepository {
  BadgeRepository(this._apiClient);

  final ApiClient _apiClient;

  final _badgeStreamController = StreamController<List<BadgeModel>>.broadcast();
  Stream<List<BadgeModel>> get badgeStream => _badgeStreamController.stream;

  Future<List<BadgeModel>> getBadges() async {
    final payload = await _apiClient.get(ApiEndpoints.getBadges);
    final badges = _extractList(payload)
        .whereType<Map>()
        .map(
          (item) => BadgeModel.fromApiSummary(Map<String, dynamic>.from(item)),
        )
        .toList();

    return badges;
  }

  Future<BadgeModel?> getBadgeBySlug(String badgeSlug) async {
    if (badgeSlug.trim().isEmpty) {
      return null;
    }

    final payload = await _apiClient.get(ApiEndpoints.badgeBySlug(badgeSlug));
    final map = _extractMap(payload);
    final data = _extractMap(map['data']);
    if (data.isEmpty) {
      return null;
    }

    return BadgeModel.fromApiDetail(data);
  }

  /// Gatilho acionado pelo FCMService para atualizar dados e notificar a UI.
  Future<void> refreshData() async {
    try {
      // 1. Vai à API buscar os dados atualizados
      final newBadges = await getBadges();

      // 2. Gravar os dados na Base de Dados Local e atualizar o synced_at local.
      final prefs = getIt<SharedPreferences>();
      await prefs.setString(
        'badges_synced_at',
        DateTime.now().toUtc().toIso8601String(),
      );

      // 3. Injeta na Stream para notificar qualquer Store que esteja à escuta (em Foreground)
      _badgeStreamController.add(newBadges);
    } on SocketException catch (_) {
      // Ignorar graciosamente. Falha de rede no background não deve propagar e crashar o Isolate.
    } on TimeoutException catch (_) {
      // Ignorar graciosamente. A API demorou demasiado tempo a responder.
    } catch (e) {
      // Outros erros inesperados são suprimidos no ambiente background.
    }
  }

  List<dynamic> _extractList(dynamic payload) {
    if (payload is List) {
      return payload;
    }

    if (payload is Map<String, dynamic>) {
      final data = payload['data'];
      if (data is List) {
        return data;
      }
    }

    return const [];
  }

  Map<String, dynamic> _extractMap(dynamic payload) {
    if (payload is Map<String, dynamic>) {
      return payload;
    }
    if (payload is Map) {
      return Map<String, dynamic>.from(payload);
    }

    return <String, dynamic>{};
  }
}
