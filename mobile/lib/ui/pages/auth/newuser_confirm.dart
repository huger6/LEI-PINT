import 'dart:io';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/routes/app_router.dart';
import '../../../presentation/state/auth_store.dart';
import '../../../presentation/state/language_controller.dart';
import '../../widgets/shared/auth_particle_background.dart';
import '../../widgets/shared/auth_content_card.dart';
import '../../widgets/shared/custom_button.dart';

class NewUserConfirmScreen extends StatefulWidget {
  const NewUserConfirmScreen({
    super.key,
  }); // Já não precisamos receber dados aqui!

  @override
  State<NewUserConfirmScreen> createState() => _NewUserConfirmScreenState();
}

class _NewUserConfirmScreenState extends State<NewUserConfirmScreen> {
  bool _isLoading = false;

  // Foram removidos o initState, o didChangeDependencies e a variável _userData!

  Future<void> _handleRegister() async {
    final tr = LanguageScope.of(context);
    final authStore = context.read<AuthStore>();
    final pendingUsername = authStore.draftRegistration.username ?? '';

    setState(() => _isLoading = true);

    try {
      final success = await authStore.submitRegistration();

      if (!mounted) return;
      setState(() => _isLoading = false);

      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              tr
                  .tr('userRegisteredSuccess')
                  .replaceAll('{username}', pendingUsername),
            ),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 5),
          ),
        );

        Future.delayed(const Duration(seconds: 1), () {
          if (!mounted) return;
          Navigator.pushNamedAndRemoveUntil(
            context,
            AppRouter.login,
            (route) => false,
          );
        });
      } else {
        final errorMessage =
            authStore.lastRegistrationError ??
            tr.tr('registerErrorInvalidData');

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(errorMessage), backgroundColor: Colors.red),
        );
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            tr.tr('unexpectedError').replaceAll('{error}', e.toString()),
          ),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    final theme = AppTheme.lightTheme;

    // 🌟 A MAGIA ACONTECE AQUI: Vamos buscar o rascunho completo ao Provider!
    final draft = context.watch<AuthStore>().draftRegistration;

    final selectedAreas = draft.selectedAreas;
    final phone = (draft.phone ?? '').trim();
    final phoneDisplay = phone.isEmpty ? tr.tr('notFilled') : phone;

    // Como a imagem de perfil no rascunho é um File, verificamos se existe
    final hasImage = draft.profileImage != null;

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
        body: Stack(
          fit: StackFit.expand,
          children: [
            const AuthParticleBackground(),
            SafeArea(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
                child: AuthContentCard(
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

                      // Agora lemos tudo diretamente do 'draft'
                      _buildInfoField(
                        tr.tr('name'),
                        draft.fullName ?? '-',
                        theme,
                      ),
                      _buildInfoField(
                        tr.tr('username'),
                        draft.username ?? '-',
                        theme,
                      ),
                      _buildInfoField(
                        tr.tr('email'),
                        draft.email ?? '-',
                        theme,
                      ),
                      _buildInfoField(tr.tr('phone'), phoneDisplay, theme),
                      _buildInfoField(
                        tr.tr('birthdate'),
                        draft.birthDate ?? tr.tr('notFilledF'),
                        theme,
                      ),
                      _buildProfileImagePreview(
                        tr.tr('profileImage'),
                        hasImage ? draft.profileImage : null,
                        tr.tr('notFilledF'),
                        theme,
                      ),
                      _buildInfoField(
                        tr.tr('location'),
                        draft.location?.name ?? tr.tr('notFilledF'),
                        theme,
                      ),

                      // Assume que o preferredLanguage tem um ID que passamos ao controlador
                      _buildInfoField(
                        tr.tr('preferredLanguageOptional'),
                        _getLanguageName(
                          draft.preferredLanguage?.id.toString() ?? '1',
                        ),
                        theme,
                      ),

                      _buildInfoField(
                        tr.tr('aboutMe'),
                        draft.bio ?? tr.tr('notFilled'),
                        theme,
                      ),
                      const SizedBox(height: 24),
                      _buildSectionTitle(tr.tr('selectedAreas'), theme),

                      // Área principal
                      _buildInfoField(
                        tr.tr('mainArea'),
                        draft.mainArea?.name ?? tr.tr('notDefined'),
                        theme,
                      ),

                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          border: Border.all(
                            color: theme.colorScheme.outline.withValues(
                              alpha: 0.24,
                            ),
                          ),
                          borderRadius: BorderRadius.circular(18),
                          color: theme.colorScheme.surface.withValues(
                            alpha: 0.9,
                          ),
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
                                        color:
                                            theme.colorScheme.primaryContainer,
                                        borderRadius: BorderRadius.circular(18),
                                        border: Border.all(
                                          color: theme.colorScheme.primary,
                                        ),
                                      ),
                                      child: Text(
                                        area.name,
                                      ), // Lemos o 'name' do AreaModel
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
                      const SizedBox(height: 12),
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
              color: theme.colorScheme.onSurface.withValues(alpha: 0.62),
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 4),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              border: Border.all(
                color: theme.colorScheme.outline.withValues(alpha: 0.24),
              ),
              borderRadius: BorderRadius.circular(18),
              color: theme.colorScheme.surface.withValues(alpha: 0.9),
            ),
            child: Text(value),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileImagePreview(
    String label,
    File? imageFile,
    String emptyText,
    ThemeData theme,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurface.withValues(alpha: 0.62),
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 4),
          Container(
            width: double.infinity,
            height: imageFile != null ? 180 : null,
            padding: imageFile != null
                ? EdgeInsets.zero
                : const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              border: Border.all(
                color: theme.colorScheme.outline.withValues(alpha: 0.24),
              ),
              borderRadius: BorderRadius.circular(18),
              color: theme.colorScheme.surface.withValues(alpha: 0.9),
            ),
            clipBehavior: Clip.antiAlias,
            child: imageFile != null
                ? Image.file(
                    imageFile,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) =>
                        Center(child: Text(emptyText)),
                  )
                : Text(emptyText),
          ),
        ],
      ),
    );
  }

  String _getLanguageName(String languageCode) {
    return LanguageController.languageName(languageCode);
  }
}
