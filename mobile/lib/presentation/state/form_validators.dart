class FormValidators {
  static String _languageCode = '1';

  static void setLanguageCode(String code) {
    _languageCode = code;
  }

  static String? validateName(String? value) {
    final text = (value ?? '').trim();
    if (text.isEmpty) {
      return 'Name is required.';
    }
    if (text.length < 2) {
      return 'Name must have at least 2 characters.';
    }
    return null;
  }

  static String? validateUsername(String? value) {
    final text = (value ?? '').trim();
    if (text.isEmpty) {
      return 'Username is required.';
    }
    if (text.length < 3) {
      return 'Username must have at least 3 characters.';
    }
    if (!RegExp(r'^[a-zA-Z0-9._]+$').hasMatch(text)) {
      return 'Username can only contain letters, numbers, dots and underscores.';
    }
    return null;
  }

  static String? validateEmail(String? value) {
    final text = (value ?? '').trim();
    if (text.isEmpty) {
      return 'Email is required.';
    }
    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(text)) {
      return 'Invalid email format.';
    }
    return null;
  }

  static String? validatePassword(String? value) {
    final text = value ?? '';
    if (text.isEmpty) {
      return 'Password is required.';
    }
    if (text.length < 8) {
      return 'Password must have at least 8 characters.';
    }
    return null;
  }

  static String? validatePasswordConfirm(String? value, {String? password}) {
    if ((value ?? '').isEmpty) {
      return 'Please confirm your password.';
    }
    if (value != password) {
      return 'Passwords do not match.';
    }
    return null;
  }

  static String? validateBirthdate(String? value) {
    final text = (value ?? '').trim();
    if (text.isEmpty) {
      return null;
    }
    if (!RegExp(r'^\d{2}/\d{2}/\d{4}$').hasMatch(text)) {
      return 'Birthdate must be in dd/mm/yyyy format.';
    }
    return null;
  }

  static String? validateBiography(String? value) {
    final text = (value ?? '').trim();
    if (text.length > 1000) {
      return 'Biography must have at most 1000 characters.';
    }
    return null;
  }
}
