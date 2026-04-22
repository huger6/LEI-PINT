import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../../../presentation/state/language_controller.dart';
import '../../widgets/shared/custom_button.dart';

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
    if (_userData.isEmpty) {
      final args =
          ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
      if (args != null) {
        _userData = args;
      }
    }
  }

  void _handleRegister() {
    final tr = LanguageScope.of(context);
    setState(() => _isLoading = true);

    Future.delayed(const Duration(seconds: 2), () {
      if (!mounted) return;

      setState(() => _isLoading = false);

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            tr
                .tr('userRegisteredSuccess')
                .replaceAll(
                  '{username}',
                  (_userData['username'] ?? '').toString(),
                ),
          ),
          backgroundColor: Colors.green,
        ),
      );

      Future.delayed(const Duration(seconds: 1), () {
        if (!mounted) return;
        Navigator.pushNamedAndRemoveUntil(context, '/', (route) => false);
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    final theme = AppTheme.lightTheme;
    final selectedAreas = _userData['selectedAreas'] as List<dynamic>? ?? [];
    final phone = (_userData['phone'] ?? '').toString().trim();
    final phonePrefix = (_userData['phonePrefix'] ?? '+351').toString();
    final phoneDisplay = phone.isEmpty
        ? tr.tr('notFilled')
        : '$phonePrefix $phone';

    return Theme(
      data: theme,
      child: Scaffold(
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => Navigator.pop(context),
          ),
          title: Text(tr.tr('confirmRegister')),
        ),
        body: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  tr.tr('registerSummary'),
                  style: theme.textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: theme.colorScheme.onSurface,
                  ),
                ),
                const SizedBox(height: 24),
                _buildSectionTitle(tr.tr('personalData'), theme),
                _buildInfoField(tr.tr('name'), _userData['name'] ?? '-', theme),
                _buildInfoField(
                  tr.tr('username'),
                  _userData['username'] ?? '-',
                  theme,
                ),
                _buildInfoField(
                  tr.tr('email'),
                  _userData['email'] ?? '-',
                  theme,
                ),
                _buildInfoField(tr.tr('phone'), phoneDisplay, theme),
                _buildInfoField(
                  tr.tr('birthdate'),
                  _userData['birthdate'] ?? tr.tr('notFilledF'),
                  theme,
                ),
                _buildInfoField(
                  tr.tr('profileImage'),
                  _userData['profileImgUrl'] ?? tr.tr('notFilledF'),
                  theme,
                ),
                _buildInfoField(
                  tr.tr('location'),
                  _userData['location'] ?? tr.tr('notFilledF'),
                  theme,
                ),
                _buildInfoField(
                  tr.tr('preferredLanguageOptional'),
                  _getLanguageName(_userData['preferredLanguage'] ?? '1'),
                  theme,
                ),
                _buildInfoField(
                  tr.tr('aboutMe'),
                  _userData['bio'] ?? tr.tr('notFilled'),
                  theme,
                ),
                const SizedBox(height: 24),
                _buildSectionTitle(tr.tr('selectedAreas'), theme),
                _buildInfoField(
                  tr.tr('mainArea'),
                  _userData['mainArea'] ?? tr.tr('notDefined'),
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
                        ? [Text(tr.tr('noneSelectedArea'))]
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
                                child: Text(area.toString()),
                              ),
                            ),
                          ),
                  ),
                ),
                const SizedBox(height: 32),
                CustomButton(
                  text: tr.tr('registerUser'),
                  isLoading: _isLoading,
                  onPressed: _handleRegister,
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context),
                    child: Text(tr.tr('back')),
                  ),
                ),
                const SizedBox(height: 40),
              ],
            ),
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
            child: Text(value),
          ),
        ],
      ),
    );
  }

  String _getLanguageName(String languageCode) {
    return LanguageController.languageName(languageCode);
  }
}
