import 'package:flutter/material.dart';

import '../../../../app/theme/design_tokens.dart';

/// Shown while [AuthController] restores a persisted session on cold start.
class SplashPage extends StatelessWidget {
  const SplashPage({super.key});

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Container(
              height: Spacing.x12,
              width: Spacing.x12,
              decoration: BoxDecoration(color: t.primaryLight, borderRadius: Radii.card),
              alignment: Alignment.center,
              child: Text(
                'U',
                style: TextStyle(
                  color: t.primary,
                  fontSize: TypeScale.x2l,
                  fontWeight: TypeScale.bold,
                ),
              ),
            ),
            const SizedBox(height: Spacing.x6),
            const CircularProgressIndicator(strokeWidth: 2),
          ],
        ),
      ),
    );
  }
}
