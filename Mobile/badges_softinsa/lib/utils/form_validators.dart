class FormValidators {
  static final RegExp _emailRegex = RegExp(
    r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
  );
  static final RegExp _usernameRegex = RegExp(r'^[a-zA-Z0-9._]+$');

  // Validação de email
  static String? validateEmail(String? value) {
    final sanitized = (value ?? '').replaceAll(RegExp(r'\s+'), '');

    if (sanitized.isEmpty) {
      return 'O email é obrigatório';
    }

    if (sanitized.length > 255) {
      return 'O email deve ter no máximo 255 caracteres';
    }

    if (!_emailRegex.hasMatch(sanitized)) {
      return 'Por favor, insira um email válido';
    }

    return null;
  }

  // Validação de password
  static String? validatePassword(String? value) {
    final password = value ?? '';

    if (password.isEmpty) {
      return 'A password é obrigatória';
    }

    if (password.length < 8) {
      return 'A password deve ter no mínimo 8 caracteres';
    }

    if (password.length > 100) {
      return 'A password deve ter no máximo 100 caracteres';
    }

    if (!RegExp(r'[A-Z]').hasMatch(password)) {
      return 'A password deve conter pelo menos 1 letra maiúscula';
    }

    if (!RegExp(r'[a-z]').hasMatch(password)) {
      return 'A password deve conter pelo menos 1 letra minúscula';
    }

    if (!RegExp(r'[0-9]').hasMatch(password)) {
      return 'A password deve conter pelo menos 1 número';
    }

    if (!RegExp(r'[^a-zA-Z0-9]').hasMatch(password)) {
      return 'A password deve conter pelo menos 1 caractere especial';
    }

    return null;
  }

  // Validação de confirmação de password
  static String? validatePasswordConfirm(String? value, String password) {
    if (value == null || value.isEmpty) {
      return 'Por favor, confirme a password';
    }

    if (value != password) {
      return 'As passwords não coincidem';
    }

    return null;
  }

  // Validação de nome
  static String? validateName(String? value) {
    final name = (value ?? '').trim();

    if (name.isEmpty) {
      return 'O nome é obrigatório';
    }

    if (name.length < 2) {
      return 'O nome deve ter pelo menos 2 caracteres';
    }

    if (name.length > 255) {
      return 'O nome deve ter no máximo 255 caracteres';
    }

    return null;
  }

  // Validação de username
  static String? validateUsername(String? value) {
    final username = (value ?? '').trim();

    if (username.isEmpty) {
      return 'Username é obrigatório';
    }

    if (username.length < 3) {
      return 'Username deve ter no mínimo 3 caracteres';
    }

    if (username.length > 50) {
      return 'Username deve ter no máximo 50 caracteres';
    }

    if (!_usernameRegex.hasMatch(username)) {
      return 'Username só pode conter letras, números, ponto e underscore';
    }

    return null;
  }

  // Validação de biografia (campo opcional)
  static String? validateBiography(String? value) {
    final biography = (value ?? '').trim();
    if (biography.isEmpty) {
      return null;
    }

    if (biography.length > 5000) {
      return 'Biografia deve ter no máximo 5000 caracteres';
    }

    final words = biography.split(RegExp(r'\s+')).where((w) => w.isNotEmpty);
    if (words.length > 500) {
      return 'Biografia não pode exceder 500 palavras';
    }

    if (filter.check(biography)) {
      return 'Biografia contém linguagem inapropriada';
    }

    return null;
  }

  // Validação de data de nascimento (obrigatória, mínimo 16 anos)
  static String? validateBirthdate(String? value) {
    final birthdateText = (value ?? '').trim();

    if (birthdateText.isEmpty) {
      return 'A data de nascimento é obrigatória';
    }

    final dateRegex = RegExp(r'^\d{2}/\d{2}/\d{4}$');
    if (!dateRegex.hasMatch(birthdateText)) {
      return 'Data de nascimento inválida';
    }

    final parts = birthdateText.split('/');
    final day = int.tryParse(parts[0]);
    final month = int.tryParse(parts[1]);
    final year = int.tryParse(parts[2]);

    if (day == null || month == null || year == null) {
      return 'Data de nascimento inválida';
    }

    DateTime birthdate;
    try {
      birthdate = DateTime(year, month, day);
    } catch (_) {
      return 'Data de nascimento inválida';
    }

    if (birthdate.year != year ||
        birthdate.month != month ||
        birthdate.day != day) {
      return 'Data de nascimento inválida';
    }

    final now = DateTime.now();
    var age = now.year - birthdate.year;
    final hasHadBirthdayThisYear =
        now.month > birthdate.month ||
        (now.month == birthdate.month && now.day >= birthdate.day);

    if (!hasHadBirthdayThisYear) {
      age -= 1;
    }

    if (age < 16) {
      return 'Tens de ter pelo menos 16 anos';
    }

    return null;
  }

  // Validação genérica
  static String? validateRequired(String? value, String fieldName) {
    if (value == null || value.isEmpty) {
      return '$fieldName é obrigatório';
    }
    return null;
  }
}

class _SimpleContentFilter {
  final List<String> _blockedTerms = const ['palavrao1', 'palavrao2'];

  bool check(String val) {
    final lower = val.toLowerCase();
    return _blockedTerms.any((term) => lower.contains(term));
  }
}

final filter = _SimpleContentFilter();
