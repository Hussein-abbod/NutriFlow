import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

/// NutriFlow design system — Material 3 theme with clean, flat aesthetic.
///
/// Light & Dark themes with curated color palette matching the reference design.
/// Flat or lightly elevated Material Design components with restrained shadows.
class NutriFlowTheme {
  NutriFlowTheme._();

  // ──── Brand Colors (Reference Design Aligned) ────
  static const Color primary = Color(0xFF006D36);
  static const Color primaryContainer = Color(0xFF4ADE80);
  static const Color onPrimaryContainer = Color(0xFF005E2D);
  static const Color tertiary = Color(0xFF005AC2);
  static const Color onTertiaryContainer = Color(0xFF004DA8);
  static const Color error = Color(0xFFBA1A1A);

  // Legacy aliases (kept for backward compat, mapped to new palette)
  static const Color emerald = primary;
  static const Color emeraldDark = Color(0xFF005E2D);
  static const Color teal = Color(0xFF00BFA5);
  static const Color coral = Color(0xFFBA1A1A);
  static const Color coralLight = Color(0xFFFF8A80);
  static const Color purple = Color(0xFF005AC2);
  static const Color blue = Color(0xFF448AFF);

  // ──── Light Mode Colors (Reference Design) ────
  static const Color _lightBackground = Color(0xFFF8F9FF);
  static const Color _lightSurface = Color(0xFFFFFFFF);
  static const Color _lightSurfaceContainerHigh = Color(0xFFDEE9FC);
  static const Color _lightText = Color(0xFF121C2A);
  static const Color _lightTextSecondary = Color(0xFF6B7280);
  static const Color _lightOutline = Color(0xFF6D7B6D);
  static const Color _lightOutlineVariant = Color(0xFFBCCABB);
  static const Color _lightSurfaceVariant = Color(0xFFD9E3F6);

  // ──── Dark Mode Colors ────
  static const Color _darkBackground = Color(0xFF121218);
  static const Color _darkSurface = Color(0xFF1E1E2E);
  static const Color _darkSurfaceVariant = Color(0xFF2A2A3C);
  static const Color _darkText = Color(0xFFE8E8F0);
  static const Color _darkTextSecondary = Color(0xFF9CA3AF);
  static const Color _darkPrimary = Color(0xFF4DE082);

