import 'dart:async';

import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/repositories/validation_repo.dart';
import '../../../presentation/state/auth_store.dart';

class EditProfileForm extends StatefulWidget {
  const EditProfileForm({
    super.key,
    required this.initialUsername,
    required this.initialFullName,
    required this.initialBiography,
  });

  final String initialUsername;
  final String initialFullName;
  final String initialBiography;

  @override
  State<EditProfileForm> createState() => _EditProfileFormState();
}

class _EditProfileFormState extends State<EditProfileForm> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _usernameCtrl;
  late final TextEditingController _fullNameCtrl;
  late final TextEditingController _bioCtrl;

  bool _isLoading = false;
  String? _usernameError;
  String? _fullNameError;
  Timer? _usernameDebounce;

  @override
  void initState() {
    super.initState();
    _usernameCtrl = TextEditingController(text: widget.initialUsername);
    _fullNameCtrl = TextEditingController(text: widget.initialFullName);
    _bioCtrl = TextEditingController(text: widget.initialBiography);
  }

  @override
  void dispose() {
    _usernameDebounce?.cancel();
    _usernameCtrl.dispose();
    _fullNameCtrl.dispose();
    _bioCtrl.dispose();
    super.dispose();
  }

  void _onUsernameChanged(String value) {
    _usernameDebounce?.cancel();
    if (value.trim() == widget.initialUsername) {
      setState(() => _usernameError = null);
      return;
    }
    _usernameDebounce = Timer(const Duration(milliseconds: 500), () async {
      if (value.trim().length < 3) {
        setState(() => _usernameError = 'Mínimo de 3 caracteres.');
        return;
      }
      final repo = GetIt.instance<ValidationRepository>();
      final result = await repo.checkUsernameAvailability(value.trim());
      if (!mounted) return;
      if (result['available'] == true) {
        setState(() => _usernameError = null);
      } else {
        setState(
          () => _usernameError =
              result['message']?.toString() ?? 'Username indisponível.',
        );
      }
    });
  }

  Future<void> _submit() async {
    if (_usernameError != null) return;

    final username = _usernameCtrl.text.trim();
    final fullName = _fullNameCtrl.text.trim();
    final bio = _bioCtrl.text.trim();

    if (fullName.isEmpty) {
      setState(() => _fullNameError = 'O nome é obrigatório.');
      return;
    } else {
      setState(() => _fullNameError = null);
    }

    if (username.isEmpty || username.length < 3) {
      setState(() => _usernameError = 'Mínimo de 3 caracteres.');
      return;
    }

    setState(() => _isLoading = true);

    final data = <String, dynamic>{};
    if (username != widget.initialUsername) data['username'] = username;
    if (fullName != widget.initialFullName) data['full_name'] = fullName;
    if (bio != widget.initialBiography) data['biography'] = bio;

    if (data.isEmpty) {
      setState(() => _isLoading = false);
      Navigator.pop(context);
      return;
    }

    final result = await context.read<AuthStore>().updateProfile(data);

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (result['success'] == true) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Perfil atualizado com sucesso.'),
          backgroundColor: AppColors.success,
        ),
      );
      Navigator.pop(context);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            result['message']?.toString() ?? 'Erro ao atualizar perfil.',
          ),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _ProfileField(
              label: 'Nome completo',
              controller: _fullNameCtrl,
              icon: Icons.person_outline_rounded,
              errorText: _fullNameError,
              onChanged: (v) {
                if (_fullNameError != null && v.trim().isNotEmpty) {
                  setState(() => _fullNameError = null);
                }
              },
            ),
            const SizedBox(height: 14),
            _ProfileField(
              label: 'Username',
              controller: _usernameCtrl,
              icon: Icons.alternate_email_rounded,
              errorText: _usernameError,
              onChanged: _onUsernameChanged,
            ),
            const SizedBox(height: 14),
            _ProfileField(
              label: 'Biografia',
              controller: _bioCtrl,
              icon: Icons.short_text_rounded,
              maxLines: 4,
              hintText: 'Escreva algo sobre si...',
            ),
            const SizedBox(height: 28),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                  elevation: 0,
                ),
                child: _isLoading
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.5,
                          color: Colors.white,
                        ),
                      )
                    : const Text(
                        'Guardar Alterações',
                        style: TextStyle(
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
  }
}

class _ProfileField extends StatelessWidget {
  const _ProfileField({
    required this.label,
    required this.controller,
    required this.icon,
    this.errorText,
    this.onChanged,
    this.maxLines = 1,
    this.hintText,
  });

  final String label;
  final TextEditingController controller;
  final IconData icon;
  final String? errorText;
  final ValueChanged<String>? onChanged;
  final int maxLines;
  final String? hintText;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: Color(0xFF2A3540),
          ),
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          maxLines: maxLines,
          onChanged: onChanged,
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.white,
            hintText: hintText ?? label,
            hintStyle: const TextStyle(
              color: Color(0xFFACB5BE),
              fontWeight: FontWeight.w500,
            ),
            prefixIcon: maxLines == 1
                ? Icon(icon, color: const Color(0xFF8B96A1), size: 20)
                : null,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 14,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(
                color: errorText != null
                    ? AppColors.error
                    : const Color(0xFFDDE3E9),
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(
                color: errorText != null
                    ? AppColors.error
                    : const Color(0xFFDDE3E9),
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(
                color: errorText != null ? AppColors.error : AppColors.primary,
                width: 1.5,
              ),
            ),
            errorText: errorText,
            errorStyle: const TextStyle(
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
