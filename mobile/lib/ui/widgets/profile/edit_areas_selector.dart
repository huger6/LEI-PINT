import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';

import '../../../core/sync_manager.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/repositories/area_repo.dart';
import '../../../models/area_model.dart';
import '../../../models/user_model.dart';

class EditAreasSelector extends StatefulWidget {
  const EditAreasSelector({
    super.key,
    required this.initialAreas,
    required this.onAreasChanged,
  });

  final List<UserArea> initialAreas;
  final ValueChanged<List<AreaSelection>> onAreasChanged;

  @override
  State<EditAreasSelector> createState() => _EditAreasSelectorState();
}

class AreaSelection {
  final int areaId;
  final String name;
  final bool isPrimary;

  const AreaSelection({
    required this.areaId,
    required this.name,
    required this.isPrimary,
  });
}

class _EditAreasSelectorState extends State<EditAreasSelector> {
  List<AreaModel> _allAreas = [];
  final List<int> _selectedOrder = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadAreas();
  }

  Future<void> _loadAreas() async {
    try {
      final repo = GetIt.instance<AreaRepository>();
      final areas = await repo.getAvailableAreas();
      if (!mounted) return;

      setState(() {
        _allAreas = areas;
        _selectedOrder.clear();

        final primaryArea = widget.initialAreas
            .where((a) => a.isPrimary)
            .firstOrNull;

        if (primaryArea != null) {
          final match = areas
              .where((a) =>
                  a.slug == primaryArea.slug || a.name == primaryArea.name)
              .firstOrNull;
          if (match != null) _selectedOrder.add(match.id);
        }

        for (final ua in widget.initialAreas) {
          if (ua.isPrimary) continue;
          final match = areas
              .where(
                  (a) => a.slug == ua.slug || a.name == ua.name)
              .firstOrNull;
          if (match != null && !_selectedOrder.contains(match.id)) {
            _selectedOrder.add(match.id);
          }
        }

        _isLoading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _toggleArea(int areaId) {
    setState(() {
      if (_selectedOrder.contains(areaId)) {
        _selectedOrder.remove(areaId);
      } else {
        if (_selectedOrder.length >= 5) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(LanguageScope.of(context).tr('maxFiveAreas')),
              duration: const Duration(seconds: 2),
            ),
          );
          return;
        }
        _selectedOrder.add(areaId);
      }
    });
    _notifyChange();
  }

  void _notifyChange() {
    final selections = _selectedOrder.asMap().entries.map((entry) {
      final area = _allAreas.firstWhere((a) => a.id == entry.value);
      return AreaSelection(
        areaId: area.id,
        name: area.name,
        isPrimary: entry.key == 0,
      );
    }).toList();
    widget.onAreasChanged(selections);
  }

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          tr.tr('areas'),
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: Color(0xFF2A3540),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          tr.tr('areasEditHint'),
          style: const TextStyle(
            fontSize: 12,
            color: Color(0xFF8B96A1),
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 8),
        if (_isLoading)
          const Center(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            ),
          )
        else if (_allAreas.isEmpty)
          Padding(
            padding: const EdgeInsets.all(12),
            child: Text(
              tr.tr('noAreasAvailable'),
              style: const TextStyle(color: Color(0xFF8B96A1)),
            ),
          )
        else
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFDDE3E9)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (_selectedOrder.isNotEmpty) ...[
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: _selectedOrder.asMap().entries.map((entry) {
                      final area =
                          _allAreas.firstWhere((a) => a.id == entry.value);
                      final isMain = entry.key == 0;

                      return Chip(
                        label: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (isMain)
                              const Padding(
                                padding: EdgeInsets.only(right: 4),
                                child: Icon(
                                  Icons.star_rounded,
                                  size: 14,
                                  color: Color(0xFFCFA600),
                                ),
                              ),
                            Text(
                              area.name,
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight:
                                    isMain ? FontWeight.w700 : FontWeight.w500,
                                color: isMain
                                    ? AppColors.primary
                                    : const Color(0xFF2A3540),
                              ),
                            ),
                          ],
                        ),
                        deleteIcon: const Icon(
                          Icons.close_rounded,
                          size: 16,
                        ),
                        onDeleted: () => _toggleArea(area.id),
                        backgroundColor: isMain
                            ? AppColors.primary.withValues(alpha: 0.08)
                            : const Color(0xFFF0F3F6),
                        side: BorderSide(
                          color: isMain
                              ? AppColors.primary.withValues(alpha: 0.3)
                              : const Color(0xFFDDE3E9),
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                        ),
                        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        visualDensity: VisualDensity.compact,
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 10),
                  const Divider(height: 1, color: Color(0xFFEDF0F3)),
                  const SizedBox(height: 10),
                ],
                Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  children: _allAreas.map((area) {
                    final isSelected = _selectedOrder.contains(area.id);

                    return FilterChip(
                      label: Text(
                        area.name,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight:
                              isSelected ? FontWeight.w600 : FontWeight.w500,
                          color: isSelected
                              ? AppColors.primary
                              : const Color(0xFF5B6773),
                        ),
                      ),
                      selected: isSelected,
                      showCheckmark: false,
                      shape: const StadiumBorder(),
                      side: BorderSide(
                        color: isSelected
                            ? AppColors.primary
                            : const Color(0xFFCDD4DB),
                        width: isSelected ? 1.5 : 1.0,
                      ),
                      backgroundColor: Colors.white,
                      selectedColor: AppColors.primary.withValues(alpha: 0.08),
                      onSelected: (_) => _toggleArea(area.id),
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      visualDensity: VisualDensity.compact,
                    );
                  }).toList(),
                ),
              ],
            ),
          ),
        if (_selectedOrder.isEmpty && !_isLoading)
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Text(
              tr.tr('areasMinRequired'),
              style: const TextStyle(
                color: AppColors.error,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
      ],
    );
  }
}
