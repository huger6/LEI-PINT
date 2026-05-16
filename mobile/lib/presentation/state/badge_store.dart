import 'package:flutter/widgets.dart';

import '../../data/repositories/badge_repo.dart';
import '../../models/badge_model.dart';

class BadgeStore extends ChangeNotifier with WidgetsBindingObserver {
  BadgeStore(this._badgeRepository) {
    WidgetsBinding.instance.addObserver(
      this,
    ); // Regista o ouvinte do ciclo de vida
    // Escuta magicamente as atualizações vindas do FCM via Repository
    _badgeRepository.badgeStream.listen((updatedBadges) {
      _badges = updatedBadges;
      notifyListeners(); // Avisa a UI para se reconstruir imediatamente
    });
  }

  final BadgeRepository _badgeRepository;

  final Map<String, BadgeModel> _detailsBySlug = <String, BadgeModel>{};
  List<BadgeModel> _badges = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<BadgeModel> get badges => _badges;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this); // Previne memory leaks
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Mecanismo de Fallback: Sincronização Passiva
    // Se a app voltar a ser aberta e perdeu a notificação de background por falta de rede,
    // recupera os dados neste preciso momento.
    if (state == AppLifecycleState.resumed) {
      // Idealmente, comparar o 'synced_at' local via cache antes de forçar o fetch completo.
      // Para já, fazemos um reload de segurança forçado.
      loadBadges(forceRefresh: true);
    }
  }

  Future<void> loadBadges({bool forceRefresh = false}) async {
    if (_isLoading) {
      return;
    }
    if (!forceRefresh && _badges.isNotEmpty) {
      return;
    }

    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _badges = await _badgeRepository.getBadges();
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<BadgeModel?> getBadgeDetail(BadgeModel badge) async {
    final slug = badge.slug.trim();
    if (slug.isEmpty) {
      return badge;
    }

    final cached = _detailsBySlug[slug];
    if (cached != null) {
      return cached;
    }

    try {
      final detail = await _badgeRepository.getBadgeBySlug(slug);
      if (detail != null) {
        _detailsBySlug[slug] = detail;
        _replaceBadge(detail);
        notifyListeners();
        return detail;
      }
    } catch (_) {}

    return badge;
  }

  List<BadgeModel> similarTo(BadgeModel badge, {int limit = 3}) {
    return _badges
        .where((item) => item.slug != badge.slug && item.title != badge.title)
        .take(limit)
        .toList(growable: false);
  }

  void _replaceBadge(BadgeModel detail) {
    final index = _badges.indexWhere((item) => item.slug == detail.slug);
    if (index < 0) {
      return;
    }

    _badges[index] = detail;
  }
}
