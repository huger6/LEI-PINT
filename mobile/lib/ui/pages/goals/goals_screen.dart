import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_colors.dart';
import '../../../presentation/state/goals_store.dart';
import '../../widgets/goals/goal_card.dart';

class GoalsScreen extends StatefulWidget {
  const GoalsScreen({super.key});

  @override
  State<GoalsScreen> createState() => _GoalsScreenState();
}

class _GoalsScreenState extends State<GoalsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<GoalsStore>().loadGoals();
    });
  }

  Future<void> _handleDelete(int goalId) async {
    final goalsStore = context.read<GoalsStore>();
    final result = await goalsStore.deleteGoal(goalId);

    if (!mounted) return;

    if (result['success'] == true) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Objetivo removido.'),
          backgroundColor: AppColors.snackBarInfo,
          duration: Duration(seconds: 2),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            result['message']?.toString() ?? 'Erro ao remover objetivo.',
          ),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final goalsStore = context.watch<GoalsStore>();

    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        backgroundColor: Colors.grey[100],
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          onPressed: () => Navigator.pop(context),
          icon: const Icon(
            Icons.arrow_back,
            color: Color(0xFF20252B),
            size: 26,
          ),
        ),
        title: const Text(
          'Os meus objetivos',
          style: TextStyle(
            color: Color(0xFF20252B),
            fontSize: 22,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      body: _buildBody(goalsStore),
    );
  }

  Widget _buildBody(GoalsStore store) {
    if (store.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (store.errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.error_outline_rounded, size: 48, color: Colors.grey[400]),
              const SizedBox(height: 12),
              Text(
                store.errorMessage!,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 15,
                  color: Colors.grey[600],
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 16),
              OutlinedButton(
                onPressed: () => store.loadGoals(),
                child: const Text('Tentar novamente'),
              ),
            ],
          ),
        ),
      );
    }

    if (store.goals.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.flag_outlined, size: 56, color: Colors.grey[400]),
            const SizedBox(height: 12),
            Text(
              'Ainda não tem objetivos atribuídos.',
              style: TextStyle(
                fontSize: 15,
                color: Colors.grey[600],
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      );
    }

    final pending = store.pendingGoals;
    final completed = store.completedGoals;

    return RefreshIndicator(
      onRefresh: () => store.loadGoals(),
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        children: [
          if (pending.isNotEmpty) ...[
            Text(
              'Pendentes (${pending.length})',
              style: const TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w800,
                color: Color(0xFF1E2932),
              ),
            ),
            const SizedBox(height: 10),
            ...pending.map((goal) => GoalCard(
                  goal: goal,
                  isDeleting: store.completingGoalId == goal.goalId,
                  onDelete: () => _handleDelete(goal.goalId),
                )),
          ],
          if (completed.isNotEmpty) ...[
            if (pending.isNotEmpty) const SizedBox(height: 16),
            Text(
              'Concluídos (${completed.length})',
              style: const TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w800,
                color: Color(0xFF1E2932),
              ),
            ),
            const SizedBox(height: 10),
            ...completed.map((goal) => GoalCard(
                  goal: goal,
                )),
          ],
        ],
      ),
    );
  }
}
