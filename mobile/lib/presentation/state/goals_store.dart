import 'package:flutter/foundation.dart';

import '../../data/repositories/goals_repo.dart';
import '../../models/goal_model.dart';

class GoalsStore extends ChangeNotifier {
  GoalsStore(this._goalsRepository);

  final GoalsRepository _goalsRepository;

  List<GoalModel> _goals = [];
  bool _isLoading = false;
  String? _errorMessage;
  int? _completingGoalId;

  List<GoalModel> get goals => _goals;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  int? get completingGoalId => _completingGoalId;

  List<GoalModel> get pendingGoals =>
      _goals.where((g) => !g.isCompleted).toList(growable: false);

  List<GoalModel> get completedGoals =>
      _goals.where((g) => g.isCompleted).toList(growable: false);

  void clear() {
    _goals = [];
    _isLoading = false;
    _errorMessage = null;
    _completingGoalId = null;
    notifyListeners();
  }

  Future<void> loadGoals() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _goals = await _goalsRepository.getGoals();
    } catch (e) {
      _errorMessage = 'Não foi possível carregar os objetivos.';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>> addBadgeAsGoal({
    required int badgeId,
    required String badgeTitle,
    String description = '',
  }) async {
    final result = await _goalsRepository.createGoal(
      badgeId: badgeId,
      title: badgeTitle,
      description: description,
    );

    if (result['success'] == true) {
      await loadGoals();
    }

    return result;
  }

  Future<Map<String, dynamic>> deleteGoal(int goalId) async {
    _completingGoalId = goalId;
    notifyListeners();

    final result = await _goalsRepository.deleteGoal(goalId);

    if (result['success'] == true) {
      _goals.removeWhere((g) => g.goalId == goalId);
    }

    _completingGoalId = null;
    notifyListeners();
    return result;
  }
}
