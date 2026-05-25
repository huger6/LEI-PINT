import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import 'dart:async';
import 'dart:io';
import '../../../data/repositories/location_repo.dart';
import '../../../data/repositories/validation_repo.dart';
import '../../widgets/shared/auth_header.dart';
import '../../widgets/shared/auth_particle_background.dart';
import '../../widgets/shared/auth_content_card.dart';
import '../../widgets/shared/custom_text_field.dart';
import '../../widgets/shared/custom_button.dart';
import '../../widgets/shared/loading_overlay.dart';
import '../../widgets/shared/nav_link.dart';
import '../../../core/routes/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../models/lang_model.dart';
import '../../../models/location_model.dart';
import '../../../models/dtos/registration_data.dart';
import '../../../data/repositories/lang_repo.dart';
import '../../../injection_container.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _usernameController;
  late final TextEditingController _emailController;
  late final TextEditingController _passwordController;
  late final TextEditingController _confirmPasswordController;
  late final TextEditingController _phoneController;
  late final TextEditingController _birthdateController;
  late final TextEditingController _profileImgUrlController;
  late final TextEditingController _bioController;

  final bool _isLoading = false;
  bool _isLoadingData = true;
  bool _agreedToTerms = false;
  String _phonePrefix = '+351';

  // Validation state tracking
  final Map<String, bool?> _validationState = {
    'email': null,
    'username': null,
    'name': null,
    'bio': null,
  };
  final Map<String, bool> _isValidating = {
    'email': false,
    'username': false,
    'name': false,
    'bio': false,
  };
  final Map<String, String> _validationMessages = {};

  LanguageModel? _preferredLanguage;
  List<LanguageModel> _availableLanguages = [];

  LocationModel? _selectedLocation;
  List<LocationModel> _availableLocations = [];

  final ImagePicker _imagePicker = ImagePicker();

  // Debounce timers for validation
  late Map<String, Timer?> _debounceTimers;

  @override
  void initState() {
    super.initState();
    _debounceTimers = {
      'email': null,
      'username': null,
      'name': null,
      'bio': null,
    };
    _nameController = TextEditingController();
    _usernameController = TextEditingController();
    _emailController = TextEditingController();
    _passwordController = TextEditingController();
    _confirmPasswordController = TextEditingController();
    _phoneController = TextEditingController();
    _birthdateController = TextEditingController();
    _profileImgUrlController = TextEditingController();
    _bioController = TextEditingController();

    // Add listeners for validation on blur (onChanged with debounce)
    _emailController.addListener(() => _debounceValidation('email'));
    _usernameController.addListener(() => _debounceValidation('username'));
    _nameController.addListener(() => _debounceValidation('name'));
    _bioController.addListener(() => _debounceValidation('bio'));
    _resetForm();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchDropdownData();
    });
  }

  static final _fallbackLanguages = [
    LanguageModel(id: 1, code: '1', name: 'Português'),
    LanguageModel(id: 2, code: '2', name: 'English'),
    LanguageModel(id: 3, code: '3', name: 'Español'),
  ];

  static String _normalizeLanguageCode(String code) {
    final lower = code.toLowerCase();
    if (lower == '1' || lower.startsWith('pt')) return 'pt';
    if (lower == '2' || lower.startsWith('en')) return 'en';
    if (lower == '3' || lower.startsWith('es')) return 'es';
    return lower;
  }

  Future<void> _fetchDropdownData() async {
    setState(() => _isLoadingData = true);
    try {
      final langRepo = context.read<LanguageRepository>();
      final locationRepo = context.read<LocationRepository>();

      final results = await Future.wait([
        langRepo.getAvailableLanguages(),
        locationRepo.getAvailableLocations(),
      ]);

      if (mounted) {
        setState(() {
          final fetched = results[0] as List<LanguageModel>;
          final seen = <String>{};
          final deduped = <LanguageModel>[];
          for (final lang in fetched) {
            final normalized = _normalizeLanguageCode(lang.code);
            if (seen.add(normalized)) {
              deduped.add(lang);
            }
          }
          final existingCodes = seen;
          for (final fallback in _fallbackLanguages) {
            final normalized = _normalizeLanguageCode(fallback.code);
            if (!existingCodes.contains(normalized)) {
              deduped.add(fallback);
            }
          }
          _availableLanguages = deduped;
          _availableLocations = results[1] as List<LocationModel>;

          if (_availableLanguages.isNotEmpty && _preferredLanguage == null) {
            _preferredLanguage = _availableLanguages.first;
            LanguageScope.of(context).setLanguageCode(_preferredLanguage!.code);
            FormValidators.setLanguageCode(_preferredLanguage!.code);
          }
        });
      }
    } catch (e) {
      debugPrint("Error loading locations/languages: $e");
      if (mounted) {
        setState(() {
          if (_availableLanguages.isEmpty) {
            _availableLanguages = List.from(_fallbackLanguages);
          }
        });
      }
    } finally {
      if (mounted) setState(() => _isLoadingData = false);
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final args =
        ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    if (args != null) {
      _populateFormWithPreviousData(args);
    }
  }

  void _populateFormWithPreviousData(Map<String, dynamic> data) {
    if (mounted) {
      _nameController.text = data['name'] ?? '';
      _usernameController.text = data['username'] ?? '';
      _emailController.text = data['email'] ?? '';
      _passwordController.text = data['password'] ?? '';
      _confirmPasswordController.text = data['password'] ?? '';
      _phoneController.text = data['phone'] ?? '';
      _phonePrefix = data['phonePrefix'] ?? '+351';
      _birthdateController.text = data['birthdate'] ?? '';
      _profileImgUrlController.text = data['profileImgUrl'] ?? '';
      _bioController.text = data['bio'] ?? '';

      if (data['location'] != null) {
        try {
          _selectedLocation = _availableLocations.firstWhere(
            (loc) => loc.id == data['location'].id,
          );
        } catch (_) {}
      }

      if (data['preferredLanguage'] != null) {
        try {
          _preferredLanguage = _availableLanguages.firstWhere(
            (lang) => lang.id == data['preferredLanguage'].id,
          );
          LanguageScope.of(context).setLanguageCode(_preferredLanguage!.code);
          FormValidators.setLanguageCode(_preferredLanguage!.code);
        } catch (_) {}
      }
    }
  }

  void _resetForm() {
    _nameController.clear();
    _usernameController.clear();
    _emailController.clear();
    _passwordController.clear();
    _confirmPasswordController.clear();
    _phoneController.clear();
    _birthdateController.clear();
    _profileImgUrlController.clear();
    _bioController.clear();

    _selectedLocation = null;
    _phonePrefix = '+351';
    _preferredLanguage = null;
    _agreedToTerms = false;
  }

  @override
  void dispose() {
    // Cancel all pending debounce timers
    _debounceTimers.forEach((key, timer) {
      timer?.cancel();
    });

    _nameController.dispose();
    _usernameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _phoneController.dispose();
    _birthdateController.dispose();
    _profileImgUrlController.dispose();
    _bioController.dispose();
    super.dispose();
  }

  Future<void> _pickProfileImage() async {
    final XFile? pickedImage = await _imagePicker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 80,
    );

    if (pickedImage == null) return;

    setState(() {
      _profileImgUrlController.text = pickedImage.path;
    });
  }

  void _normalizeFields() {
    _nameController.text = _nameController.text.trim();
    _usernameController.text = _usernameController.text.trim();
    _emailController.text = _emailController.text.replaceAll(
      RegExp(r'\s+'),
      '',
    );
    _bioController.text = _bioController.text.trim();
  }

  RegistrationData _buildRegistrationData() {
    final phoneInput = _phoneController.text.trim();

    final finalPhone = phoneInput.isEmpty
        ? null
        : '$_phonePrefix$phoneInput'.replaceAll(' ', '');

    return RegistrationData()
      ..fullName = _nameController.text
      ..username = _usernameController.text
      ..email = _emailController.text
      ..password = _passwordController.text
      ..phone = finalPhone
      ..birthDate = _birthdateController.text
      ..bio = _bioController.text
      ..profileImage = _profileImgUrlController.text.isNotEmpty
          ? File(_profileImgUrlController.text)
          : null
      ..location = _selectedLocation
      ..preferredLanguage = _preferredLanguage;
  }

  void _goBackToLogin() {
    final navigator = Navigator.of(context);
    if (navigator.canPop()) {
      navigator.pop();
      return;
    }

    navigator.pushReplacementNamed(AppRouter.login);
  }

  void _debounceValidation(String field) {
    _debounceTimers[field]?.cancel();
    _debounceTimers[field] = Timer(const Duration(milliseconds: 800), () {
      _validateField(field);
    });
  }

  Future<void> _validateField(String field) async {
    if (!mounted) return;

    final validationRepo = context.read<ValidationRepository>();
    final fieldValue = switch (field) {
      'email' => _emailController.text.trim(),
      'username' => _usernameController.text.trim(),
      'name' => _nameController.text.trim(),
      'bio' => _bioController.text.trim(),
      _ => '',
    };

    if (fieldValue.isEmpty) {
      setState(() {
        _validationState[field] = null;
        _validationMessages.remove(field);
      });
      return;
    }

    setState(() => _isValidating[field] = true);

    try {
      Map<String, dynamic> result;

      if (field == 'email') {
        result = await validationRepo.checkEmailAvailability(fieldValue);
        if (result['success'] == true) {
          setState(() {
            _validationState[field] = result['available'] ?? false;
            if (!result['available']!) {
              _validationMessages[field] =
                  result['message'] ?? 'Email já registado.';
            } else {
              _validationMessages.remove(field);
            }
          });
        }
      } else if (field == 'username') {
        result = await validationRepo.checkUsernameAvailability(fieldValue);
        if (result['success'] == true) {
          setState(() {
            _validationState[field] = result['available'] ?? false;
            if (!result['available']!) {
              _validationMessages[field] =
                  result['message'] ?? 'Username já registado.';
            } else {
              _validationMessages.remove(field);
            }
          });
        }
      } else if (field == 'name' || field == 'bio') {
        result = await validationRepo.validateContent(
          fullName: field == 'name' ? fieldValue : null,
          bio: field == 'bio' ? fieldValue : null,
        );
        if (result['success'] == true) {
          setState(() {
            _validationState[field] = result['valid'] ?? true;
            if (!result['valid']!) {
              _validationMessages[field] =
                  result['message'] ?? 'Conteúdo inválido.';
            } else {
              _validationMessages.remove(field);
            }
          });
        }
      }
    } catch (e) {
      debugPrint('Validation error for $field: $e');
      setState(() {
        _validationState[field] = null;
        _validationMessages.remove(field);
      });
    } finally {
      if (mounted) {
        setState(() => _isValidating[field] = false);
      }
    }
  }

  bool _allValidationsPass() {
    // Check that all required validations either passed or haven't been validated yet
    final emailValid = _validationState['email'] != false;
    final usernameValid = _validationState['username'] != false;
    final nameValid = _validationState['name'] != false;
    final bioValid = _validationState['bio'] != false;

    return emailValid && usernameValid && nameValid && bioValid;
  }

  void _handleRegister() {
    final tr = LanguageScope.of(context);
    _normalizeFields();

    if (_passwordController.text != _confirmPasswordController.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(tr.tr('passwordsDoNotMatch')),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    if (!_allValidationsPass()) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Por favor, corrija os erros de validação.'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    if (_formKey.currentState!.validate() && _agreedToTerms) {
      final authStore = context.read<AuthStore>();
      final registrationData = _buildRegistrationData();

      authStore.saveRegistrationDraft(registrationData);

      Navigator.pushNamed(context, AppRouter.selectArea);
    } else if (!_agreedToTerms) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(tr.tr('mustAcceptTerms')),
          backgroundColor: AppColors.warning,
        ),
      );
    }
  }

  Widget _buildValidationFeedback(String field) {
    if (_isValidating[field] == true) {
      return Padding(
        padding: const EdgeInsets.only(top: 4),
        child: SizedBox(
          height: 16,
          child: Row(
            children: [
              SizedBox(
                width: 12,
                height: 12,
                child: CircularProgressIndicator(
                  strokeWidth: 1.5,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    Theme.of(context).colorScheme.primary,
                  ),
                ),
              ),
              const SizedBox(width: 6),
              Text(
                'Verificando...',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: Theme.of(context).colorScheme.primary,
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (_validationMessages.containsKey(field)) {
      return Padding(
        padding: const EdgeInsets.only(top: 4),
        child: Row(
          children: [
            Icon(
              Icons.error_outline,
              size: 12,
              color: Theme.of(context).colorScheme.error,
            ),
            const SizedBox(width: 6),
            Expanded(
              child: Text(
                _validationMessages[field] ?? '',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: Theme.of(context).colorScheme.error,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      );
    }

    if (_validationState[field] == true) {
      return Padding(
        padding: const EdgeInsets.only(top: 4),
        child: Row(
          children: [
            Icon(
              Icons.check_circle_outline,
              size: 12,
              color: Theme.of(context).colorScheme.tertiary,
            ),
            const SizedBox(width: 6),
            Text(
              'Validado',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: Theme.of(context).colorScheme.tertiary,
              ),
            ),
          ],
        ),
      );
    }

    return const SizedBox.shrink();
  }

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    final colorScheme = Theme.of(context).colorScheme;
    final borderColor = colorScheme.outline.withValues(alpha: 0.26);
    final fieldTextStyle = Theme.of(context).textTheme.bodyMedium?.copyWith(
      fontWeight: FontWeight.w400,
      color: colorScheme.onSurface,
    );
    FormValidators.configure(languageCode: tr.languageCode, translator: tr.tr);

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: _goBackToLogin,
        ),
        title: Text(tr.tr('createAccount')),
      ),
      body: Stack(
        fit: StackFit.expand,
        children: [
          const AuthParticleBackground(),
          SafeArea(
            child: Stack(
              children: [
                SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
                  child: AuthContentCard(
                    child: Form(
                      key: _formKey,
                      child: Column(
                        children: [
                          const SizedBox(height: 8),

                          // Header
                          AuthHeader(
                            title: tr.tr('registerTitle'),
                            subtitle: tr.tr('registerSubtitle'),
                            imagePath: 'assets/images/logotipo_softinsa.png',
                          ),

                          const SizedBox(height: 36),

                          // Name field
                          CustomTextField(
                            label: tr.tr('name'),
                            isRequired: true,
                            hintText: tr.tr('nameHint'),
                            prefixIcon: Icons.person_outlined,
                            keyboardType: TextInputType.name,
                            controller: _nameController,
                            validator: FormValidators.validateName,
                          ),
                          _buildValidationFeedback('name'),
                          const SizedBox(height: 8),

                          // Username field
                          CustomTextField(
                            label: tr.tr('username'),
                            isRequired: true,
                            hintText: tr.tr('usernameHint'),
                            prefixIcon: Icons.verified_user_outlined,
                            keyboardType: TextInputType.text,
                            controller: _usernameController,
                            validator: FormValidators.validateUsername,
                          ),
                          _buildValidationFeedback('username'),
                          const SizedBox(height: 8),

                          // Email field
                          CustomTextField(
                            label: tr.tr('email'),
                            isRequired: true,
                            hintText: tr.tr('emailHint'),
                            prefixIcon: Icons.email_outlined,
                            keyboardType: TextInputType.emailAddress,
                            controller: _emailController,
                            validator: FormValidators.validateEmail,
                          ),
                          _buildValidationFeedback('email'),
                          const SizedBox(height: 8),

                          // Password field
                          CustomTextField(
                            label: tr.tr('password'),
                            isRequired: true,
                            hintText: tr.tr('createPasswordHint'),
                            prefixIcon: Icons.lock_outlined,
                            obscureText: true,
                            controller: _passwordController,
                            validator: FormValidators.validatePassword,
                          ),

                          // Confirm password field
                          CustomTextField(
                            label: tr.tr('confirmPassword'),
                            isRequired: true,
                            hintText: tr.tr('confirmPasswordHint'),
                            prefixIcon: Icons.lock_outlined,
                            obscureText: true,
                            controller: _confirmPasswordController,
                            validator: (value) =>
                                FormValidators.validatePasswordConfirm(
                                  value,
                                  password: _passwordController.text,
                                ),
                          ),

                          const SizedBox(height: 16),
                          Align(
                            alignment: Alignment.centerLeft,
                            child: Text(
                              tr.tr('optionalFields'),
                              style: Theme.of(context).textTheme.bodyMedium
                                  ?.copyWith(fontWeight: FontWeight.w600),
                            ),
                          ),
                          const SizedBox(height: 8),

                          // Phone field (optional)
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                tr.tr('phone'),
                                style: Theme.of(context).textTheme.bodyLarge
                                    ?.copyWith(fontWeight: FontWeight.w500),
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                    ),
                                    decoration: _outlinedDecoration(
                                      borderColor: borderColor,
                                      borderRadius: 18,
                                      color: colorScheme.surface.withValues(
                                        alpha: 0.9,
                                      ),
                                    ),
                                    child: DropdownButton<String>(
                                      style: fieldTextStyle,
                                      value:
                                          [
                                            '+351',
                                            '+34',
                                            '+33',
                                          ].contains(_phonePrefix)
                                          ? _phonePrefix
                                          : null,
                                      underline: const SizedBox.shrink(),
                                      items: const [
                                        DropdownMenuItem(
                                          value: '+351',
                                          child: Text('+351'),
                                        ),
                                        DropdownMenuItem(
                                          value: '+34',
                                          child: Text('+34'),
                                        ),
                                        DropdownMenuItem(
                                          value: '+33',
                                          child: Text('+33'),
                                        ),
                                      ],
                                      onChanged: (value) {
                                        setState(() {
                                          _phonePrefix = value ?? '+351';
                                        });
                                      },
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: TextFormField(
                                      controller: _phoneController,
                                      keyboardType: TextInputType.phone,
                                      decoration: InputDecoration(
                                        hintText: tr.tr('phoneHint'),
                                        prefixIcon: const Icon(
                                          Icons.phone_outlined,
                                        ),
                                      ),
                                      validator: (value) {
                                        final normalized = (value ?? '')
                                            .replaceAll(' ', '');
                                        if (normalized.isNotEmpty &&
                                            normalized.length < 9) {
                                          return tr.tr('invalidPhone');
                                        }
                                        return null;
                                      },
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                            ],
                          ),

                          // Birthdate field (optional)
                          CustomTextField(
                            label: tr.tr('birthdate'),
                            isRequired: false,
                            hintText: tr.tr('birthdateHint'),
                            prefixIcon: Icons.calendar_today_outlined,
                            keyboardType: TextInputType.datetime,
                            controller: _birthdateController,
                            validator: FormValidators.validateBirthdate,
                            readOnly: true,
                            onTap: () async {
                              final DateTime? picked = await showDatePicker(
                                context: context,
                                initialDate: DateTime(2000),
                                firstDate: DateTime(1950),
                                lastDate: DateTime.now(),
                                initialEntryMode:
                                    DatePickerEntryMode.calendarOnly,
                              );
                              if (picked != null) {
                                _birthdateController.text =
                                    '${picked.day.toString().padLeft(2, '0')}/${picked.month.toString().padLeft(2, '0')}/${picked.year}';
                              }
                            },
                          ),

                          // Profile image picker (optional)
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  tr.tr('profileImage'),
                                  style: Theme.of(context).textTheme.bodyLarge
                                      ?.copyWith(fontWeight: FontWeight.w500),
                                ),
                                const SizedBox(height: 8),
                                GestureDetector(
                                  onTap: _pickProfileImage,
                                  child: Container(
                                    width: double.infinity,
                                    height: 160,
                                    decoration: _outlinedDecoration(
                                      borderColor: borderColor,
                                      borderRadius: 20,
                                      color: colorScheme.surface.withValues(
                                        alpha: 0.9,
                                      ),
                                    ),
                                    clipBehavior: Clip.antiAlias,
                                    child:
                                        _profileImgUrlController.text.isNotEmpty
                                        ? Image.file(
                                            File(_profileImgUrlController.text),
                                            fit: BoxFit.cover,
                                            errorBuilder:
                                                (context, error, stackTrace) =>
                                                    Center(
                                                      child: Text(
                                                        tr.tr('noFileSelected'),
                                                      ),
                                                    ),
                                          )
                                        : Center(
                                            child: Column(
                                              mainAxisAlignment:
                                                  MainAxisAlignment.center,
                                              children: [
                                                const Icon(
                                                  Icons.image_outlined,
                                                  size: 36,
                                                ),
                                                const SizedBox(height: 8),
                                                Text(tr.tr('noFileSelected')),
                                              ],
                                            ),
                                          ),
                                  ),
                                ),
                                Align(
                                  alignment: Alignment.centerRight,
                                  child: TextButton.icon(
                                    onPressed: _pickProfileImage,
                                    icon: const Icon(
                                      Icons.upload_file_outlined,
                                    ),
                                    label: Text(tr.tr('pickFromPhone')),
                                  ),
                                ),
                              ],
                            ),
                          ),

                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  tr.tr('location'),
                                  style: Theme.of(context).textTheme.bodyMedium,
                                ),
                                const SizedBox(height: 8),
                                Container(
                                  decoration: _outlinedDecoration(
                                    borderColor: borderColor,
                                    borderRadius: 18,
                                    color: colorScheme.surface.withValues(
                                      alpha: 0.9,
                                    ),
                                  ),
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 12,
                                    ),
                                    child: DropdownButton<LocationModel>(
                                      style: fieldTextStyle,
                                      hint: Text(tr.tr('selectLocation')),
                                      value: _selectedLocation,
                                      isExpanded: true,
                                      underline: const SizedBox.shrink(),
                                      items: _availableLocations.map((loc) {
                                        return DropdownMenuItem(
                                          value: loc,
                                          child: Text(loc.name),
                                        );
                                      }).toList(),
                                      onChanged: (value) {
                                        setState(() {
                                          _selectedLocation = value;
                                        });
                                      },
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),

                          // Preferred language (optional)
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  tr.tr('preferredLanguageOptional'),
                                  style: Theme.of(context).textTheme.bodyMedium,
                                ),
                                const SizedBox(height: 8),
                                Container(
                                  decoration: _outlinedDecoration(
                                    borderColor: borderColor,
                                    borderRadius: 18,
                                    color: colorScheme.surface.withValues(
                                      alpha: 0.9,
                                    ),
                                  ),
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 12,
                                    ),
                                    child: _isLoadingData
                                        ? const SizedBox(
                                            height: 48,
                                            child: Center(
                                              child:
                                                  CircularProgressIndicator(),
                                            ),
                                          )
                                        : DropdownButton<LanguageModel>(
                                            style: fieldTextStyle,
                                            hint: Text(tr.tr('selectLanguage')),
                                            value: _preferredLanguage,
                                            isExpanded: true,
                                            underline: const SizedBox.shrink(),
                                            items: _availableLanguages.map((
                                              lang,
                                            ) {
                                              return DropdownMenuItem(
                                                value: lang,
                                                child: Text(lang.name),
                                              );
                                            }).toList(),
                                            onChanged: (value) {
                                              if (value != null) {
                                                setState(() {
                                                  _preferredLanguage = value;
                                                });
                                                tr.setLanguageCode(value.code);
                                                FormValidators.setLanguageCode(
                                                  value.code,
                                                );
                                              }
                                            },
                                          ),
                                  ),
                                ),
                              ],
                            ),
                          ),

                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                tr.tr('aboutMe'),
                                style: Theme.of(context).textTheme.bodyLarge
                                    ?.copyWith(fontWeight: FontWeight.w500),
                              ),
                              const SizedBox(height: 8),
                              TextFormField(
                                controller: _bioController,
                                minLines: 4,
                                maxLines: 8,
                                keyboardType: TextInputType.multiline,
                                validator: FormValidators.validateBiography,
                                decoration: InputDecoration(
                                  hintText: tr.tr('aboutMeHint'),
                                  alignLabelWithHint: true,
                                  contentPadding: const EdgeInsets.all(16),
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(18),
                                  ),
                                ),
                              ),
                              _buildValidationFeedback('bio'),
                              const SizedBox(height: 8),
                            ],
                          ),

                          // Terms and conditions checkbox
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            child: Row(
                              children: [
                                Checkbox(
                                  value: _agreedToTerms,
                                  onChanged: (value) {
                                    setState(
                                      () => _agreedToTerms = value ?? false,
                                    );
                                  },
                                ),
                                Expanded(
                                  child: RichText(
                                    text: TextSpan(
                                      text: tr.tr('acceptTermsPrefix'),
                                      style: Theme.of(
                                        context,
                                      ).textTheme.bodySmall,
                                      children: [
                                        TextSpan(
                                          text: tr.tr('termsAndConditions'),
                                          style: Theme.of(context)
                                              .textTheme
                                              .bodySmall
                                              ?.copyWith(
                                                color: colorScheme.primary,
                                                fontWeight: FontWeight.w600,
                                              ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 32),

                          // Next button
                          CustomButton(
                            text: tr.tr('finishRegister'),
                            isLoading: _isLoading,
                            onPressed: _handleRegister,
                          ),

                          const SizedBox(height: 24),

                          // Login link
                          NavLink(
                            text: tr.tr('alreadyHaveAccount'),
                            linkText: tr.tr('doLogin'),
                            onPressed: _goBackToLogin,
                          ),

                          const SizedBox(height: 12),
                        ],
                      ),
                    ),
                  ),
                ),
                if (_isLoading) const LoadingOverlay(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  BoxDecoration _outlinedDecoration({
    required Color borderColor,
    required double borderRadius,
    Color? color,
  }) {
    return BoxDecoration(
      border: Border.all(color: borderColor, width: 1),
      borderRadius: BorderRadius.circular(borderRadius),
      color: color,
    );
  }
}
