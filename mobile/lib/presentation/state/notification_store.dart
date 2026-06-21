import 'dart:async';

import 'package:flutter/foundation.dart';

import '../../core/constants/sync_codes.dart';
import '../../core/services/sync_service.dart';
import '../../data/repositories/notification_repo.dart';
import '../../models/notification_model.dart';

class NotificationStore extends ChangeNotifier {
  NotificationStore(this._repository, this._syncService) {
    _syncSub = _syncService.onSyncComplete.listen((code) {
      if (code == SyncCodes.notifications) _reloadFromLocal();
    });
  }

  final NotificationRepository _repository;
  final SyncService _syncService;
  StreamSubscription<int>? _syncSub;

  List<NotificationModel> _all = [];
  bool _isLoading = false;

  List<NotificationModel> get all => _all;
  List<NotificationModel> get unread =>
      _all.where((n) => !n.isRead).toList();
  bool get isLoading => _isLoading;
  int get unreadCount => _all.where((n) => !n.isRead).length;

  Future<void> loadNotifications() async {
    _isLoading = true;
    notifyListeners();

    try {
      _all = await _repository.getLocal();
      notifyListeners();
    } catch (_) {}

    try {
      await _repository.fetchAndCache();
      _all = await _repository.getLocal();
    } catch (_) {}

    _isLoading = false;
    notifyListeners();
  }

  Future<void> _reloadFromLocal() async {
    try {
      _all = await _repository.getLocal();
      notifyListeners();
    } catch (_) {}
  }

  Future<void> markRead(int id) async {
    await _repository.markRead(id);
    final idx = _all.indexWhere((n) => n.id == id);
    if (idx >= 0) {
      _all[idx] = _all[idx].copyWith(isRead: true);
      notifyListeners();
    }
  }

  void clear() {
    _all = [];
    _isLoading = false;
    notifyListeners();
  }

  Future<void> markAllRead() async {
    await _repository.markAllRead();
    _all = _all.map((n) => n.copyWith(isRead: true)).toList();
    notifyListeners();
  }

  @override
  void dispose() {
    _syncSub?.cancel();
    super.dispose();
  }
}
