class FormValidators {
  static String _languageCode = 'pt';
  static String Function(String key)? _translator;

  static const Map<String, Map<String, String>> _fallbackMessages = {
    'en': {
      'validationNameRequired': 'Name is required.',
      'validationNameMinChars': 'Name must have at least 2 characters.',
      'validationUsernameRequired': 'Username is required.',
      'validationUsernameMinChars': 'Username must have at least 3 characters.',
      'validationUsernameInvalidChars':
          'Username can only contain letters, numbers, dots and underscores.',
      'validationEmailRequired': 'Email is required.',
      'validationEmailInvalidFormat': 'Invalid email format.',
      'validationPasswordRequired': 'Password is required.',
      'validationPasswordMinChars':
          'Password must have at least 8 characters.',
      'validationPasswordConfirmRequired': 'Please confirm your password.',
      'validationPasswordConfirmMismatch': 'Passwords do not match.',
      'validationBirthdateFormat':
          'Birthdate must be in dd/mm/yyyy format.',
      'validationBiographyMaxChars':
          'Biography must have at most 1000 characters.',
    },
    'pt': {
      'validationNameRequired': 'Nome e obrigatorio.',
      'validationNameMinChars': 'O nome deve ter pelo menos 2 caracteres.',
      'validationUsernameRequired': 'Username e obrigatorio.',
      'validationUsernameMinChars':
          'O username deve ter pelo menos 3 caracteres.',
      'validationUsernameInvalidChars':
          'O username so pode conter letras, numeros, pontos e underscores.',
      'validationEmailRequired': 'Email e obrigatorio.',
      'validationEmailInvalidFormat': 'Formato de email invalido.',
      'validationPasswordRequired': 'Password e obrigatoria.',
      'validationPasswordMinChars':
          'A password deve ter pelo menos 8 caracteres.',
      'validationPasswordConfirmRequired': 'Confirma a password.',
      'validationPasswordConfirmMismatch': 'As passwords nao coincidem.',
      'validationBirthdateFormat':
          'A data deve estar no formato dd/mm/yyyy.',
      'validationBiographyMaxChars':
          'A biografia deve ter no maximo 1000 caracteres.',
    },
    'es': {
      'validationNameRequired': 'El nombre es obligatorio.',
      'validationNameMinChars':
          'El nombre debe tener al menos 2 caracteres.',
      'validationUsernameRequired': 'El usuario es obligatorio.',
      'validationUsernameMinChars':
          'El usuario debe tener al menos 3 caracteres.',
      'validationUsernameInvalidChars':
          'El usuario solo puede contener letras, numeros, puntos y guiones bajos.',
      'validationEmailRequired': 'El correo es obligatorio.',
      'validationEmailInvalidFormat': 'Formato de correo invalido.',
      'validationPasswordRequired': 'La contrasena es obligatoria.',
      'validationPasswordMinChars':
          'La contrasena debe tener al menos 8 caracteres.',
      'validationPasswordConfirmRequired': 'Confirma tu contrasena.',
      'validationPasswordConfirmMismatch':
          'Las contrasenas no coinciden.',
      'validationBirthdateFormat':
          'La fecha debe estar en formato dd/mm/yyyy.',
      'validationBiographyMaxChars':
          'La biografia debe tener como maximo 1000 caracteres.',
    },
    'fr': {
      'validationNameRequired': 'Le nom est requis.',
      'validationNameMinChars':
          'Le nom doit contenir au moins 2 caracteres.',
      'validationUsernameRequired': "Le nom d'utilisateur est requis.",
      'validationUsernameMinChars':
          "Le nom d'utilisateur doit contenir au moins 3 caracteres.",
      'validationUsernameInvalidChars':
          "Le nom d'utilisateur ne peut contenir que des lettres, des chiffres, des points et des underscores.",
      'validationEmailRequired': "L'email est requis.",
      'validationEmailInvalidFormat': "Format d'email invalide.",
      'validationPasswordRequired': 'Le mot de passe est requis.',
      'validationPasswordMinChars':
          'Le mot de passe doit contenir au moins 8 caracteres.',
      'validationPasswordConfirmRequired':
          'Confirmez votre mot de passe.',
      'validationPasswordConfirmMismatch':
          'Les mots de passe ne correspondent pas.',
      'validationBirthdateFormat':
          'La date doit etre au format dd/mm/yyyy.',
      'validationBiographyMaxChars':
          'La biographie doit contenir au maximum 1000 caracteres.',
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
      '4' || 'fr' => 'fr',
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

  static String? validateName(String? value) {
    final text = (value ?? '').trim();
    if (text.isEmpty) {
      return _message('validationNameRequired');
    }
    if (text.length < 2) {
      return _message('validationNameMinChars');
    }
    return null;
  }

  static String? validateUsername(String? value) {
    final text = (value ?? '').trim();
    if (text.isEmpty) {
      return _message('validationUsernameRequired');
    }
    if (text.length < 3) {
      return _message('validationUsernameMinChars');
    }
    if (!RegExp(r'^[a-zA-Z0-9._]+$').hasMatch(text)) {
      return _message('validationUsernameInvalidChars');
    }
    return null;
  }

  static String? validateEmail(String? value) {
    final text = (value ?? '').trim();
    if (text.isEmpty) {
      return _message('validationEmailRequired');
    }
    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(text)) {
      return _message('validationEmailInvalidFormat');
    }
    return null;
  }

  static String? validatePassword(String? value) {
    final text = value ?? '';
    if (text.isEmpty) {
      return _message('validationPasswordRequired');
    }
    if (text.length < 8) {
      return _message('validationPasswordMinChars');
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

  static String? validateBirthdate(String? value) {
    final text = (value ?? '').trim();
    if (text.isEmpty) {
      return null;
    }
    if (!RegExp(r'^\d{2}/\d{2}/\d{4}$').hasMatch(text)) {
      return _message('validationBirthdateFormat');
    }
    return null;
  }

  static String? validateBiography(String? value) {
    final text = (value ?? '').trim();
    if (text.length > 1000) {
      return _message('validationBiographyMaxChars');
    }
    return null;
  }
}
