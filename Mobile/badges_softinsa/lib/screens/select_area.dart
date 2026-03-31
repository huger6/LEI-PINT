import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class SelectAreaScreen extends StatefulWidget {
  final Map<String, dynamic>? registrationData;

  const SelectAreaScreen({super.key, this.registrationData});

  @override
  State<SelectAreaScreen> createState() => _SelectAreaScreenState();
}

class _SelectAreaScreenState extends State<SelectAreaScreen> {
  // Lista de áreas baseada na imagem fornecida
  final List<String> _allAreas = [
    'Desenvolvimento Web',
    'Desenvolvimento Mobile',
    'Engenharia de Software',
    'Ciência de Dados',
    'Inteligência Artificial',
    'Machine Learning',
    'Cibersegurança',
    'Redes',
    'Administração de Sistemas',
    'Cloud Computing',
    'DevOps',
    'Bases de Dados',
    'Big Data',
    'Arquitetura de Software',
    'UX/UI Design',
    'Testes de Software',
    'Automação',
    'Programação',
    'Software Open Source',
    'Blockchain',
    'Internet das Coisas',
    'Realidade Virtual',
    'Realidade Aumentada',
    'Computação Gráfica',
    'Jogos Digitais',
    'Sistemas Embebidos',
    'Robótica',
    'Análise de Sistemas',
    'Suporte Técnico',
    'Gestão de TI',
  ];

  // Set para guardar as áreas selecionadas (inicialmente vazio)
  final Set<String> _selectedAreas = {};

  // Regra de negócio: Mínimo 1 área selecionada para avançar
  bool get _canAdvance => _selectedAreas.isNotEmpty;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Receber dados dos argumentos se não foram recebidos como parâmetro do construtor
    if (widget.registrationData == null) {
      final args =
          ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
      if (args != null) {
        // Os dados foram recebidos; já estão acessíveis via widget.registrationData
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Usamos o ThemeData definido no app_theme.dart
    final theme = AppTheme.lightTheme;

    var withOpacity = Colors.black.withOpacity(0.05);
    return Theme(
      data: theme,
      child: Scaffold(
        // Fundo definido no app_colors.dart (surface: 0xFFFDF7FF)
        backgroundColor: theme.colorScheme.surface,
        body: SafeArea(
          child: Column(
            children: [
              // 1. Imagem do Softinsa (Logo)
              Container(
                width: double.infinity,
                height: MediaQuery.of(context).size.height * 0.22,
                color: theme.colorScheme.surface,
                child: Center(
                  child: Image.asset(
                    'images/logotipo_softinsa.png',
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

              // 2. Título da Página
              Padding(
                padding: const EdgeInsets.all(24.0),
                child: Text(
                  'Para prosseguir, selecione as suas áreas de interesse (até 5)',
                  textAlign: TextAlign.center,
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                    // Cor onsurface definida no app_colors.dart
                    color: theme.colorScheme.onSurface,
                  ),
                ),
              ),

              // 3. Grelha de Chips (Scrollable)
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  child: Wrap(
                    spacing: 8.0, // Espaço horizontal entre chips
                    runSpacing: 4.0, // Espaço vertical entre linhas
                    alignment: WrapAlignment.center,
                    children: _allAreas
                        .map((area) => _buildAreaChip(area, theme))
                        .toList(),
                  ),
                ),
              ),

              // 4. Botão Confirmar (Fixo no fundo)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(
                  horizontal: 16.0,
                  vertical: 24.0,
                ),
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
                child: SizedBox(
                  height: 50,
                  child: FilledButton(
                    // O estilo do FilledButton já usa AppColors.primary no app_theme.dart
                    onPressed: _canAdvance
                        ? () {
                            // Navegar para a página de confirmação com os dados
                            Navigator.pushNamed(
                              context,
                              '/newuser-confirm',
                              arguments: {
                                ...?widget.registrationData,
                                'selectedAreas': _selectedAreas.toList(),
                              },
                            );
                          }
                        : null, // Desativa o botão se nada estiver selecionado
                    child: const Text(
                      'Confirmar Áreas',
                      style: TextStyle(
                        fontFamily:
                            'Inter', // Fonte definida nas instruções anteriores
                        fontWeight: FontWeight.w600,
                        fontSize: 16,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // Widget construtor de cada Chip individual com a lógica de estilo solicitada
  Widget _buildAreaChip(String areaName, ThemeData theme) {
    final isSelected = _selectedAreas.contains(areaName);

    /* Lógica de Cores solicitada:
       - Traçado (Outline) a Primary.
       - Letras (Text) a Primary.
       - Fundo (surface) com a cor destinada no ficheiro.

       No teu ficheiro ColorScheme, a cor destinada a fundos de elementos primários
       é a `primaryContainer`. No entanto, `primary` (Cyan) sobre `primaryContainer`
       (Cyan Claro) tem pouco contraste. Para garantir legibilidade seguindo o Material 3,
       o correto é usar `onPrimaryContainer` para o texto. 

       Vou implementar conforme a tua instrução literal (Traçado e Texto = Primary),
       mas deixo comentado onde alterar para melhor usabilidade.
    */

    // Cores Base do ficheiro app_colors.dart
    final Color colorPrimary = theme.colorScheme.primary; // 0xFF00B8E0
    final Color colorPrimaryContainer =
        theme.colorScheme.primaryContainer; // 0xFFB9EBF6
    final Color colorOutline = theme.colorScheme.outline; // 0xFF70787C
    final Color colorSurface = theme.colorScheme.surface; // 0xFFF5FAFD

    return FilterChip(
      label: Text(
        areaName,
        style: TextStyle(
          fontFamily: 'Inter',
          fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
          fontSize: 14,
          // PEDIDO LITERAL: Texto a Primary quando selecionado.
          // MELHORIA DE UX: Usar `isSelected ? colorOnPrimaryContainer : ...`
          color: isSelected ? colorPrimary : theme.colorScheme.onSurface,
        ),
      ),
      selected: isSelected,
      // Ocultar o ícone de check padrão do Material 3 para igualar a imagem
      showCheckmark: false,
      shape: const StadiumBorder(),
      // Configuração da Borda (Traçado)
      side: BorderSide(
        // PEDIDO LITERAL: Traçado a Primary quando selecionado.
        color: isSelected ? colorPrimary : colorOutline,
        width: isSelected ? 1.5 : 1.0,
      ),
      // Configuração do Fundo
      backgroundColor: colorSurface, // Cor quando não selecionado
      selectedColor:
          colorPrimaryContainer, // Cor destinada no ficheiro para seleção
      // Lógica de Seleção
      onSelected: (bool selected) {
        setState(() {
          if (selected) {
            // Regra de negócio: Permitir selecionar 5 áreas no máximo
            if (_selectedAreas.length < 5) {
              _selectedAreas.add(areaName);
            } else {
              // Feedback opcional ao utilizador
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Pode selecionar no máximo 5 áreas.'),
                  duration: Duration(seconds: 2),
                ),
              );
            }
          } else {
            _selectedAreas.remove(areaName);
          }
        });
      },
    );
  }
}
