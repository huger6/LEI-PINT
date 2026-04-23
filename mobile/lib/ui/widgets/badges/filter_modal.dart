import 'package:flutter/material.dart';

import '../../../core/sync_manager.dart';

void showFilterModal(BuildContext context) {
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
  String areaSelected = 'frontend';
  String levelSelected = 'intermediate';
  String typeSelected = 'normal';
  String dateSelected = 'last_30_days';
  String pointsSelected = '201_500';

  showModalBottomSheet<void>(
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
            required String selectedValue,
            required ValueChanged<String> onSelect,
          }) {
            final isSelected = selectedValue == optionValue;
            return ChoiceChip(
              label: Text(optionLabel),
              selected: isSelected,
              onSelected: (_) => setModalState(() => onSelect(optionValue)),
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
                            onSelect: (value) {
                              sortSelected = value;
                            },
                          ),
                          buildChip(
                            optionValue: 'oldest',
                            optionLabel: tr.tr('sortOldest'),
                            selectedValue: sortSelected,
                            onSelect: (value) {
                              sortSelected = value;
                            },
                          ),
                          buildChip(
                            optionValue: 'points',
                            optionLabel: tr.tr('sortMostPoints'),
                            selectedValue: sortSelected,
                            onSelect: (value) {
                              sortSelected = value;
                            },
                          ),
                        ],
                      ),
                    ],
                  ),
                  const Divider(color: sectionDivider, height: 1),
                  ExpansionTile(
                    title: Text(
                      tr.tr('area'),
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
                            optionValue: 'frontend',
                            optionLabel: tr.tr('areaFrontend'),
                            selectedValue: areaSelected,
                            onSelect: (value) {
                              areaSelected = value;
                            },
                          ),
                          buildChip(
                            optionValue: 'backend',
                            optionLabel: tr.tr('areaBackend'),
                            selectedValue: areaSelected,
                            onSelect: (value) {
                              areaSelected = value;
                            },
                          ),
                          buildChip(
                            optionValue: 'fullstack',
                            optionLabel: tr.tr('areaFullstack'),
                            selectedValue: areaSelected,
                            onSelect: (value) {
                              areaSelected = value;
                            },
                          ),
                          buildChip(
                            optionValue: 'ai',
                            optionLabel: tr.tr('areaAi'),
                            selectedValue: areaSelected,
                            onSelect: (value) {
                              areaSelected = value;
                            },
                          ),
                        ],
                      ),
                    ],
                  ),
                  const Divider(color: sectionDivider, height: 1),
                  ExpansionTile(
                    title: Text(
                      tr.tr('level'),
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
                            optionValue: 'beginner',
                            optionLabel: tr.tr('levelBeginner'),
                            selectedValue: levelSelected,
                            onSelect: (value) {
                              levelSelected = value;
                            },
                          ),
                          buildChip(
                            optionValue: 'intermediate',
                            optionLabel: tr.tr('levelIntermediate'),
                            selectedValue: levelSelected,
                            onSelect: (value) {
                              levelSelected = value;
                            },
                          ),
                          buildChip(
                            optionValue: 'expert',
                            optionLabel: tr.tr('levelExpert'),
                            selectedValue: levelSelected,
                            onSelect: (value) {
                              levelSelected = value;
                            },
                          ),
                        ],
                      ),
                    ],
                  ),
                  const Divider(color: sectionDivider, height: 1),
                  ExpansionTile(
                    title: Text(
                      tr.tr('badgeType'),
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
                            optionValue: 'normal',
                            optionLabel: tr.tr('badgeTypeNormal'),
                            selectedValue: typeSelected,
                            onSelect: (value) {
                              typeSelected = value;
                            },
                          ),
                          buildChip(
                            optionValue: 'special',
                            optionLabel: tr.tr('badgeTypeSpecial'),
                            selectedValue: typeSelected,
                            onSelect: (value) {
                              typeSelected = value;
                            },
                          ),
                        ],
                      ),
                    ],
                  ),
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
                            onSelect: (value) {
                              dateSelected = value;
                            },
                          ),
                          buildChip(
                            optionValue: 'last_30_days',
                            optionLabel: tr.tr('last30Days'),
                            selectedValue: dateSelected,
                            onSelect: (value) {
                              dateSelected = value;
                            },
                          ),
                          buildChip(
                            optionValue: 'this_year',
                            optionLabel: tr.tr('thisYear'),
                            selectedValue: dateSelected,
                            onSelect: (value) {
                              dateSelected = value;
                            },
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
                            onSelect: (value) {
                              pointsSelected = value;
                            },
                          ),
                          buildChip(
                            optionValue: '201_500',
                            optionLabel: '201-500',
                            selectedValue: pointsSelected,
                            onSelect: (value) {
                              pointsSelected = value;
                            },
                          ),
                          buildChip(
                            optionValue: '501_plus',
                            optionLabel: '501+',
                            selectedValue: pointsSelected,
                            onSelect: (value) {
                              pointsSelected = value;
                            },
                          ),
                        ],
                      ),
                    ],
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
