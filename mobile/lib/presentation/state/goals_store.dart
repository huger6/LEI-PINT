import 'package:flutter/foundation.dart';

import '../../data/repositories/badge_repo.dart';
import '../../data/repositories/goals_repo.dart';
import '../../models/goal_model.dart';

class GoalsStore extends ChangeNotifier {
  GoalsStore(this._goalsRepository, this._badgeRepository);

  final GoalsRepository _goalsRepository;
  final BadgeRepository _badgeRepository;

  List<GoalModel> _goals = [];
  bool _isLoading = false;
  String? _errorMessage;
  int? _deletingGoalId;
  int? _completingGoalId;

  List<GoalModel> get goals => _goals;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  int? get deletingGoalId => _deletingGoalId;
  int? get completingGoalId => _completingGoalId;

  List<GoalModel> get pendingGoals =>
      _goals.where((g) => !g.isCompleted).toList(growable: false);

  List<GoalModel> get completedGoals =>
      _goals.where((g) => g.isCompleted).toList(growable: false);

  void clear() {
    _goals = [];
    _isLoading = false;
    _errorMessage = null;
    _deletingGoalId = null;
    _completingGoalId = null;
    notifyListeners();
  }

  Future<void> loadGoals() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final goals = await _goalsRepository.getGoals();
      _goals = await _withOwnershipCompletion(goals);
    } catch (e) {
      _errorMessage = 'Não foi possível carregar os objetivos.';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// A goal counts as concluded when the API already marks it so (its badge
  /// application was accepted) or when the consultant owns the linked badge.
  Future<List<GoalModel>> _withOwnershipCompletion(
    List<GoalModel> goals,
  ) async {
    final ownedIds = await _badgeRepository.ownedBadgeIdsLocal();
    if (ownedIds.isEmpty) return goals;

    return goals
        .map((g) =>
            (!g.isCompleted && g.badgeId != null && ownedIds.contains(g.badgeId))
                ? g.copyWith(isCompleted: true)
                : g)
        .toList();
  }

  Future<Map<String, dynamic>> addBadgeAsGoal({
    required int badgeId,
    required String badgeTitle,
    String description = '',
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    final result = await _goalsRepository.createGoal(
      badgeId: badgeId,
      title: badgeTitle,
      description: description,
      startDate: startDate,
      endDate: endDate,
    );

    if (result['success'] == true) {
      await loadGoals();
    }

    return result;
  }

  /// Confirms a goal's conclusion. The conclusion is only accepted when the
  /// consultant actually owns the goal's badge in the API; otherwise the caller
  /// is told the badge has not been earned yet.
  Future<Map<String, dynamic>> completeGoal(GoalModel goal) async {
    final badgeId = goal.badgeId;
    if (badgeId == null) {
      return {'success': false, 'code': 'NO_BADGE'};
    }

    _completingGoalId = goal.goalId;
    notifyListeners();

    try {
      final owned = await _badgeRepository.isBadgeOwned(badgeId);
      if (!owned) {
        return {'success': false, 'code': 'NOT_OWNED'};
      }

      final index = _goals.indexWhere((g) => g.goalId == goal.goalId);
      if (index >= 0) {
        _goals[index] = _goals[index].copyWith(isCompleted: true);
      }
      return {'success': true};
    } catch (e) {
      return {'success': false, 'code': 'COMPLETE_FAILED'};
    } finally {
      _completingGoalId = null;
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>> deleteGoal(int goalId) async {
    _deletingGoalId = goalId;
    notifyListeners();

    final result = await _goalsRepository.deleteGoal(goalId);

    if (result['success'] == true) {
      // Reassign (rather than mutate) so the update works regardless of the
      // backing list's growability and reliably notifies listening widgets.
      _goals = _goals.where((g) => g.goalId != goalId).toList();
    }

    _deletingGoalId = null;
    notifyListeners();
    return result;
  }
}