  // ──── Gradients ────
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [primary, Color(0xFF00956A)],
  );

  static const LinearGradient darkPrimaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF4DE082), Color(0xFF1DE9B6)],
  );

  static const LinearGradient accentGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF005AC2), Color(0xFF004395)],
  );

  static const LinearGradient coralGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFBA1A1A), Color(0xFFE53935)],
  );

  static const LinearGradient splashGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFF005E2D), Color(0xFF006D36)],
  );

  // ──── Text Theme Builder (Inter font) ────
  static TextTheme _textTheme(Color bodyColor) {
    return GoogleFonts.interTextTheme().copyWith(
      displayLarge: GoogleFonts.inter(fontSize: 57, fontWeight: FontWeight.w700, color: bodyColor, letterSpacing: -0.5),
      displayMedium: GoogleFonts.inter(fontSize: 45, fontWeight: FontWeight.w700, color: bodyColor, letterSpacing: -0.25),
      displaySmall: GoogleFonts.inter(fontSize: 36, fontWeight: FontWeight.w600, color: bodyColor),
      headlineLarge: GoogleFonts.inter(fontSize: 32, fontWeight: FontWeight.w700, color: bodyColor),
      headlineMedium: GoogleFonts.inter(fontSize: 28, fontWeight: FontWeight.w600, color: bodyColor),
      headlineSmall: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.w600, color: bodyColor),
      titleLarge: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.w600, color: bodyColor),
      titleMedium: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600, color: bodyColor),
      titleSmall: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: bodyColor),
      bodyLarge: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w400, color: bodyColor, height: 1.5),
      bodyMedium: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w400, color: bodyColor, height: 1.5),
      bodySmall: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w400, color: bodyColor, height: 1.4),
      labelLarge: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: bodyColor, letterSpacing: 0.5),
      labelMedium: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w500, color: bodyColor),
      labelSmall: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w500, color: bodyColor),
    );
  }

  // ──── Shared Button Style (flat, no glow) ────
  static ButtonStyle _elevatedButtonStyle(Color bg, Color fg) {
    return ElevatedButton.styleFrom(
      backgroundColor: bg,
      foregroundColor: fg,
      padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 16),
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      textStyle: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600),
    );
  }

  static ButtonStyle _outlinedButtonStyle(Color fg) {
    return OutlinedButton.styleFrom(
      foregroundColor: fg,
      side: BorderSide(color: fg.withOpacity(0.4), width: 1.5),
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      textStyle: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600),
    );
  }

  static InputDecorationTheme _inputTheme(Color fill, Color border, Color focus, Color errorColor) {
    return InputDecorationTheme(
      filled: true,
      fillColor: fill,
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: border)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: border)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: focus, width: 2)),
      errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: errorColor)),
      focusedErrorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: errorColor, width: 2)),
    );
  }

  // ════════════════════════════════════════════════════
  //  LIGHT THEME
  // ════════════════════════════════════════════════════
  static ThemeData get lightTheme {
    final colorScheme = ColorScheme(
      brightness: Brightness.light,
      primary: primary,
      onPrimary: Colors.white,
      primaryContainer: primaryContainer,
      onPrimaryContainer: onPrimaryContainer,
      secondary: const Color(0xFF55615A),
      onSecondary: Colors.white,
      secondaryContainer: const Color(0xFFD9E6DD),
      onSecondaryContainer: const Color(0xFF5B6760),
      tertiary: tertiary,
      onTertiary: Colors.white,
      surface: _lightSurface,
      onSurface: _lightText,
      surfaceContainerHighest: _lightSurfaceContainerHigh,
      error: error,
      onError: Colors.white,
      outline: _lightOutline,
      outlineVariant: _lightOutlineVariant,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      brightness: Brightness.light,
      scaffoldBackgroundColor: _lightBackground,
      textTheme: _textTheme(_lightText),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        foregroundColor: _lightText,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: true,
        systemOverlayStyle: SystemUiOverlayStyle.dark,
        titleTextStyle: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w700, color: _lightText),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: _elevatedButtonStyle(primary, Colors.white),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: _outlinedButtonStyle(primary),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primary,
          textStyle: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600),
        ),
      ),
      inputDecorationTheme: _inputTheme(
        _lightSurface,
        _lightOutlineVariant,
        primary,
        error,
      ),
      cardTheme: CardThemeData(
        color: _lightSurface,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        surfaceTintColor: Colors.transparent,
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: primary,
        foregroundColor: Colors.white,
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: _lightSurface,
        selectedItemColor: primary,
        unselectedItemColor: _lightTextSecondary,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
      ),
      chipTheme: ChipThemeData(
        backgroundColor: const Color(0xFFF0F2F5),
        selectedColor: primary,
        labelStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        side: BorderSide.none,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      ),
      dividerTheme: const DividerThemeData(color: _lightSurfaceVariant, thickness: 1),
      sliderTheme: SliderThemeData(
        activeTrackColor: primary,
        inactiveTrackColor: primary.withOpacity(0.15),
        thumbColor: primary,
        overlayColor: primary.withOpacity(0.12),
        trackHeight: 6,
        thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 8),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: _lightSurface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: _lightText,
        contentTextStyle: GoogleFonts.inter(color: Colors.white, fontSize: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        behavior: SnackBarBehavior.floating,
      ),
      pageTransitionsTheme: PageTransitionsTheme(
        builders: <TargetPlatform, PageTransitionsBuilder>{
          TargetPlatform.android: const CupertinoPageTransitionsBuilder(),
          TargetPlatform.iOS: const CupertinoPageTransitionsBuilder(),
        },
      ),
    );
  }

  // ════════════════════════════════════════════════════
  //  DARK THEME
  // ════════════════════════════════════════════════════
  static ThemeData get darkTheme {
    final colorScheme = ColorScheme(
      brightness: Brightness.dark,
      primary: _darkPrimary,
      onPrimary: Colors.black,
      primaryContainer: const Color(0xFF003300),
      onPrimaryContainer: _darkPrimary,
      secondary: coralLight,
      onSecondary: Colors.black,
      secondaryContainer: coralLight.withOpacity(0.15),
      onSecondaryContainer: coralLight,
      tertiary: const Color(0xFFADC6FF),
      onTertiary: Colors.black,
      surface: _darkSurface,
      onSurface: _darkText,
      surfaceContainerHighest: _darkSurfaceVariant,
      error: const Color(0xFFFF5252),
      onError: Colors.black,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: _darkBackground,
      textTheme: _textTheme(_darkText),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        foregroundColor: _darkText,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: true,
        systemOverlayStyle: SystemUiOverlayStyle.light,
        titleTextStyle: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w700, color: _darkText),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: _elevatedButtonStyle(_darkPrimary, Colors.black),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: _outlinedButtonStyle(_darkPrimary),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: _darkPrimary,
          textStyle: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600),
        ),
      ),
      inputDecorationTheme: _inputTheme(
        _darkSurfaceVariant,
        const Color(0xFF3A3A4C),
        _darkPrimary,
        const Color(0xFFFF5252),
      ),
      cardTheme: CardThemeData(
        color: _darkSurface,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        surfaceTintColor: Colors.transparent,
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: _darkPrimary,
        foregroundColor: Colors.black,
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: _darkSurface,
        selectedItemColor: _darkPrimary,
        unselectedItemColor: _darkTextSecondary,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
      ),
      chipTheme: ChipThemeData(
        backgroundColor: _darkSurfaceVariant,
        selectedColor: _darkPrimary,
        labelStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500, color: _darkText),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        side: BorderSide.none,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      ),
      dividerTheme: DividerThemeData(color: Colors.white.withOpacity(0.08), thickness: 1),
      sliderTheme: SliderThemeData(
        activeTrackColor: _darkPrimary,
        inactiveTrackColor: _darkPrimary.withOpacity(0.15),
        thumbColor: _darkPrimary,
        overlayColor: _darkPrimary.withOpacity(0.12),
        trackHeight: 6,
        thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 8),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: _darkSurface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: _darkSurfaceVariant,
        contentTextStyle: GoogleFonts.inter(color: _darkText, fontSize: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        behavior: SnackBarBehavior.floating,
      ),
      pageTransitionsTheme: PageTransitionsTheme(
        builders: <TargetPlatform, PageTransitionsBuilder>{
          TargetPlatform.android: const CupertinoPageTransitionsBuilder(),
          TargetPlatform.iOS: const CupertinoPageTransitionsBuilder(),
        },
      ),
    );
  }

  // ──── Utility Helpers ────

  /// Returns the primary gradient based on current brightness.
  static LinearGradient gradient(BuildContext context) {
    return Theme.of(context).brightness == Brightness.dark
        ? darkPrimaryGradient
        : primaryGradient;
  }

  /// Surface color for cards/sheets that adapts to theme.
  static Color surfaceColor(BuildContext context) {
    return Theme.of(context).brightness == Brightness.dark
        ? _darkSurface
        : _lightSurface;
  }

  /// Secondary text color.
  static Color secondaryText(BuildContext context) {
    return Theme.of(context).brightness == Brightness.dark
        ? _darkTextSecondary
        : _lightTextSecondary;
  }

  /// Background for cards with slight differentiation.
  static Color cardBackground(BuildContext context) {
    return Theme.of(context).brightness == Brightness.dark
        ? _darkSurfaceVariant
        : _lightSurface;
  }

  /// Outline variant color for card borders.
  static Color outlineVariant(BuildContext context) {
    return Theme.of(context).brightness == Brightness.dark
        ? Colors.white.withOpacity(0.08)
        : _lightOutlineVariant.withOpacity(0.3);
  }
}
