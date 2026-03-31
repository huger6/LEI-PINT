import 'package:flutter/material.dart';

class AppTheme {
  // Cores principais
  static const Color primary = Color(0xFF00BCD4);
  static const Color primaryDarkCyan = Color(0xFF0097A7);
  static const Color white = Color(0xFFFFFFFF);
  static const Color lightGray = Color(0xFFF5F5F5);
  static const Color mediumGray = Color(0xFFBDBDBD);
  static const Color darkGray = Color(0xFF616161);
  static const Color errorRed = Color(0xFFE53935);
  static const Color successGreen = Color(0xFF4CAF50);

  // Modo claro
  static ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    primaryColor: primary,
    scaffoldBackgroundColor: white,
    appBarTheme: const AppBarTheme(
      backgroundColor: white,
      elevation: 0,
      centerTitle: true,
      titleTextStyle: TextStyle(
        color: darkGray,
        fontSize: 20,
        fontWeight: FontWeight.bold,
      ),
      iconTheme: IconThemeData(color: darkGray),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: lightGray,
      hintStyle: const TextStyle(color: mediumGray),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: lightGray),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: lightGray),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: primary, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: errorRed),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: errorRed, width: 2),
      ),
      prefixIconColor: WidgetStateColor.resolveWith((states) {
        if (states.contains(WidgetState.focused)) {
          return primary;
        }
        return mediumGray;
      }),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primary,
        foregroundColor: white,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        elevation: 4,
      ),
    ),
    textTheme: const TextTheme(
      headlineLarge: TextStyle(
        color: darkGray,
        fontSize: 28,
        fontWeight: FontWeight.bold,
      ),
      headlineMedium: TextStyle(
        color: darkGray,
        fontSize: 22,
        fontWeight: FontWeight.bold,
      ),
      bodyLarge: TextStyle(
        color: darkGray,
        fontSize: 16,
      ),
      bodyMedium: TextStyle(
        color: mediumGray,
        fontSize: 14,
      ),
      labelLarge: TextStyle(
        color: white,
        fontSize: 16,
        fontWeight: FontWeight.w600,
      ),
    ),
  );
}
