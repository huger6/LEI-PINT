import 'package:flutter/material.dart';
import 'package:flutter_application_1/repositories/location_repository.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../widgets/auth_header.dart';
import '../widgets/custom_text_field.dart';
import '../widgets/custom_button.dart';
import '../widgets/loading_overlay.dart';
import '../widgets/nav_link.dart';
import '../utils/form_validators.dart';
import '../utils/language_controller.dart';
import '../theme/app_colors.dart';
import '../models/language_model.dart';
import '../models/location_model.dart';
import '../repositories/language_repository.dart';
import '../utils/auth_store.dart';
import '../utils/dependency_injection.dart';
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

  // CORREÇÃO: Variáveis para a localização
  LocationModel? _selectedLocation;
  List<LocationModel> _availableLocations = [];

  final ImagePicker _imagePicker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _resetForm();
    // Após a tela construir, pedir os dados à API
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchDropdownData();
    });
  }

  Future<void> _fetchDropdownData() async {
    setState(() => _isLoadingData = true);
    try {
      // 1. Instanciar os dois repositórios
      final langRepo = context.read<LanguageRepository>();

      final locationRepo = context.read<LocationRepository>();

      // 2. Fazer os dois pedidos à API ao mesmo tempo (Future.wait é mais rápido!)
      final results = await Future.wait([
        langRepo.getAvailableLanguages(),
        locationRepo.getAvailableLocations(),
      ]);

      if (mounted) {
        setState(() {
          // 3. Guardar os resultados nas respetivas variáveis
          _availableLanguages = results[0] as List<LanguageModel>;
          _availableLocations = results[1] as List<LocationModel>;

          // Lógica original dos idiomas
          if (_availableLanguages.isNotEmpty && _preferredLanguage == null) {
            _preferredLanguage = _availableLanguages.first;
            LanguageScope.of(context).setLanguageCode(_preferredLanguage!.code);
            FormValidators.setLanguageCode(_preferredLanguage!.code);
          }

          // Opcional: Se quiseres que a primeira localização venha pré-selecionada
          // if (_availableLocations.isNotEmpty && _selectedLocation == null) {
          //   _selectedLocation = _availableLocations.first;
          // }
        });
      }
    } catch (e) {
      debugPrint("Erro ao carregar locais/idiomas: $e");
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

      // Lógica para preencher localização se existir nos dados prévios
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

    _selectedLocation = null; // Limpa a localização
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
      final authStore = getIt<AuthStore>();

      authStore.saveBasicRegistrationData(
        fullName: _nameController.text,
        username: _usernameController.text,
        email: _emailController.text,
        password: _passwordController.text,
        phone: '$_phonePrefix${_phoneController.text}'.replaceAll(' ', ''),
        birthDate: _birthdateController.text,
        bio: _bioController.text,
        profileImage: _profileImgUrlController.text.isNotEmpty
            ? File(_profileImgUrlController.text)
            : null,
        location:
            _selectedLocation, // CORREÇÃO: Passa o objeto guardado do Dropdown
        preferredLanguage: _preferredLanguage,
      );

      Navigator.pushNamed(context, '/select-area');
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
    FormValidators.setLanguageCode(tr.languageCode);

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
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
                      hintText: 'João Silva',
                      prefixIcon: Icons.person_outlined,
                      keyboardType: TextInputType.name,
                      controller: _nameController,
                      validator: FormValidators.validateName,
                    ),

                    // Username field
                    CustomTextField(
                      label: tr.tr('username'),
                      isRequired: true,
                      hintText: 'joaosilva',
                      prefixIcon: Icons.verified_user_outlined,
                      keyboardType: TextInputType.text,
                      controller: _usernameController,
                      validator: FormValidators.validateUsername,
                    ),

                    // Email field
                    CustomTextField(
                      label: tr.tr('email'),
                      isRequired: true,
                      hintText: 'seu.email@softinsa.com',
                      prefixIcon: Icons.email_outlined,
                      keyboardType: TextInputType.emailAddress,
                      controller: _emailController,
                      validator: FormValidators.validateEmail,
                    ),

                    // Password field
                    CustomTextField(
                      label: tr.tr('password'),
                      isRequired: true,
                      hintText: 'Crie uma password segura',
                      prefixIcon: Icons.lock_outlined,
                      obscureText: true,
                      controller: _passwordController,
                      validator: FormValidators.validatePassword,
                    ),

                    // Confirm password field
                    CustomTextField(
                      label: tr.tr('confirmPassword'),
                      isRequired: true,
                      hintText: 'Confirme sua password',
                      prefixIcon: Icons.lock_outlined,
                      obscureText: true,
                      controller: _confirmPasswordController,
                      validator: (value) =>
                          FormValidators.validatePasswordConfirm(
                            value,
                            _passwordController.text,
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
                                border: Border.all(color: Colors.grey.shade300),
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
                                decoration: const InputDecoration(
                                  hintText: '912 345 678',
                                  prefixIcon: Icon(Icons.phone_outlined),
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
                      hintText: 'DD/MM/YYYY',
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

                    // CORREÇÃO: Novo componente Location Dropdown
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
                              border: Border.all(color: Colors.grey.shade300),
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
                              border: Border.all(color: Colors.grey.shade300),
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
                                      hint: Text("Selecione o Idioma"),
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
                          'Biografia',
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
                                          color: Theme.of(context).primaryColor,
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
                      onPressed: () {
                        Navigator.pop(context);
                      },
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
