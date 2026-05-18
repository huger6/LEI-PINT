import 'dart:async';

import 'package:flutter/widgets.dart';

import '../../core/constants/sync_codes.dart';
import '../../core/services/sync_service.dart';
import '../../data/repositories/badge_repo.dart';
import '../../models/badge_model.dart';

class BadgeStore extends ChangeNotifier with WidgetsBindingObserver {
  BadgeStore(this._badgeRepository, this._syncService) {
    WidgetsBinding.instance.addObserver(this);

    _syncSubscription = _syncService.onSyncComplete
        .where((code) => code == SyncCodes.badges)
        .listen((_) => _reloadFromLocal());
  }

  final BadgeRepository _badgeRepository;
  final SyncService _syncService;
  StreamSubscription<int>? _syncSubscription;

  final Map<String, BadgeModel> _detailsBySlug = <String, BadgeModel>{};
  List<BadgeModel> _badges = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<BadgeModel> get badges => _badges;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _syncSubscription?.cancel();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      loadBadges(forceRefresh: true);
    }
  }

  Future<void> _reloadFromLocal() async {
    final local = await _badgeRepository.getBadgesLocal();
    if (local.isNotEmpty) {
      _badges = local;
      _errorMessage = null;
      notifyListeners();
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
      final local = await _badgeRepository.getBadgesLocal();
      if (local.isNotEmpty) {
        _badges = local;
      } else {
        _errorMessage = e.toString();
      }
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
