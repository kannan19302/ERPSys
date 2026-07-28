import 'package:flutter/material.dart';

/// Dart mirror of the UniERP design tokens.
///
/// Source of truth: `packages/ui-tokens/src/base.css` (scale, radii, motion) and
/// `packages/ui-tokens/src/themes/{light,dark}.css` (palette). AGENTS.md Rule 5
/// forbids hardcoded hex values and pixel literals in feature code — widgets
/// read from here, and here only. When a token changes on web, change it here
/// in the same commit.
class Spacing {
  const Spacing._();

  static const double x0 = 0;
  static const double x0_5 = 2;
  static const double x1 = 4;
  static const double x1_5 = 6;
  static const double x2 = 8;
  static const double x2_5 = 10;
  static const double x3 = 12;
  static const double x4 = 16;
  static const double x5 = 20;
  static const double x6 = 24;
  static const double x8 = 32;
  static const double x10 = 40;
  static const double x12 = 48;
  static const double x16 = 64;
}

class Radii {
  const Radii._();

  static const double sm = 4;
  static const double md = 6;
  static const double lg = 8;
  static const double xl = 12;
  static const double x2l = 16;
  static const double full = 9999;

  static const BorderRadius card = BorderRadius.all(Radius.circular(xl));
  static const BorderRadius control = BorderRadius.all(Radius.circular(lg));
  static const BorderRadius pill = BorderRadius.all(Radius.circular(full));
}

class TypeScale {
  const TypeScale._();

  static const double xs = 12;
  static const double sm = 14;
  static const double base = 16;
  static const double lg = 18;
  static const double xl = 20;
  static const double x2l = 24;
  static const double x3l = 30;

  static const double leadingTight = 1.25;
  static const double leadingNormal = 1.5;

  static const FontWeight normal = FontWeight.w400;
  static const FontWeight medium = FontWeight.w500;
  static const FontWeight semibold = FontWeight.w600;
  static const FontWeight bold = FontWeight.w700;
}

class Motion {
  const Motion._();

  static const Duration fast = Duration(milliseconds: 100);
  static const Duration normal = Duration(milliseconds: 200);
  static const Duration slow = Duration(milliseconds: 300);
  static const Curve easeDefault = Cubic(0.4, 0, 0.2, 1);
  static const Curve easeOut = Cubic(0, 0, 0.2, 1);
}

/// Semantic palette. Values mirror the `--color-*` custom properties.
class Palette {
  const Palette({
    required this.bg,
    required this.bgElevated,
    required this.bgSunken,
    required this.border,
    required this.borderStrong,
    required this.text,
    required this.textSecondary,
    required this.textTertiary,
    required this.primary,
    required this.primaryHover,
    required this.primaryLight,
    required this.onPrimary,
    required this.success,
    required this.successLight,
    required this.warning,
    required this.warningLight,
    required this.danger,
    required this.dangerLight,
    required this.info,
    required this.infoLight,
  });

  /// `packages/ui-tokens/src/themes/light.css`
  static const Palette light = Palette(
    bg: Color(0xFFFAFBFC),
    bgElevated: Color(0xFFFFFFFF),
    bgSunken: Color(0xFFF1F3F5),
    border: Color(0xFFE2E8F0),
    borderStrong: Color(0xFFCBD5E1),
    text: Color(0xFF1A1A2E),
    textSecondary: Color(0xFF555B67),
    textTertiary: Color(0xFF6B7280),
    primary: Color(0xFF6366F1),
    primaryHover: Color(0xFF5457E5),
    primaryLight: Color(0xFFEEF2FF),
    onPrimary: Color(0xFFFFFFFF),
    success: Color(0xFF10B981),
    successLight: Color(0xFFECFDF5),
    warning: Color(0xFFF59E0B),
    warningLight: Color(0xFFFFFBEB),
    danger: Color(0xFFF43F5E),
    dangerLight: Color(0xFFFFF1F2),
    info: Color(0xFF0EA5E9),
    infoLight: Color(0xFFF0F9FF),
  );

  /// `packages/ui-tokens/src/themes/dark.css`
  static const Palette dark = Palette(
    bg: Color(0xFF0F1117),
    bgElevated: Color(0xFF1A1B2E),
    bgSunken: Color(0xFF0A0B12),
    border: Color(0xFF2D2F4A),
    borderStrong: Color(0xFF3D3F5A),
    text: Color(0xFFE8E8F0),
    textSecondary: Color(0xFF9CA3AF),
    textTertiary: Color(0xFF7D8494),
    primary: Color(0xFF818CF8),
    primaryHover: Color(0xFF6E7BF2),
    primaryLight: Color(0xFF232544),
    onPrimary: Color(0xFF0F1117),
    success: Color(0xFF34D399),
    successLight: Color(0xFF14301F),
    warning: Color(0xFFFBBF24),
    warningLight: Color(0xFF3A2E10),
    danger: Color(0xFFFB7185),
    dangerLight: Color(0xFF3A1620),
    info: Color(0xFF38BDF8),
    infoLight: Color(0xFF0E2B3D),
  );

  final Color bg;
  final Color bgElevated;
  final Color bgSunken;
  final Color border;
  final Color borderStrong;
  final Color text;
  final Color textSecondary;
  final Color textTertiary;
  final Color primary;
  final Color primaryHover;
  final Color primaryLight;
  final Color onPrimary;
  final Color success;
  final Color successLight;
  final Color warning;
  final Color warningLight;
  final Color danger;
  final Color dangerLight;
  final Color info;
  final Color infoLight;
}

/// Exposes the palette to widgets via `Theme.of(context).extension<UiTokens>()`.
class UiTokens extends ThemeExtension<UiTokens> {
  const UiTokens({required this.palette});

  final Palette palette;

  @override
  UiTokens copyWith({Palette? palette}) =>
      UiTokens(palette: palette ?? this.palette);

  @override
  UiTokens lerp(ThemeExtension<UiTokens>? other, double t) =>
      other is UiTokens && t >= 0.5 ? other : this;
}

extension UiTokensContext on BuildContext {
  /// Shorthand: `context.tokens.primary`.
  Palette get tokens =>
      Theme.of(this).extension<UiTokens>()?.palette ?? Palette.light;
}
