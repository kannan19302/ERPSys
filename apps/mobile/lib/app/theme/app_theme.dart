import 'package:flutter/material.dart';

import 'design_tokens.dart';

/// Builds Material 3 themes entirely from [Palette] tokens, so the mobile app
/// and the web design system stay visually identical without hardcoding a
/// single colour or pixel value in feature code (AGENTS.md Rule 5).
class AppTheme {
  const AppTheme._();

  static ThemeData light() => _build(Palette.light, Brightness.light);

  static ThemeData dark() => _build(Palette.dark, Brightness.dark);

  static ThemeData _build(Palette p, Brightness brightness) {
    final ColorScheme scheme = ColorScheme(
      brightness: brightness,
      primary: p.primary,
      onPrimary: p.onPrimary,
      primaryContainer: p.primaryLight,
      onPrimaryContainer: p.primary,
      secondary: p.info,
      onSecondary: p.onPrimary,
      error: p.danger,
      onError: p.onPrimary,
      errorContainer: p.dangerLight,
      onErrorContainer: p.danger,
      surface: p.bgElevated,
      onSurface: p.text,
      surfaceContainerLowest: p.bgSunken,
      surfaceContainer: p.bg,
      onSurfaceVariant: p.textSecondary,
      outline: p.border,
      outlineVariant: p.borderStrong,
    );

    final TextTheme text = TextTheme(
      displaySmall: TextStyle(
        fontSize: TypeScale.x3l,
        fontWeight: TypeScale.bold,
        height: TypeScale.leadingTight,
        color: p.text,
      ),
      headlineSmall: TextStyle(
        fontSize: TypeScale.x2l,
        fontWeight: TypeScale.semibold,
        height: TypeScale.leadingTight,
        color: p.text,
      ),
      titleLarge: TextStyle(
        fontSize: TypeScale.xl,
        fontWeight: TypeScale.semibold,
        color: p.text,
      ),
      titleMedium: TextStyle(
        fontSize: TypeScale.lg,
        fontWeight: TypeScale.medium,
        color: p.text,
      ),
      bodyLarge: TextStyle(
        fontSize: TypeScale.base,
        height: TypeScale.leadingNormal,
        color: p.text,
      ),
      bodyMedium: TextStyle(
        fontSize: TypeScale.sm,
        height: TypeScale.leadingNormal,
        color: p.text,
      ),
      bodySmall: TextStyle(
        fontSize: TypeScale.xs,
        height: TypeScale.leadingNormal,
        color: p.textSecondary,
      ),
      labelLarge: TextStyle(
        fontSize: TypeScale.sm,
        fontWeight: TypeScale.medium,
        color: p.text,
      ),
    );

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: scheme,
      scaffoldBackgroundColor: p.bg,
      canvasColor: p.bg,
      textTheme: text,
      // Soft borders, no heavy shadows — the design system's HCI guidance.
      cardTheme: CardThemeData(
        color: p.bgElevated,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: Radii.card,
          side: BorderSide(color: p.border),
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: p.bgElevated,
        foregroundColor: p.text,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: text.titleLarge,
        shape: Border(bottom: BorderSide(color: p.border)),
      ),
      dividerTheme: DividerThemeData(color: p.border, space: 1, thickness: 1),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: p.bgElevated,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: Spacing.x3,
          vertical: Spacing.x3,
        ),
        border: OutlineInputBorder(
          borderRadius: Radii.control,
          borderSide: BorderSide(color: p.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: Radii.control,
          borderSide: BorderSide(color: p.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: Radii.control,
          borderSide: BorderSide(color: p.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: Radii.control,
          borderSide: BorderSide(color: p.danger),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: Radii.control,
          borderSide: BorderSide(color: p.danger, width: 2),
        ),
        labelStyle: TextStyle(color: p.textSecondary),
        hintStyle: TextStyle(color: p.textTertiary),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: p.primary,
          foregroundColor: p.onPrimary,
          // Fitts's Law: a comfortable, thumb-reachable target.
          minimumSize: const Size.fromHeight(48),
          shape: const RoundedRectangleBorder(borderRadius: Radii.control),
          textStyle: text.labelLarge,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: p.text,
          minimumSize: const Size.fromHeight(48),
          side: BorderSide(color: p.border),
          shape: const RoundedRectangleBorder(borderRadius: Radii.control),
          textStyle: text.labelLarge,
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(foregroundColor: p.primary),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: p.bgSunken,
        side: BorderSide(color: p.border),
        shape: const RoundedRectangleBorder(borderRadius: Radii.pill),
        labelStyle: text.bodySmall,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: p.bgElevated,
        indicatorColor: p.primaryLight,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        labelTextStyle: WidgetStatePropertyAll<TextStyle>(
          TextStyle(fontSize: TypeScale.xs, color: p.textSecondary),
        ),
      ),
      listTileTheme: ListTileThemeData(
        iconColor: p.textSecondary,
        contentPadding: const EdgeInsets.symmetric(horizontal: Spacing.x4),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: p.text,
        contentTextStyle: TextStyle(color: p.bgElevated),
        behavior: SnackBarBehavior.floating,
        shape: const RoundedRectangleBorder(borderRadius: Radii.control),
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(color: p.primary),
      extensions: <ThemeExtension<dynamic>>[UiTokens(palette: p)],
    );
  }
}
