import 'package:flutter/material.dart';

import '../../app/theme/design_tokens.dart';

/// Mobile counterpart of the design system's `.ui-card` utility class.
/// Soft border, no drop shadow, token-driven radius and padding.
class UiCard extends StatelessWidget {
  const UiCard({
    required this.child,
    this.padding = const EdgeInsets.all(Spacing.x4),
    this.onTap,
    super.key,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    final Widget content = Padding(padding: padding, child: child);

    return Material(
      color: t.bgElevated,
      borderRadius: Radii.card,
      child: InkWell(
        onTap: onTap,
        borderRadius: Radii.card,
        child: Ink(
          decoration: BoxDecoration(
            borderRadius: Radii.card,
            border: Border.all(color: t.border),
          ),
          child: content,
        ),
      ),
    );
  }
}

/// Section heading used above a group of cards.
class UiSectionHeader extends StatelessWidget {
  const UiSectionHeader({required this.title, this.action, super.key});

  final String title;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: Spacing.x3),
      child: Row(
        children: <Widget>[
          Expanded(
            child: Text(title, style: Theme.of(context).textTheme.titleMedium),
          ),
          if (action != null) action!,
        ],
      ),
    );
  }
}

/// Compact status pill matching the web `.ui-badge` variants.
class UiStatusBadge extends StatelessWidget {
  const UiStatusBadge({required this.label, this.tone = UiTone.neutral, super.key});

  final String label;
  final UiTone tone;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    final (Color fg, Color bg) = switch (tone) {
      UiTone.success => (t.success, t.successLight),
      UiTone.warning => (t.warning, t.warningLight),
      UiTone.danger => (t.danger, t.dangerLight),
      UiTone.info => (t.info, t.infoLight),
      UiTone.neutral => (t.textSecondary, t.bgSunken),
    };

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: Spacing.x2_5,
        vertical: Spacing.x1,
      ),
      decoration: BoxDecoration(color: bg, borderRadius: Radii.pill),
      child: Text(
        label,
        style: TextStyle(
          color: fg,
          fontSize: TypeScale.xs,
          fontWeight: TypeScale.medium,
        ),
      ),
    );
  }
}

enum UiTone { neutral, success, warning, danger, info }
