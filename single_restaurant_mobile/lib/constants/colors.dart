import 'package:flutter/material.dart';

/// Centralized color palette for Bhatura & Co customer app.
/// Matches the authentic royal Amritsari & North Indian culinary identity
/// of the Bhatura & Co website with rich crimson red, vibrant saffron orange,
/// warm amber gold, and luxury warm cream culinary surfaces.
class AppColors {
  // Signature Brand Colors (Bhatura & Co)
  static const Color primary = Color(0xFF8B1E1E); // Signature Amritsari Crimson Red
  static const Color primaryLight = Color(0xFFA61922); // Vibrant Red
  static const Color primaryDark = Color(0xFF5C0612); // Deep Royal Burgundy

  static const Color secondary = Color(0xFFF26522); // Vibrant Saffron Orange
  static const Color secondaryDark = Color(0xFFE65100); // Deep Saffron / Amber

  static const Color gold = Color(0xFFD4AF37); // Royal Gold
  static const Color goldLight = Color(0xFFF5B53D); // Warm Golden Amber

  // Extended Brand Accents
  static const Color accent = Color(0xFF8B1E1E); // Primary Crimson Accent
  static const Color brandRed = Color(0xFF8B1E1E); // Brand Red
  static const Color brandOrange = Color(0xFFF26522); // Brand Saffron Orange
  static const Color brandGold = Color(0xFFD4AF37); // Brand Gold

  // Warm Culinary Surfaces (Matches Website #FAF3E8 / #FDF8EE)
  static const Color background = Color(0xFFFAF3E8); // Warm Royal Cream
  static const Color creamBackground = Color(0xFFFAF3E8); // Warm Cream
  static const Color surface = Color(0xFFFFFFFF); // Clean Crisp White Surface
  static const Color surfaceMuted = Color(0xFFF6EDE0); // Tinted Cream Container
  static const Color cardSurface = Color(0xFFFFFDF9); // Crisp Ivory Card

  // Typography Tokens
  static const Color textDark = Color(0xFF1C1917); // Dark Stone / Espresso
  static const Color textLight = Color(0xFF6B5E53); // Warm Earth Brown
  static const Color textMuted = Color(0xFF8C7E72); // Caption Brown
  static const Color textWhite = Color(0xFFFFFFFF);

  // Border & Divider Tokens
  static const Color border = Color(0xFFEAE0D3); // Warm Natural Border
  static const Color borderSubtle = Color(0xFFF2EAE0); // Subtle Warm Border
  static const Color divider = Color(0xFFEDE0CE); // Warm Divider
  static const Color cardShadow = Color(0x145C0612); // 8% Burgundy Tinted Shadow

  // Tints & Soft Pill Backgrounds
  static const Color badgeRedBg = Color(0xFFFCEAE6); // Soft Crimson Tint
  static const Color badgeOrangeBg = Color(0xFFFEF3EC); // Soft Saffron Tint
  static const Color badgeGoldBg = Color(0xFFFFF9ED); // Soft Gold Tint

  // Semantic Feedback Tokens
  static const Color success = Color(0xFF16A34A);
  static const Color successLight = Color(0xFFF0FDF4);
  static const Color successBorder = Color(0xFFBBF7D0);

  static const Color warning = Color(0xFFD97706);
  static const Color warningLight = Color(0xFFFFFBEB);
  static const Color warningBorder = Color(0xFFFDE68A);

  static const Color error = Color(0xFFDC2626);
  static const Color errorLight = Color(0xFFFEF2F2);
  static const Color errorBorder = Color(0xFFFECACA);

  static const Color info = Color(0xFF2563EB);
  static const Color infoLight = Color(0xFFEFF6FF);
  static const Color infoBorder = Color(0xFFBFDBFE);

  // Dark Mode Tokens
  static const Color darkBackground = Color(0xFF1A0D07); // Dark Smoky Espresso
  static const Color darkSurface = Color(0xFF26150E); // Deep Card Surface
  static const Color darkCard = Color(0xFF2D1911);
  static const Color darkBorder = Color(0xFF42261C);
  static const Color darkTextPrimary = Color(0xFFFAF3E8);
  static const Color darkTextSecondary = Color(0xFFB5A496);
  static const Color darkDivider = Color(0xFF381F16);

  // Context-aware theme resolution helpers
  static bool isDark(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark;

  static Color resolveBackground(BuildContext context) =>
      isDark(context) ? darkBackground : background;

  static Color resolveSurface(BuildContext context) =>
      isDark(context) ? darkSurface : surface;

  static Color resolveText(BuildContext context) =>
      isDark(context) ? darkTextPrimary : textDark;

  static Color resolveTextMuted(BuildContext context) =>
      isDark(context) ? darkTextSecondary : textLight;

  static Color resolveBorder(BuildContext context) =>
      isDark(context) ? darkBorder : border;
}
