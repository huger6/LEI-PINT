import 'package:flutter/material.dart';
import '../widgets/auth_header.dart';
import '../widgets/custom_text_field.dart';
import '../widgets/custom_button.dart';
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
  final _locationController = TextEditingController();
  bool _isLoading = false;
  bool _agreedToTerms = false;
  String _preferredLanguage = '1';

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
      _birthdateController.text = data['birthdate'] ?? '';
      _profileImgUrlController.text = data['profileImgUrl'] ?? '';
      _locationController.text = data['location'] ?? '';
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
    _locationController.clear();
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
    _locationController.dispose();
    super.dispose();
  }

  void _handleRegister() {
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
              'birthdate': _birthdateController.text,
              'profileImgUrl': _profileImgUrlController.text,
              'location': _locationController.text,
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
        child: SingleChildScrollView(
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
                  hintText: 'João Silva',
                  prefixIcon: Icons.person_outlined,
                  keyboardType: TextInputType.name,
                  controller: _nameController,
                  validator: FormValidators.validateName,
                ),

                // Username field
                CustomTextField(
                  label: 'Username',
                  hintText: 'joaosilva',
                  prefixIcon: Icons.verified_user_outlined,
                  keyboardType: TextInputType.text,
                  controller: _usernameController,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Username é obrigatório';
                    }
                    if (value.length < 3) {
                      return 'Username deve ter no mínimo 3 caracteres';
                    }
                    return null;
                  },
                ),

                // Email field
                CustomTextField(
                  label: 'Email',
                  hintText: 'seu.email@softinsa.com',
                  prefixIcon: Icons.email_outlined,
                  keyboardType: TextInputType.emailAddress,
                  controller: _emailController,
                  validator: FormValidators.validateEmail,
                ),

                // Password field
                CustomTextField(
                  label: 'Password',
                  hintText: 'Crie uma password segura',
                  prefixIcon: Icons.lock_outlined,
                  obscureText: true,
                  controller: _passwordController,
                  validator: FormValidators.validatePassword,
                ),

                // Confirm password field
                CustomTextField(
                  label: 'Confirmar Password',
                  hintText: 'Confirme sua password',
                  prefixIcon: Icons.lock_outlined,
                  obscureText: true,
                  controller: _confirmPasswordController,
                  validator: (value) => FormValidators.validatePasswordConfirm(
                    value,
                    _passwordController.text,
                  ),
                ),

                const SizedBox(height: 16),
                Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    'Campos Opcionais',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const SizedBox(height: 8),

                // Phone field (optional)
                CustomTextField(
                  label: 'Telemóvel (Opcional)',
                  hintText: '+351 912 345 678',
                  prefixIcon: Icons.phone_outlined,
                  keyboardType: TextInputType.phone,
                  controller: _phoneController,
                  validator: (value) {
                    if (value != null && value.isNotEmpty && value.length < 9) {
                      return 'Telemóvel inválido';
                    }
                    return null;
                  },
                ),

                // Birthdate field (optional)
                CustomTextField(
                  label: 'Data de Nascimento (Opcional)',
                  hintText: 'DD/MM/YYYY',
                  prefixIcon: Icons.calendar_today_outlined,
                  keyboardType: TextInputType.datetime,
                  controller: _birthdateController,
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

                // Profile image URL field (optional)
                CustomTextField(
                  label: 'Imagem de Perfil (Opcional)',
                  hintText: 'https://exemplo.com/imagem.jpg',
                  prefixIcon: Icons.image_outlined,
                  keyboardType: TextInputType.url,
                  controller: _profileImgUrlController,
                  validator: (value) {
                    if (value != null && value.isNotEmpty) {
                      if (!value.startsWith('http://') &&
                          !value.startsWith('https://')) {
                        return 'URL inválido';
                      }
                    }
                    return null;
                  },
                ),

                // Location field (optional)
                CustomTextField(
                  label: 'Localidade (Opcional)',
                  hintText: 'Lisboa',
                  prefixIcon: Icons.location_on_outlined,
                  keyboardType: TextInputType.text,
                  controller: _locationController,
                ),

                // Preferred language (optional, defaults to 1)
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
                          padding: const EdgeInsets.symmetric(horizontal: 12),
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
                  text: 'Avançar',
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
      ),
    );
  }
}
