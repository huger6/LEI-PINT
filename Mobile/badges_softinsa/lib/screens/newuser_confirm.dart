import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../widgets/custom_button.dart';

class NewUserConfirmScreen extends StatefulWidget {
  final Map<String, dynamic>? registrationData;

  const NewUserConfirmScreen({super.key, this.registrationData});

  @override
  State<NewUserConfirmScreen> createState() => _NewUserConfirmScreenState();
}

class _NewUserConfirmScreenState extends State<NewUserConfirmScreen> {
  bool _isLoading = false;
  late Map<String, dynamic> _userData;

  @override
  void initState() {
    super.initState();
    _userData = widget.registrationData ?? {};
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Receber dados dos argumentos se não foram recebidos como parâmetro do construtor
    if (_userData.isEmpty) {
      final args =
          ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
      if (args != null) {
        _userData = args;
      }
    }
  }

  void _handleRegister() {
    setState(() => _isLoading = true);

    // Simular chamada ao backend para registar o utilizador
    Future.delayed(const Duration(seconds: 2), () {
      setState(() => _isLoading = false);

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Utilizador ${_userData['username']} registado com sucesso!',
          ),
          backgroundColor: Colors.green,
        ),
      );

      // Navegar de volta para login após sucesso
      Future.delayed(const Duration(seconds: 1), () {
        Navigator.pushNamedAndRemoveUntil(context, '/', (route) => false);
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = AppTheme.lightTheme;
    final selectedAreas = _userData['selectedAreas'] as List<dynamic>? ?? [];
    final phone = (_userData['phone'] ?? '').toString().trim();
    final phonePrefix = (_userData['phonePrefix'] ?? '+351').toString();
    final phoneDisplay = phone.isEmpty
        ? '(não preenchido)'
        : '$phonePrefix $phone';

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('Confirmar Registo'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Título
              Text(
                'Resumo do Registo',
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: theme.colorScheme.onSurface,
                ),
              ),

              const SizedBox(height: 24),

              // Secção de Dados Pessoais
              _buildSectionTitle('Dados Pessoais', theme),
              _buildInfoField('Nome Completo', _userData['name'] ?? '-', theme),
              _buildInfoField('Username', _userData['username'] ?? '-', theme),
              _buildInfoField('Email', _userData['email'] ?? '-', theme),
              _buildInfoField('Telemóvel', phoneDisplay, theme),
              _buildInfoField(
                'Data de Nascimento',
                _userData['birthdate'] ?? '(não preenchida)',
                theme,
              ),
              _buildInfoField(
                'Imagem de Perfil',
                _userData['profileImgUrl'] ?? '(não preenchida)',
                theme,
              ),
              _buildInfoField(
                'Localidade',
                _userData['location'] ?? '(não preenchida)',
                theme,
              ),
              _buildInfoField(
                'Linguagem Preferida',
                _getLanguageName(_userData['preferredLanguage'] ?? '1'),
                theme,
              ),
              _buildInfoField(
                'Sobre mim',
                _userData['bio'] ?? '(não preenchido)',
                theme,
              ),

              const SizedBox(height: 24),

              // Secção de Áreas de Interesse
              _buildSectionTitle('Áreas de Interesse', theme),
              _buildInfoField(
                'Área Principal',
                _userData['mainArea'] ?? '(não definida)',
                theme,
              ),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey.shade300),
                  borderRadius: BorderRadius.circular(8),
                  color: theme.colorScheme.surface,
                ),
                child: Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: selectedAreas.isEmpty
                      ? [
                          Text(
                            'Nenhuma área selecionada',
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: Colors.grey,
                            ),
                          ),
                        ]
                      : List<Widget>.from(
                          selectedAreas.map(
                            (area) => Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: theme.colorScheme.primaryContainer,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: theme.colorScheme.primary,
                                ),
                              ),
                              child: Text(
                                area.toString(),
                                style: TextStyle(
                                  color: theme.colorScheme.primary,
                                  fontWeight: FontWeight.w500,
                                  fontSize: 14,
                                ),
                              ),
                            ),
                          ),
                        ),
                ),
              ),

              const SizedBox(height: 32),

              // Botão Registar
              CustomButton(
                text: 'Registar Utilizador',
                isLoading: _isLoading,
                onPressed: _handleRegister,
              ),

              const SizedBox(height: 16),

              // Botão Voltar
              SizedBox(
                width: double.infinity,
                height: 50,
                child: OutlinedButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Voltar'),
                ),
              ),

              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title, ThemeData theme) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Text(
        title,
        style: theme.textTheme.titleMedium?.copyWith(
          fontWeight: FontWeight.w600,
          color: theme.colorScheme.onSurface,
        ),
      ),
    );
  }

  Widget _buildInfoField(String label, String value, ThemeData theme) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: theme.textTheme.bodySmall?.copyWith(
              color: Colors.grey.shade600,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 4),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey.shade300),
              borderRadius: BorderRadius.circular(8),
              color: Colors.grey.shade50,
            ),
            child: Text(
              value,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurface,
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _getLanguageName(String languageCode) {
    const Map<String, String> languages = {
      '1': 'Português',
      '2': 'English',
      '3': 'Español',
      '4': 'Français',
    };
    return languages[languageCode] ?? 'Português';
  }
}
