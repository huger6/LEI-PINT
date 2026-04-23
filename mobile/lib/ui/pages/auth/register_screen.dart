import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../../data/repositories/location_repo.dart';
import '../../widgets/shared/auth_header.dart';
import '../../widgets/shared/custom_text_field.dart';
import '../../widgets/shared/custom_button.dart';
import '../../widgets/shared/loading_overlay.dart';
import '../../widgets/shared/nav_link.dart';
import '../../../core/sync_manager.dart';
import '../../../core/routes/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../models/lang_model.dart';
import '../../../models/location_model.dart';
import '../../../models/dtos/registration_data.dart';
import '../../../data/repositories/lang_repo.dart';
import '../../../injection_container.dart';
import 'dart:io';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({Key? key}) : super(key: key);

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _phoneController = TextEditingController();
  final _birthdateController = TextEditingController();
  final _profileImgUrlController = TextEditingController();
  final _bioController = TextEditingController();

  bool _isLoading = false;
  bool _isLoadingData = true;
  bool _agreedToTerms = false;
  String _phonePrefix = '+351';

  LanguageModel? _preferredLanguage;
  List<LanguageModel> _availableLanguages = [];

  LocationModel? _selectedLocation;
  List<LocationModel> _availableLocations = [];

  final ImagePicker _imagePicker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _resetForm();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchDropdownData();
    });
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
          _availableLanguages = results[0] as List<LanguageModel>;
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
    return RegistrationData()
      ..fullName = _nameController.text
      ..username = _usernameController.text
      ..email = _emailController.text
      ..password = _passwordController.text
      ..phone = '$_phonePrefix${_phoneController.text}'.replaceAll(' ', '')
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

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    final colorScheme = Theme.of(context).colorScheme;
    FormValidators.configure(
      languageCode: tr.languageCode,
      translator: tr.tr,
    );

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: _goBackToLogin,
        ),
        title: Text(tr.tr('createAccount')),
      ),
      body: SafeArea(
        child: Stack(
          children: [
            SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Form(
                key: _formKey,
                child: Column(
                  children: [
                    const SizedBox(height: 24),

                    // Header
                    AuthHeader(
                      title: tr.tr('registerTitle'),
                      subtitle: tr.tr('registerSubtitle'),
                      imagePath: 'images/logotipo_softinsa.png',
                    ),

                    const SizedBox(height: 48),

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
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
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
                              decoration: BoxDecoration(
                                border: Border.all(color: colorScheme.outline),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: DropdownButton<String>(
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
                                  prefixIcon: const Icon(Icons.phone_outlined),
                                ),
                                validator: (value) {
                                  final normalized = (value ?? '').replaceAll(
                                    ' ',
                                    '',
                                  );
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
                          initialEntryMode: DatePickerEntryMode.calendarOnly,
                        );
                        if (picked != null) {
                          _birthdateController.text =
                              '${picked.day.toString().padLeft(2, '0')}/${picked.month.toString().padLeft(2, '0')}/${picked.year}';
                        }
                      },
                    ),

                    // Profile image picker (optional)
                    CustomTextField(
                      label: tr.tr('profileImage'),
                      hintText: tr.tr('noFileSelected'),
                      prefixIcon: Icons.image_outlined,
                      controller: _profileImgUrlController,
                      readOnly: true,
                      onTap: _pickProfileImage,
                    ),
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton.icon(
                        onPressed: _pickProfileImage,
                        icon: const Icon(Icons.upload_file_outlined),
                        label: Text(tr.tr('pickFromPhone')),
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
                            decoration: BoxDecoration(
                              border: Border.all(color: colorScheme.outline),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                              ),
                              child: DropdownButton<LocationModel>(
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
                            decoration: BoxDecoration(
                              border: Border.all(color: colorScheme.outline),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                              ),
                              child: _isLoadingData
                                  ? const SizedBox(
                                      height: 48,
                                      child: Center(
                                        child: CircularProgressIndicator(),
                                      ),
                                    )
                                  : DropdownButton<LanguageModel>(
                                      hint: Text(tr.tr('selectLanguage')),
                                      value: _preferredLanguage,
                                      isExpanded: true,
                                      underline: const SizedBox.shrink(),
                                      items: _availableLanguages.map((lang) {
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
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                        ),
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
                              setState(() => _agreedToTerms = value ?? false);
                            },
                          ),
                          Expanded(
                            child: RichText(
                              text: TextSpan(
                                text: tr.tr('acceptTermsPrefix'),
                                style: Theme.of(context).textTheme.bodySmall,
                                children: [
                                  TextSpan(
                                    text: tr.tr('termsAndConditions'),
                                    style: Theme.of(context).textTheme.bodySmall
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

                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
            if (_isLoading) const LoadingOverlay(),
          ],
        ),
      ),
    );
  }
}
