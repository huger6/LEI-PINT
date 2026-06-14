class FormValidators {
  static String _languageCode = 'pt';
  static String Function(String key)? _translator;

  static const Map<String, Map<String, String>> _fallbackMessages = {
    'en': {
      // Name
      'validationNameRequired': 'Name is required.',
      'validationNameMinChars': 'Name must have at least 2 characters.',
      'validationNameMaxChars': 'Name must have at most 255 characters.',
      // Username
      'validationUsernameRequired': 'Username is required.',
      'validationUsernameMinChars': 'Username must have at least 3 characters.',
      'validationUsernameMaxChars': 'Username must have at most 50 characters.',
      'validationUsernameInvalidChars':
          'Username can only contain letters, numbers, dots and underscores.',
      // Email
      'validationEmailRequired': 'Email is required.',
      'validationEmailInvalidFormat': 'Invalid email format.',
      'validationEmailTooLong': 'Email must have at most 255 characters.',
      // Password
      'validationPasswordRequired': 'Password is required.',
      'validationPasswordMinChars': 'Password must have at least 8 characters.',
      'validationPasswordMaxChars':
          'Password must have at most 100 characters.',
      'validationPasswordNoUppercase':
          'Password must have at least 1 capital letter.',
      'validationPasswordNoLowercase':
          'Password must have at least 1 lowercase letter.',
      'validationPasswordNoNumber': 'Password must have at least 1 number.',
      'validationPasswordNoSpecialChar':
          'Password must have at least 1 special character (!@#\$%^&*).',
      // Password confirm
      'validationPasswordConfirmRequired': 'Please confirm your password.',
      'validationPasswordConfirmMismatch': 'Passwords do not match.',
      // Phone
      'validationPhoneInvalidFormat':
          'Invalid format. Use international standard (e.g. +351912345678).',
      // Birthdate
      'validationBirthdateFormat': 'Birthdate must be in dd/mm/yyyy format.',
      'validationBirthdateMinAge': 'You must be at least 16 years old.',
      // Biography
      'validationBiographyMaxChars':
          'Biography must have at most 5000 characters.',
      'validationBiographyMaxWords': 'Biography cannot exceed 500 words.',
    },
    'pt': {
      // Name
      'validationNameRequired': 'Nome é obrigatório.',
      'validationNameMinChars': 'O nome deve ter pelo menos 2 caracteres.',
      'validationNameMaxChars': 'O nome deve ter no máximo 255 caracteres.',
      // Username
      'validationUsernameRequired': 'Username é obrigatório.',
      'validationUsernameMinChars':
          'O username deve ter pelo menos 3 caracteres.',
      'validationUsernameMaxChars':
          'O username deve ter no máximo 50 caracteres.',
      'validationUsernameInvalidChars':
          'O username só pode conter letras, números, pontos e underscores.',
      // Email
      'validationEmailRequired': 'Email é obrigatório.',
      'validationEmailInvalidFormat': 'Formato de email inválido.',
      'validationEmailTooLong': 'O email deve ter no máximo 255 caracteres.',
      // Password
      'validationPasswordRequired': 'Password é obrigatória.',
      'validationPasswordMinChars':
          'A password deve ter pelo menos 8 caracteres.',
      'validationPasswordMaxChars':
          'A password deve ter no máximo 100 caracteres.',
      'validationPasswordNoUppercase':
          'A password deve ter pelo menos 1 letra maiúscula.',
      'validationPasswordNoLowercase':
          'A password deve ter pelo menos 1 letra minúscula.',
      'validationPasswordNoNumber': 'A password deve ter pelo menos 1 número.',
      'validationPasswordNoSpecialChar':
          'A password deve ter pelo menos 1 carácter especial (!@#\$%^&*).',
      // Password confirm
      'validationPasswordConfirmRequired': 'Confirma a password.',
      'validationPasswordConfirmMismatch': 'As passwords não coincidem.',
      // Phone
      'validationPhoneInvalidFormat':
          'Formato inválido. Use o formato internacional (ex: +351912345678).',
      // Birthdate
      'validationBirthdateFormat': 'A data deve estar no formato dd/mm/yyyy.',
      'validationBirthdateMinAge': 'Deves ter pelo menos 16 anos.',
      // Biography
      'validationBiographyMaxChars':
          'A biografia deve ter no máximo 5000 caracteres.',
      'validationBiographyMaxWords': 'A biografia não pode exceder 500 palavras.',
    },
    'es': {
      // Name
      'validationNameRequired': 'El nombre es obligatorio.',
      'validationNameMinChars': 'El nombre debe tener al menos 2 caracteres.',
      'validationNameMaxChars': 'El nombre debe tener como máximo 255 caracteres.',
      // Username
      'validationUsernameRequired': 'El usuario es obligatorio.',
      'validationUsernameMinChars':
          'El usuario debe tener al menos 3 caracteres.',
      'validationUsernameMaxChars':
          'El usuario debe tener como máximo 50 caracteres.',
      'validationUsernameInvalidChars':
          'El usuario solo puede contener letras, números, puntos y guiones bajos.',
      // Email
      'validationEmailRequired': 'El correo es obligatorio.',
      'validationEmailInvalidFormat': 'Formato de correo inválido.',
      'validationEmailTooLong':
          'El correo debe tener como máximo 255 caracteres.',
      // Password
      'validationPasswordRequired': 'La contraseña es obligatoria.',
      'validationPasswordMinChars':
          'La contraseña debe tener al menos 8 caracteres.',
      'validationPasswordMaxChars':
          'La contraseña debe tener como máximo 100 caracteres.',
      'validationPasswordNoUppercase':
          'La contraseña debe tener al menos 1 letra mayúscula.',
      'validationPasswordNoLowercase':
          'La contraseña debe tener al menos 1 letra minúscula.',
      'validationPasswordNoNumber':
          'La contraseña debe tener al menos 1 número.',
      'validationPasswordNoSpecialChar':
          'La contraseña debe tener al menos 1 carácter especial (!@#\$%^&*).',
      // Password confirm
      'validationPasswordConfirmRequired': 'Confirma tu contraseña.',
      'validationPasswordConfirmMismatch': 'Las contraseñas no coinciden.',
      // Phone
      'validationPhoneInvalidFormat':
          'Formato inválido. Use el estándar internacional (ej: +34612345678).',
      // Birthdate
      'validationBirthdateFormat': 'La fecha debe estar en formato dd/mm/yyyy.',
      'validationBirthdateMinAge': 'Debes tener al menos 16 años.',
      // Biography
      'validationBiographyMaxChars':
          'La biografía debe tener como máximo 5000 caracteres.',
      'validationBiographyMaxWords':
          'La biografía no puede superar las 500 palabras.',
    },
  };

  static void configure({
    required String languageCode,
    required String Function(String key) translator,
  }) {
    setLanguageCode(languageCode);
    _translator = translator;
  }

  static void setTranslator(String Function(String key) translator) {
    _translator = translator;
  }

  static void setLanguageCode(String code) {
    final normalized = switch (code.toLowerCase()) {
      '1' || 'pt' => 'pt',
      '2' || 'en' => 'en',
      '3' || 'es' => 'es',
      _ => code.toLowerCase(),
    };
    if (_fallbackMessages.containsKey(normalized)) {
      _languageCode = normalized;
    }
  }

  static String _message(String key) {
    final translated = _translator?.call(key);
    if (translated != null && translated != key) {
      return translated;
    }

    return _fallbackMessages[_languageCode]?[key] ??
        _fallbackMessages['en']![key] ??
        key;
  }

  /// Mirrors: fullNameRule — min 2, max 255 chars.
  static String? validateName(String? value) {
    final text = (value ?? '').trim();
    if (text.isEmpty) return _message('validationNameRequired');
    if (text.length < 2) return _message('validationNameMinChars');
    if (text.length > 255) return _message('validationNameMaxChars');
    return null;
  }

  /// Mirrors: usernameRule — min 3, max 50, regex ^[a-zA-Z0-9._]+$.
  static String? validateUsername(String? value) {
    final text = (value ?? '').trim();
    if (text.isEmpty) return _message('validationUsernameRequired');
    if (text.length < 3) return _message('validationUsernameMinChars');
    if (text.length > 50) return _message('validationUsernameMaxChars');
    if (!RegExp(r'^[a-zA-Z0-9._]+$').hasMatch(text)) {
      return _message('validationUsernameInvalidChars');
    }
    return null;
  }

  /// Mirrors: emailRule — RFC email format, max 255 chars.
  static String? validateEmail(String? value) {
    final text = (value ?? '').trim();
    if (text.isEmpty) return _message('validationEmailRequired');
    if (text.length > 255) return _message('validationEmailTooLong');
    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(text)) {
      return _message('validationEmailInvalidFormat');
    }
    return null;
  }

  /// Mirrors: passwordRule — min 8, max 100, requires uppercase, lowercase,
  /// digit, and special character.
  static String? validatePassword(String? value) {
    final text = value ?? '';
    if (text.isEmpty) return _message('validationPasswordRequired');
    if (text.length < 8) return _message('validationPasswordMinChars');
    if (text.length > 100) return _message('validationPasswordMaxChars');
    if (!RegExp(r'[A-Z]').hasMatch(text)) {
      return _message('validationPasswordNoUppercase');
    }
    if (!RegExp(r'[a-z]').hasMatch(text)) {
      return _message('validationPasswordNoLowercase');
    }
    if (!RegExp(r'[0-9]').hasMatch(text)) {
      return _message('validationPasswordNoNumber');
    }
    if (!RegExp(r'[^a-zA-Z0-9]').hasMatch(text)) {
      return _message('validationPasswordNoSpecialChar');
    }
    return null;
  }

  static String? validatePasswordConfirm(String? value, {String? password}) {
    if ((value ?? '').isEmpty) {
      return _message('validationPasswordConfirmRequired');
    }
    if (value != password) {
      return _message('validationPasswordConfirmMismatch');
    }
    return null;
  }

  /// Mirrors: phoneNumberRule — optional field, regex ^\+\d{7,15}$.
  /// Pass null or empty string to skip (field is optional on the backend).
  static String? validatePhoneNumber(String? value) {
    final text = (value ?? '').trim();
    if (text.isEmpty) return null;
    if (!RegExp(r'^\+\d{7,15}$').hasMatch(text)) {
      return _message('validationPhoneInvalidFormat');
    }
    return null;
  }

  /// Mirrors: birthdateRule — optional field, parses dd/mm/yyyy and checks
  /// that the user is at least 16 years old.
  static String? validateBirthdate(String? value) {
    final text = (value ?? '').trim();
    if (text.isEmpty) return null;
    if (!RegExp(r'^\d{2}/\d{2}/\d{4}$').hasMatch(text)) {
      return _message('validationBirthdateFormat');
    }

    final parts = text.split('/');
    final day = int.tryParse(parts[0]);
    final month = int.tryParse(parts[1]);
    final year = int.tryParse(parts[2]);

    if (day == null || month == null || year == null) {
      return _message('validationBirthdateFormat');
    }

    final birthDate = DateTime.tryParse(
      '$year-${month.toString().padLeft(2, '0')}-${day.toString().padLeft(2, '0')}',
    );
    if (birthDate == null) return _message('validationBirthdateFormat');

    final today = DateTime.now();
    int age = today.year - birthDate.year;
    if (today.month < birthDate.month ||
        (today.month == birthDate.month && today.day < birthDate.day)) {
      age--;
    }

    if (age < 16) return _message('validationBirthdateMinAge');
    return null;
  }

  /// Mirrors: biographyRule — optional field, max 5000 chars, max 500 words.
  static String? validateBiography(String? value) {
    final text = (value ?? '').trim();
    if (text.isEmpty) return null;
    if (text.length > 5000) return _message('validationBiographyMaxChars');
    final wordCount =
        text.split(RegExp(r'\s+')).where((w) => w.isNotEmpty).length;
    if (wordCount > 500) return _message('validationBiographyMaxWords');
    return null;
  }
}
