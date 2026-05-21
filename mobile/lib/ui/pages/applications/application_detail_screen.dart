import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../data/repositories/applications_repo.dart';
import '../../../models/application_summary_model.dart';
import '../../../models/badge_model.dart';
import '../../widgets/applications/application_detail_widgets.dart';

class ApplicationDetailScreen extends StatefulWidget {
  const ApplicationDetailScreen({
    super.key,
    required this.application,
  });

  final ApplicationSummaryModel application;

  @override
  State<ApplicationDetailScreen> createState() =>
      _ApplicationDetailScreenState();
}

class _ApplicationDetailScreenState extends State<ApplicationDetailScreen> {
  late ApplicationSummaryModel _application;
  bool _isRefreshing = false;

  @override
  void initState() {
    super.initState();
    _application = widget.application;
    _refreshApplication();
  }

  Future<void> _refreshApplication() async {
    if (_application.applicationGuid.isEmpty) return;

    setState(() => _isRefreshing = true);

    try {
      final repo = context.read<ApplicationsRepository>();
      final updated = await repo.getApplicationById(
        _application.applicationGuid,
      );
      if (updated != null && mounted) {
        setState(() => _application = updated);
      }
    } catch (_) {
    } finally {
      if (mounted) setState(() => _isRefreshing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final badge = _application.badge ?? BadgeModel.empty(title: 'Badge');
    final stateVisual = _resolveState(_application.applicationState);

    return Scaffold(
      backgroundColor: ApplicationDetailColors.pageBackground,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
              child: Row(
                children: [
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.arrow_back, size: 24),
                  ),
                  const SizedBox(width: 4),
                  const Expanded(
                    child: Text(
                      'Detalhes da candidatura',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: ApplicationDetailColors.primaryText,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  if (_isRefreshing)
                    const Padding(
                      padding: EdgeInsets.only(right: 12),
                      child: SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    ),
                ],
              ),
            ),
            Expanded(
              child: RefreshIndicator(
                onRefresh: _refreshApplication,
                color: ApplicationDetailColors.primaryAction,
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(14, 0, 14, 24),
                  child: Column(
                    children: [
                      ApplicationDetailHeader(
                        badge: badge,
                        stateLabel: stateVisual.label,
                        stateColor: stateVisual.color,
                      ),
                      const SizedBox(height: 14),
                      ApplicationProgressStepper(
                        applicationState: _application.applicationState,
                      ),
                      const SizedBox(height: 14),
                      ApplicationInfoSection(
                        submittedAt: _application.submittedAt,
                        openedAt: _application.openedAt,
                        latestObservation: _application.latestObservation,
                      ),
                      const SizedBox(height: 14),
                      ApplicationBadgeAttributes(badge: badge),
                      if (badge.requirements.isNotEmpty) ...[
                        const SizedBox(height: 14),
                        ApplicationRequirementsList(
                          requirements: badge.requirements,
                          evidences: _application.evidences,
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  _StateVisual _resolveState(String status) {
    final normalized = status.toLowerCase();

    if (normalized.contains('accepted') ||
        normalized.contains('approved') ||
        normalized.contains('aprov')) {
      return const _StateVisual(label: 'Aprovada', color: Color(0xFF59C13E));
    }

    if (normalized.contains('reject') ||
        normalized.contains('rejeit') ||
        normalized.contains('devolv')) {
      return const _StateVisual(label: 'Rejeitada', color: Color(0xFFD94A2A));
    }

    if (normalized.contains('validation') ||
        normalized.contains('valida')) {
      return const _StateVisual(
        label: 'Em validacao',
        color: Color(0xFFC9A625),
      );
    }

    if (normalized.contains('submitted') ||
        normalized.contains('submet')) {
      return const _StateVisual(label: 'Submetida', color: Color(0xFF4E6CA2));
    }

    return const _StateVisual(
      label: 'Em analise',
      color: Color(0xFFC9A625),
    );
  }
}

class _StateVisual {
  const _StateVisual({required this.label, required this.color});
  final String label;
  final Color color;
}
