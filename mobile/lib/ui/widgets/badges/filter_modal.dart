import 'package:flutter/material.dart';

import '../../../core/sync_manager.dart';

class BadgeFilterResult {
  const BadgeFilterResult({
    this.sort = 'recent',
    this.area,
    this.level,
    this.date,
    this.minPoints,
    this.maxPoints,
  });

  final String sort;
  final String? area;
  final String? level;
  final String? date;
  final int? minPoints;
  final int? maxPoints;

  static const empty = BadgeFilterResult();
}

Future<BadgeFilterResult?> showFilterModal(
  BuildContext context, {
  List<String> areas = const [],
  List<String> levels = const [],
}) {
  final tr = LanguageScope.of(context);
  const Color modalBackground = Color(0xFFF6F7F9);
  const Color handleColor = Color(0xFFD0D5DB);
  const Color sectionDivider = Color(0xFFE5E8EC);
  const Color chipBackground = Color(0xFFEFF2F5);
  const Color chipSelected = Color(0xFFDAEAF7);
  const Color textPrimary = Color(0xFF1D2A35);
  const Color textSecondary = Color(0xFF46535E);
  const Color accent = Color(0xFF5EAEDC);

  String sortSelected = 'recent';
  String? areaSelected;
  String? levelSelected;
  String? dateSelected;
  String? pointsSelected;

  return showModalBottomSheet<BadgeFilterResult>(
    context: context,
    isScrollControlled: true,
    backgroundColor: modalBackground,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20.0)),
    ),
    builder: (context) {
      return StatefulBuilder(
        builder: (context, setModalState) {
          Widget buildChip({
            required String optionValue,
            required String optionLabel,
            required String? selectedValue,
            required ValueChanged<String?> onSelect,
          }) {
            final isSelected = selectedValue == optionValue;
            return ChoiceChip(
              label: Text(optionLabel),
              selected: isSelected,
              onSelected: (_) => setModalState(() {
                onSelect(isSelected ? null : optionValue);
              }),
              showCheckmark: false,
              selectedColor: chipSelected,
              backgroundColor: chipBackground,
              side: BorderSide(
                color: isSelected ? accent : const Color(0xFFD7DDE4),
              ),
              labelStyle: TextStyle(
                color: isSelected ? accent : textSecondary,
                fontWeight: FontWeight.w600,
              ),
            );
          }

          return SafeArea(
            top: false,
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 46,
                      height: 5,
                      decoration: BoxDecoration(
                        color: handleColor,
                        borderRadius: BorderRadius.circular(20),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: Center(
                          child: Text(
                            tr.tr('filtersAndSorting'),
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w700,
                              color: textPrimary,
                            ),
                          ),
                        ),
                      ),
                      IconButton(
                        onPressed: () => Navigator.pop(context),
                        icon: const Icon(Icons.close_rounded),
                        color: textSecondary,
                      ),
                    ],
                  ),
                  const Divider(color: sectionDivider, height: 14),
                  ExpansionTile(
                    title: Text(
                      tr.tr('sortBy'),
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        color: textPrimary,
                      ),
                    ),
                    childrenPadding: const EdgeInsets.fromLTRB(6, 0, 6, 10),
                    children: [
                      Wrap(
                        spacing: 8.0,
                        runSpacing: 8.0,
                        children: [
                          buildChip(
                            optionValue: 'recent',
                            optionLabel: tr.tr('sortMostRecent'),
                            selectedValue: sortSelected,
                            onSelect: (v) => sortSelected = v ?? 'recent',
                          ),
                          buildChip(
                            optionValue: 'oldest',
                            optionLabel: tr.tr('sortOldest'),
                            selectedValue: sortSelected,
                            onSelect: (v) => sortSelected = v ?? 'recent',
                          ),
                          buildChip(
                            optionValue: 'points',
                            optionLabel: tr.tr('sortMostPoints'),
                            selectedValue: sortSelected,
                            onSelect: (v) => sortSelected = v ?? 'recent',
                          ),
                        ],
                      ),
                    ],
                  ),
                  if (areas.isNotEmpty) ...[
                    const Divider(color: sectionDivider, height: 1),
                    ExpansionTile(
                      title: Text(
                        tr.tr('area'),
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          color: textPrimary,
                        ),
                      ),
                      childrenPadding:
                          const EdgeInsets.fromLTRB(6, 0, 6, 10),
                      children: [
                        Wrap(
                          spacing: 8.0,
                          runSpacing: 8.0,
                          children: areas
                              .map(
                                (area) => buildChip(
                                  optionValue: area,
                                  optionLabel: area,
                                  selectedValue: areaSelected,
                                  onSelect: (v) => areaSelected = v,
                                ),
                              )
                              .toList(),
                        ),
                      ],
                    ),
                  ],
                  if (levels.isNotEmpty) ...[
                    const Divider(color: sectionDivider, height: 1),
                    ExpansionTile(
                      title: Text(
                        tr.tr('level'),
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          color: textPrimary,
                        ),
                      ),
                      childrenPadding:
                          const EdgeInsets.fromLTRB(6, 0, 6, 10),
                      children: [
                        Wrap(
                          spacing: 8.0,
                          runSpacing: 8.0,
                          children: levels
                              .map(
                                (level) => buildChip(
                                  optionValue: level,
                                  optionLabel: level,
                                  selectedValue: levelSelected,
                                  onSelect: (v) => levelSelected = v,
                                ),
                              )
                              .toList(),
                        ),
                      ],
                    ),
                  ],
                  const Divider(color: sectionDivider, height: 1),
                  ExpansionTile(
                    title: Text(
                      tr.tr('date'),
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        color: textPrimary,
                      ),
                    ),
                    childrenPadding: const EdgeInsets.fromLTRB(6, 0, 6, 10),
                    children: [
                      Wrap(
                        spacing: 8.0,
                        runSpacing: 8.0,
                        children: [
                          buildChip(
                            optionValue: 'last_7_days',
                            optionLabel: tr.tr('last7Days'),
                            selectedValue: dateSelected,
                            onSelect: (v) => dateSelected = v,
                          ),
                          buildChip(
                            optionValue: 'last_30_days',
                            optionLabel: tr.tr('last30Days'),
                            selectedValue: dateSelected,
                            onSelect: (v) => dateSelected = v,
                          ),
                          buildChip(
                            optionValue: 'this_year',
                            optionLabel: tr.tr('thisYear'),
                            selectedValue: dateSelected,
                            onSelect: (v) => dateSelected = v,
                          ),
                        ],
                      ),
                    ],
                  ),
                  const Divider(color: sectionDivider, height: 1),
                  ExpansionTile(
                    title: Text(
                      tr.tr('points'),
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        color: textPrimary,
                      ),
                    ),
                    childrenPadding: const EdgeInsets.fromLTRB(6, 0, 6, 10),
                    children: [
                      Wrap(
                        spacing: 8.0,
                        runSpacing: 8.0,
                        children: [
                          buildChip(
                            optionValue: '0_200',
                            optionLabel: '0-200',
                            selectedValue: pointsSelected,
                            onSelect: (v) => pointsSelected = v,
                          ),
                          buildChip(
                            optionValue: '201_500',
                            optionLabel: '201-500',
                            selectedValue: pointsSelected,
                            onSelect: (v) => pointsSelected = v,
                          ),
                          buildChip(
                            optionValue: '501_plus',
                            optionLabel: '501+',
                            selectedValue: pointsSelected,
                            onSelect: (v) => pointsSelected = v,
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: () {
                        int? minPts;
                        int? maxPts;
                        if (pointsSelected == '0_200') {
                          minPts = 0;
                          maxPts = 200;
                        } else if (pointsSelected == '201_500') {
                          minPts = 201;
                          maxPts = 500;
                        } else if (pointsSelected == '501_plus') {
                          minPts = 501;
                        }

                        Navigator.pop(
                          context,
                          BadgeFilterResult(
                            sort: sortSelected,
                            area: areaSelected,
                            level: levelSelected,
                            date: dateSelected,
                            minPoints: minPts,
                            maxPoints: maxPts,
                          ),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: accent,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                        elevation: 0,
                      ),
                      child: Text(
                        tr.tr('applyFilters'),
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      );
    },
  );
}
