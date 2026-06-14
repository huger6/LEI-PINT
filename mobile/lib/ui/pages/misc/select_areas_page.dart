import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../models/area_model.dart';
import '../../../data/repositories/area_repo.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/routes/app_router.dart';
import '../../../injection_container.dart';
import '../../widgets/shared/auth_particle_background.dart';

class SelectAreaScreen extends StatefulWidget {
  final Map<String, dynamic>? registrationData;

  const SelectAreaScreen({super.key, this.registrationData});

  @override
  State<SelectAreaScreen> createState() => _SelectAreaScreenState();
}

class _SelectAreaScreenState extends State<SelectAreaScreen> {
  final List<AreaModel> _allAreas = [];
  final Set<int> _selectedAreaIds = {};
  final List<int> _selectedAreaOrder = [];
  int? _mainAreaId;
  bool _isLoadingAreas = true;
  String? _loadingError;

  bool get _canAdvance => _selectedAreaIds.isNotEmpty && _mainAreaId != null;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadAreas());
  }

  Future<void> _loadAreas() async {
    setState(() {
      _isLoadingAreas = true;
      _loadingError = null;
    });

    try {
      final repo = context.read<AreaRepository>();
      final areas = await repo.getAvailableAreas();
      if (!mounted) {
        return;
      }

      setState(() {
        _allAreas
          ..clear()
          ..addAll(areas);
        _restoreDraftSelection();
        _isLoadingAreas = false;
      });
    } catch (e) {
      if (!mounted) {
        return;
      }

      setState(() {
        _isLoadingAreas = false;
        _loadingError = e.toString();
      });
    }
  }

  void _restoreDraftSelection() {
    final draft = context.read<AuthStore>().draftRegistration;
    if (draft.selectedAreas.isEmpty) {
      return;
    }

    final availableIds = _allAreas.map((area) => area.id).toSet();
    final validDraftIds = draft.selectedAreas
        .map((area) => area.id)
        .where(availableIds.contains)
        .toList();

    if (validDraftIds.isEmpty) {
      return;
    }

    _selectedAreaIds
      ..clear()
      ..addAll(validDraftIds);
    _selectedAreaOrder
      ..clear()
      ..addAll(validDraftIds);

    final draftMainAreaId = draft.mainArea?.id;
    if (draftMainAreaId != null && availableIds.contains(draftMainAreaId)) {
      _mainAreaId = draftMainAreaId;
    } else {
      _mainAreaId = validDraftIds.first;
    }
  }

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    final theme = AppTheme.lightTheme;

    return Theme(
      data: theme,
      child: Scaffold(
        body: Stack(
          fit: StackFit.expand,
          children: [
            const AuthParticleBackground(),
            SafeArea(
              child: Column(
                children: [
                  Container(
                    width: double.infinity,
                    height: MediaQuery.of(context).size.height * 0.22,
                    color: Colors.transparent,
                    child: Center(
                      child: Image.asset(
                        'assets/images/logotipo_softinsa.png',
                        fit: BoxFit.contain,
                        errorBuilder: (context, error, stackTrace) {
                          return Icon(
                            Icons.image_not_supported,
                            size: 64,
                            color: theme.colorScheme.outline,
                          );
                        },
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Text(
                      tr.tr('selectAreasDescription'),
                      textAlign: TextAlign.center,
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: theme.colorScheme.onSurface,
                      ),
                    ),
                  ),
                  Expanded(child: _buildBody(theme, tr)),
                  _buildBottomActions(theme),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBody(ThemeData theme, LanguageController tr) {
    if (_isLoadingAreas) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_loadingError != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                tr.tr('areasLoadFailed').replaceAll('{error}', _loadingError!),
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium,
              ),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: _loadAreas,
                child: Text(tr.tr('tryAgain')),
              ),
            ],
          ),
        ),
      );
    }

    if (_allAreas.isEmpty) {
      return Center(
        child: Text(
          tr.tr('noAreasAvailable'),
          style: theme.textTheme.bodyMedium,
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Wrap(
        spacing: 8.0,
        runSpacing: 4.0,
        alignment: WrapAlignment.center,
        children: _allAreas.map((area) => _buildAreaChip(area, theme)).toList(),
      ),
    );
  }

  Widget _buildBottomActions(ThemeData theme) {
    final withOpacity = AppColors.onSurface.withValues(alpha: 0.05);
    final tr = LanguageScope.of(context);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 24.0),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        boxShadow: [
          BoxShadow(
            color: withOpacity,
            blurRadius: 10,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: Column(
        children: [
          SizedBox(
            width: double.infinity,
            height: 50,
            child: OutlinedButton(
              onPressed: () {
                Navigator.pop(context);
              },
              style: OutlinedButton.styleFrom(
                side: BorderSide(color: theme.colorScheme.primary, width: 1.5),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: Text(
                tr.tr('back'),
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                  color: theme.colorScheme.primary,
                ),
              ),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            height: 50,
            child: FilledButton(
              onPressed: _canAdvance ? _handleAdvance : null,
              child: Text(
                tr.tr('finishRegister'),
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _handleAdvance() {
    final authStore = context.read<AuthStore>();
    final selectedAreas = _selectedAreaOrder
        .map((areaId) => _allAreas.firstWhere((area) => area.id == areaId))
        .toList();

    AreaModel? mainArea;
    if (_mainAreaId != null) {
      for (final area in selectedAreas) {
        if (area.id == _mainAreaId) {
          mainArea = area;
          break;
        }
      }
    }

    authStore.saveSelectedAreas(selectedAreas, mainArea);
    context.push(AppRouter.newUserConfirm);
  }

  Widget _buildAreaChip(AreaModel area, ThemeData theme) {
    final isSelected = _selectedAreaIds.contains(area.id);

    return FilterChip(
      label: Text(
        area.name,
        style: TextStyle(
          fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
          fontSize: 14,
          color: isSelected
              ? theme.colorScheme.primary
              : theme.colorScheme.onSurface,
        ),
      ),
      selected: isSelected,
      showCheckmark: false,
      shape: const StadiumBorder(),
      side: BorderSide(
        color: isSelected
            ? theme.colorScheme.primary
            : theme.colorScheme.outline,
        width: isSelected ? 1.5 : 1.0,
      ),
      backgroundColor: theme.colorScheme.surface,
      selectedColor: theme.colorScheme.primaryContainer,
      onSelected: (selected) {
        setState(() {
          if (selected) {
            if (_selectedAreaIds.length >= 5) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(LanguageScope.of(context).tr('maxFiveAreas')),
                  duration: const Duration(seconds: 2),
                ),
              );
              return;
            }

            _selectedAreaIds.add(area.id);
            _selectedAreaOrder.add(area.id);
            _mainAreaId ??= area.id;
          } else {
            _selectedAreaIds.remove(area.id);
            _selectedAreaOrder.remove(area.id);
            if (_mainAreaId == area.id) {
              _mainAreaId = _selectedAreaOrder.isEmpty
                  ? null
                  : _selectedAreaOrder.first;
            }
          }
        });
      },
    );
  }
}
