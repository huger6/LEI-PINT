import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../widgets/auth_header.dart';
import '../widgets/custom_text_field.dart';
import '../widgets/custom_button.dart';
import '../widgets/loading_overlay.dart';
import '../widgets/nav_link.dart';
import '../utils/form_validators.dart';

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
  bool _agreedToTerms = false;
  String _phonePrefix = '+351';
  String? _selectedLocation;
  String _preferredLanguage = '1';
  final List<String> _availableLocations = const [
    'Lisboa',
    'Porto',
    'Braga',
    'Coimbra',
    'Aveiro',
    'Faro',
  ];
  final ImagePicker _imagePicker = ImagePicker();

  @override
  void initState() {
    super.initState();
    // Limpar dados anteriores no initState para evitar conflitos
    _resetForm();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Receber dados anteriores se existirem (vindo de select_area)
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
      _selectedLocation = data['location'];
      _preferredLanguage = data['preferredLanguage'] ?? '1';
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
    _phonePrefix = '+351';
    _selectedLocation = null;
    _preferredLanguage = '1';
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
    _normalizeFields();

    if (_formKey.currentState!.validate() && _agreedToTerms) {
      setState(() => _isLoading = true);

      // Simular chamada ao backend com delay
      Future.delayed(const Duration(seconds: 2), () {
        if (!mounted) return;

        setState(() => _isLoading = false);

        // Mostrar mensagem de sucesso
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Conta criada com sucesso! Email: ${_emailController.text}',
            ),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 2),
          ),
        );

        // Navegar para select_area com os dados do formulário
        if (mounted) {
          Navigator.pushNamed(
            context,
            '/select-area',
            arguments: {
              'name': _nameController.text,
              'username': _usernameController.text,
              'email': _emailController.text,
              'password': _passwordController.text,
              'phone': _phoneController.text,
              'phonePrefix': _phonePrefix,
              'birthdate': _birthdateController.text,
              'profileImgUrl': _profileImgUrlController.text,
              'bio': _bioController.text,
              'location': _selectedLocation,
              'preferredLanguage': _preferredLanguage,
            },
          );
        }
      });
    } else if (!_agreedToTerms) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Você deve aceitar os termos para continuar'),
          backgroundColor: Colors.orange,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('Criar Conta'),
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
                      title: 'Crie sua conta',
                      subtitle: 'Junte-se à Softinsa',
                      imagePath: 'images/logotipo_softinsa.png',
                    ),

                    const SizedBox(height: 48),

                    // Name field
                    CustomTextField(
                      label: 'Nome Completo',
                      isRequired: true,
                      hintText: 'João Silva',
                      prefixIcon: Icons.person_outlined,
                      keyboardType: TextInputType.name,
                      controller: _nameController,
                      validator: FormValidators.validateName,
                    ),

                    // Username field
                    CustomTextField(
                      label: 'Username',
                      isRequired: true,
                      hintText: 'joaosilva',
                      prefixIcon: Icons.verified_user_outlined,
                      keyboardType: TextInputType.text,
                      controller: _usernameController,
                      validator: FormValidators.validateUsername,
                    ),

                    // Email field
                    CustomTextField(
                      label: 'Email',
                      isRequired: true,
                      hintText: 'seu.email@softinsa.com',
                      prefixIcon: Icons.email_outlined,
                      keyboardType: TextInputType.emailAddress,
                      controller: _emailController,
                      validator: FormValidators.validateEmail,
                    ),

                    // Password field
                    CustomTextField(
                      label: 'Password',
                      isRequired: true,
                      hintText: 'Crie uma password segura',
                      prefixIcon: Icons.lock_outlined,
                      obscureText: true,
                      controller: _passwordController,
                      validator: FormValidators.validatePassword,
                    ),

                    // Confirm password field
                    CustomTextField(
                      label: 'Confirmar Password',
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
                        'Campos opcionais',
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
                          'Telemóvel',
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
                                value: _phonePrefix,
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
                                  DropdownMenuItem(
                                    value: '+44',
                                    child: Text('+44'),
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
                                    return 'Telemóvel inválido';
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
                      label: 'Data de Nascimento',
                      isRequired: true,
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
                        );
                        if (picked != null) {
                          _birthdateController.text =
                              '${picked.day.toString().padLeft(2, '0')}/${picked.month.toString().padLeft(2, '0')}/${picked.year}';
                        }
                      },
                    ),

                    // Profile image picker (optional)
                    CustomTextField(
                      label: 'Imagem de Perfil',
                      hintText: 'Nenhum ficheiro selecionado',
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
                        label: const Text('Escolher do telemóvel'),
                      ),
                    ),

                    // Location dropdown (optional)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Localidade',
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
                              child: DropdownButton<String>(
                                hint: const Text('Selecionar localidade'),
                                value: _selectedLocation,
                                isExpanded: true,
                                underline: const SizedBox.shrink(),
                                items: _availableLocations
                                    .map(
                                      (location) => DropdownMenuItem(
                                        value: location,
                                        child: Text(location),
                                      ),
                                    )
                                    .toList(),
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
                            'Linguagem Preferida (Opcional)',
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
                              child: DropdownButton<String>(
                                value: _preferredLanguage,
                                isExpanded: true,
                                underline: const SizedBox.shrink(),
                                items: const [
                                  DropdownMenuItem(
                                    value: '1',
                                    child: Text('Português'),
                                  ),
                                  DropdownMenuItem(
                                    value: '2',
                                    child: Text('English'),
                                  ),
                                  DropdownMenuItem(
                                    value: '3',
                                    child: Text('Español'),
                                  ),
                                  DropdownMenuItem(
                                    value: '4',
                                    child: Text('Français'),
                                  ),
                                ],
                                onChanged: (value) {
                                  setState(() {
                                    _preferredLanguage = value ?? '1';
                                  });
                                },
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    CustomTextField(
                      label: 'Sobre mim',
                      hintText: 'Escreva uma breve biografia',
                      prefixIcon: Icons.info_outline,
                      controller: _bioController,
                      maxLines: 4,
                      validator: FormValidators.validateBiography,
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
                                text: 'Eu aceito os ',
                                style: Theme.of(context).textTheme.bodySmall,
                                children: [
                                  TextSpan(
                                    text: 'Termos e Condições',
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
                      text: 'Concluir registo',
                      isLoading: _isLoading,
                      onPressed: _handleRegister,
                    ),

                    const SizedBox(height: 24),

                    // Login link
                    NavLink(
                      text: 'Já tem conta?',
                      linkText: 'Fazer login',
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
