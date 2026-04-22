import 'package:flutter/material.dart';

void showFilterModal(BuildContext context) {
  const Color modalBackground = Color(0xFFF6F7F9);
  const Color handleColor = Color(0xFFD0D5DB);
  const Color sectionDivider = Color(0xFFE5E8EC);
  const Color chipBackground = Color(0xFFEFF2F5);
  const Color chipSelected = Color(0xFFDAEAF7);
  const Color textPrimary = Color(0xFF1D2A35);
  const Color textSecondary = Color(0xFF46535E);
  const Color accent = Color(0xFF5EAEDC);

  String sortSelected = 'Mais recentes';
  String areaSelected = 'Frontend';
  String levelSelected = 'Intermédio';
  String tipoSelected = 'Normal';
  String dataSelected = 'Últimos 30 dias';
  String pontosSelected = '201-500';

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
          Widget buildChip(
            String label,
            String selectedValue,
            ValueChanged<String> onSelect,
          ) {
            final isSelected = selectedValue == label;
            return ChoiceChip(
              label: Text(label),
              selected: isSelected,
              onSelected: (_) => setModalState(() => onSelect(label)),
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
                      const Expanded(
                        child: Center(
                          child: Text(
                            'Filtros e Ordenação',
                            style: TextStyle(
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
                    title: const Text(
                      'Ordenar por',
                      style: TextStyle(
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
                          buildChip('Mais recentes', sortSelected, (value) {
                            sortSelected = value;
                          }),
                          buildChip('Mais antigos', sortSelected, (value) {
                            sortSelected = value;
                          }),
                          buildChip('Mais pontos', sortSelected, (value) {
                            sortSelected = value;
                          }),
                        ],
                      ),
                    ],
                  ),
                  const Divider(color: sectionDivider, height: 1),
                  ExpansionTile(
                    title: Text(
                      'Área',
                      style: TextStyle(
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
                          buildChip('Frontend', areaSelected, (value) {
                            areaSelected = value;
                          }),
                          buildChip('Backend', areaSelected, (value) {
                            areaSelected = value;
                          }),
                          buildChip('Fullstack', areaSelected, (value) {
                            areaSelected = value;
                          }),
                          buildChip('AI', areaSelected, (value) {
                            areaSelected = value;
                          }),
                        ],
                      ),
                    ],
                  ),
                  const Divider(color: sectionDivider, height: 1),
                  ExpansionTile(
                    title: const Text(
                      'Nível',
                      style: TextStyle(
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
                          buildChip('Iniciante', levelSelected, (value) {
                            levelSelected = value;
                          }),
                          buildChip('Intermédio', levelSelected, (value) {
                            levelSelected = value;
                          }),
                          buildChip('Expert', levelSelected, (value) {
                            levelSelected = value;
                          }),
                        ],
                      ),
                    ],
                  ),
                  const Divider(color: sectionDivider, height: 1),
                  ExpansionTile(
                    title: Text(
                      'Tipo de badge',
                      style: TextStyle(
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
                          buildChip('Normal', tipoSelected, (value) {
                            tipoSelected = value;
                          }),
                          buildChip('Especial', tipoSelected, (value) {
                            tipoSelected = value;
                          }),
                        ],
                      ),
                    ],
                  ),
                  const Divider(color: sectionDivider, height: 1),
                  ExpansionTile(
                    title: Text(
                      'Data',
                      style: TextStyle(
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
                          buildChip('Últimos 7 dias', dataSelected, (value) {
                            dataSelected = value;
                          }),
                          buildChip('Últimos 30 dias', dataSelected, (value) {
                            dataSelected = value;
                          }),
                          buildChip('Este ano', dataSelected, (value) {
                            dataSelected = value;
                          }),
                        ],
                      ),
                    ],
                  ),
                  const Divider(color: sectionDivider, height: 1),
                  ExpansionTile(
                    title: Text(
                      'Pontos',
                      style: TextStyle(
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
                          buildChip('0-200', pontosSelected, (value) {
                            pontosSelected = value;
                          }),
                          buildChip('201-500', pontosSelected, (value) {
                            pontosSelected = value;
                          }),
                          buildChip('501+', pontosSelected, (value) {
                            pontosSelected = value;
                          }),
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
