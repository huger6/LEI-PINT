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

  Future<Map<String, dynamic>> completeGoal(int goalId) async {
    _completingGoalId = goalId;
    notifyListeners();

    final result = await _goalsRepository.completeGoal(goalId);

    if (result['success'] == true) {
      final index = _goals.indexWhere((g) => g.goalId == goalId);
      if (index >= 0) {
        _goals[index] = _goals[index].copyWith(
          isCompleted: true,
          endDate: DateTime.now(),
        );
      }
    }

    _completingGoalId = null;
    notifyListeners();
    return result;
  }
}
