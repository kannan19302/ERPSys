import 'package:flutter/widgets.dart';

/// Width classes driving the adaptive shell (mobile bottom-nav vs. desktop
/// sidebar/multi-pane). See .ai/MULTI_CLIENT_MASTER_PLAN.md § 1, § 4 — every
/// module ships on Web + Mobile + Desktop together from one Flutter
/// codebase; this is the one place that decides which shell a build renders.
enum WindowClass { phone, tablet, desktop }

/// Standard Material breakpoints: phone <600, tablet 600-1024, desktop >1024.
WindowClass windowClassOf(BuildContext context) {
  final double width = MediaQuery.sizeOf(context).width;
  if (width >= 1024) return WindowClass.desktop;
  if (width >= 600) return WindowClass.tablet;
  return WindowClass.phone;
}

/// Tablet reuses the desktop (multi-pane/sidebar) shell where width allows —
/// there is no separate third bespoke layout, per the master plan.
bool isDesktopShell(BuildContext context) =>
    windowClassOf(context) != WindowClass.phone;
