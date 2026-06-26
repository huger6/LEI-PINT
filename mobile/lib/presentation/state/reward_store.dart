import 'dart:async';

import 'package:flutter/widgets.dart';

import '../../core/constants/sync_codes.dart';
import '../../core/services/sync_service.dart';
import '../../data/repositories/reward_repo.dart';
import '../../models/redemption_model.dart';
import '../../models/reward_model.dart';

class RewardStore extends ChangeNotifier {
  RewardStore(this._repository, this._syncService) {
    _syncSubscription = _syncService.onSyncComplete.listen((code) {
      if (code == SyncCodes.rewards || code == SyncCodes.points) {
        _reloadFromLocal();
      }
    });
  }

  final RewardRepository _repository;
  final SyncService _syncService;
  StreamSubscription<int>? _syncSubscription;

  List<RewardModel> _rewards = [];
  List<RedemptionModel> _redemptions = [];
  List<String> _titles = [];
  String? _activeTitle;
  bool _isLoading = false;
  bool _isBusy = false;
  String? _errorMessage;

  List<RewardModel> get rewards => _rewards;
  List<RedemptionModel> get redemptions => _redemptions;
  List<String> get titles => _titles;
  String? get activeTitle => _activeTitle;
  bool get isLoading => _isLoading;
  bool get isBusy => _isBusy;
  String? get errorMessage => _errorMessage;

  @override
  void dispose() {
    _syncSubscription?.cancel();
    super.dispose();
  }

  Future<void> loadAll() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _reloadFromLocal();
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> _reloadFromLocal() async {
    _rewards = await _repository.getRewardsLocal();
    _redemptions = await _repository.getRedemptionsLocal();
    _titles = await _repository.getUnlockedTitlesLocal();
    _activeTitle = await _repository.getActiveTitleLocal();
    notifyListeners();
  }

  Future<Map<String, dynamic>> redeemReward(String rewardGuid) async {
    _isBusy = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final result = await _repository.redeemReward(rewardGuid);
      await _reloadFromLocal();
      return result;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      rethrow;
    } finally {
      _isBusy = false;
      notifyListeners();
    }
  }

  Future<void> setActiveTitle(String? title) async {
    final previous = _activeTitle;
    _activeTitle = title;
    notifyListeners();

    try {
      await _repository.setActiveTitle(title);
    } catch (e) {
      _activeTitle = previous;
      _errorMessage = e.toString();
      notifyListeners();
    }
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
