import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/repositories/area_repo.dart';
import '../../../models/area_model.dart';
import '../../../presentation/state/auth_store.dart';
import '../../../presentation/state/language_controller.dart';
import '../../widgets/profile/choose_areas_widgets.dart';
import '../../widgets/shared/app_icon/app_icon.dart';
import '../../widgets/shared/app_icon/app_icon_data.dart';

/// Lets a consultant choose the areas they belong to (1 to 5, one primary).
///
/// The current selection is pre-filled from the cached profile. The new set is
/// only sent to the API when the user confirms — leaving the screen without
/// confirming keeps the previous areas untouched.
class ChooseAreasScreen extends StatefulWidget {
  const ChooseAreasScreen({super.key});

  @override
  State<ChooseAreasScreen> createState() => _ChooseAreasScreenState();
}

class _ChooseAreasScreenState extends State<ChooseAreasScreen> {
  final List<AreaModel> _allAreas = [];
  final Set<int> _selectedIds = {};
  final List<int> _selectedOrder = [];
  int? _mainAreaId;

  bool _isLoading = true;
  bool _isSaving = false;
  String? _error;

  bool get _canConfirm => _selectedIds.isNotEmpty && _mainAreaId != null;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadAreas());
  }

  Future<void> _loadAreas() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final repo = context.read<AreaRepository>();
      final areas = await repo.getAvailableAreas();
      if (!mounted) return;

      setState(() {
        _allAreas
          ..clear()
          ..addAll(areas);
        _prefillFromUser();
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _error = e.toString();
      });
    }
  }

  /// Pre-selects the areas already stored on the consultant's profile. The
  /// profile only carries the area name/slug, so they are matched back to the
  /// full catalog by slug first, then by name.
  void _prefillFromUser() {
    final user = context.read<AuthStore>().currentUser;
    final userAreas = user?.areas ?? const [];

    for (final userArea in userAreas) {
      AreaModel? match;

      final slug = userArea.slug;
      if (slug != null && slug.isNotEmpty) {
        for (final area in _allAreas) {
          if (area.slug != null && area.slug == slug) {
            match = area;
            break;
          }
        }
      }

      if (match == null) {
        final name = userArea.name.trim().toLowerCase();
        for (final area in _allAreas) {
          if (area.name.trim().toLowerCase() == name) {
            match = area;
            break;
          }
        }
      }

      if (match != null && !_selectedIds.contains(match.id)) {
        _selectedIds.add(match.id);
        _selectedOrder.add(match.id);
        if (userArea.isPrimary) {
          _mainAreaId = match.id;
        }
      }
    }

    _mainAreaId ??= _selectedOrder.isNotEmpty ? _selectedOrder.first : null;
  }

  void _toggleArea(AreaModel area) {
    final tr = LanguageScope.of(context);
    final isSelected = _selectedIds.contains(area.id);

    if (!isSelected && _selectedIds.length >= 5) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(tr.tr('maxFiveAreas')),
          duration: const Duration(seconds: 2),
        ),
      );
      return;
    }

    setState(() {
      if (isSelected) {
        _selectedIds.remove(area.id);
        _selectedOrder.remove(area.id);
        if (_mainAreaId == area.id) {
          _mainAreaId = _selectedOrder.isEmpty ? null : _selectedOrder.first;
        }
      } else {
        _selectedIds.add(area.id);
        _selectedOrder.add(area.id);
        _mainAreaId ??= area.id;
      }
    });
  }

  void _setMainArea(int areaId) {
    setState(() => _mainAreaId = areaId);
  }

  Future<void> _confirm() async {
    final tr = LanguageScope.of(context);
    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);
    final authStore = context.read<AuthStore>();

    final selectedAreas = _selectedOrder
        .map((id) => _allAreas.firstWhere((area) => area.id == id))
        .toList();

    AreaModel? mainArea;
    for (final area in selectedAreas) {
      if (area.id == _mainAreaId) {
        mainArea = area;
        break;
      }
    }

    setState(() => _isSaving = true);
    final result = await authStore.updateMyAreas(selectedAreas, mainArea);
    if (!mounted) return;
    setState(() => _isSaving = false);

    if (result['success'] == true) {
      messenger.showSnackBar(
        SnackBar(
          content: Text(tr.tr('chooseAreasSavedSuccess')),
          backgroundColor: AppColors.success,
        ),
      );
      // Auto-leave the page once the new areas are persisted.
      navigator.pop();
    } else {
      messenger.showSnackBar(
        SnackBar(
          content: Text(
            result['message']?.toString() ?? tr.tr('chooseAreasSaveError'),
          ),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);

    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        backgroundColor: Colors.grey[100],
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          onPressed: () => Navigator.pop(context),
          icon: const AppIcon(AppIcons.chevronBackward, color: Color(0xFF1E2932)),
        ),
        title: Text(
          tr.tr('chooseAreasTitle'),
          style: const TextStyle(
            color: Color(0xFF1E2932),
            fontSize: 22,
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
      body: SafeArea(child: _buildBody(tr)),
    );
  }

  Widget _buildBody(LanguageController tr) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                tr.tr('areasLoadFailed').replaceAll('{error}', _error!),
                textAlign: TextAlign.center,
                style: const TextStyle(color: Color(0xFF5B6773)),
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
          style: const TextStyle(color: Color(0xFF5B6773)),
        ),
      );
    }

    final selectedAreas = _selectedOrder
        .map((id) => _allAreas.firstWhere((area) => area.id == id))
        .toList();

    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SelectedAreasSection(
                  selectedAreas: selectedAreas,
                  mainAreaId: _mainAreaId,
                  onMainSelected: _setMainArea,
                ),
                const SizedBox(height: 16),
                AvailableAreasSection(
                  allAreas: _allAreas,
                  selectedIds: _selectedIds,
                  mainAreaId: _mainAreaId,
                  onToggle: _toggleArea,
                ),
              ],
            ),
          ),
        ),
        Container(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
          decoration: const BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: Color(0x14000000),
                blurRadius: 10,
                offset: Offset(0, -3),
              ),
            ],
          ),
          child: ChooseAreasConfirmButton(
            enabled: _canConfirm,
            loading: _isSaving,
            onPressed: _confirm,
          ),
        ),
      ],
    );
  }
}
