import 'dart:async';

import 'package:flutter/widgets.dart';

import '../../core/constants/sync_codes.dart';
import '../../core/services/sync_service.dart';
import '../../data/repositories/badge_repo.dart';
import '../../models/badge_model.dart';
import '../../models/earned_badge_model.dart';

class BadgeStore extends ChangeNotifier with WidgetsBindingObserver {
  BadgeStore(this._badgeRepository, this._syncService) {
    WidgetsBinding.instance.addObserver(this);

    _syncSubscription = _syncService.onSyncComplete.listen((code) {
      if (code == SyncCodes.badges) _reloadFromLocal();
      if (code == SyncCodes.awardedBadges) _reloadEarnedFromLocal();
    });
  }

  final BadgeRepository _badgeRepository;
  final SyncService _syncService;
  StreamSubscription<int>? _syncSubscription;

  final Map<String, BadgeModel> _detailsBySlug = <String, BadgeModel>{};
  List<BadgeModel> _badges = [];
  List<EarnedBadge> _earnedBadges = [];
  Set<int> _favoriteBadgeIds = {};
  bool _isLoading = false;
  bool _isLoadingEarned = false;
  String? _errorMessage;

  List<BadgeModel> get badges => _badges;
  List<EarnedBadge> get earnedBadges => _earnedBadges;
  Set<int> get favoriteBadgeIds => _favoriteBadgeIds;
  bool get isLoading => _isLoading;
  bool get isLoadingEarned => _isLoadingEarned;
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
      loadEarnedBadges(forceRefresh: true);
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

  Future<void> _reloadEarnedFromLocal() async {
    final local = await _badgeRepository.getEarnedBadgesLocal();
    _earnedBadges = local;
    notifyListeners();
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

  Future<void> loadEarnedBadges({bool forceRefresh = false}) async {
    if (_isLoadingEarned) {
      return;
    }
    if (!forceRefresh && _earnedBadges.isNotEmpty) {
      return;
    }

    _isLoadingEarned = true;
    notifyListeners();

    try {
      _earnedBadges = await _badgeRepository.getEarnedBadges();
    } catch (_) {
      final local = await _badgeRepository.getEarnedBadgesLocal();
      if (local.isNotEmpty) {
        _earnedBadges = local;
      }
    } finally {
      _isLoadingEarned = false;
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

  Future<void> toggleBadgeGallery(int awardedBadgeId, bool featured) async {
    try {
      await _badgeRepository.toggleBadgeGallery(awardedBadgeId, featured);
      await _reloadEarnedFromLocal();
    } catch (_) {}
  }

  List<BadgeModel> similarTo(BadgeModel badge, {int limit = 3}) {
    return _badges
        .where((item) => item.slug != badge.slug && item.title != badge.title)
        .take(limit)
        .toList(growable: false);
  }

  List<BadgeModel> get savedBadges {
    return _badges
        .where((b) => _favoriteBadgeIds.contains(b.id))
        .toList(growable: false);
  }

  bool isFavorite(int badgeId) => _favoriteBadgeIds.contains(badgeId);

  Future<void> loadFavorites() async {
    final ids = await _badgeRepository.getFavorites();
    _favoriteBadgeIds = ids.toSet();
    notifyListeners();
  }

  Future<void> toggleFavorite(int badgeId) async {
    if (_favoriteBadgeIds.contains(badgeId)) {
      _favoriteBadgeIds.remove(badgeId);
      notifyListeners();
      await _badgeRepository.removeFavorite(badgeId);
    } else {
      _favoriteBadgeIds.add(badgeId);
      notifyListeners();
      await _badgeRepository.addFavorite(badgeId);
    }
  }

  void _replaceBadge(BadgeModel detail) {
    final index = _badges.indexWhere((item) => item.slug == detail.slug);
    if (index < 0) {
      return;
    }

    _badges[index] = detail;
  }
}
