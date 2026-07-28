import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:unerp_mobile/app/theme/app_theme.dart';

void main() {
  testWidgets('AppTheme builds a light and dark ThemeData', (
    WidgetTester tester,
  ) async {
    // A lightweight smoke test that doesn't require a live API — full
    // integration coverage for the auth/inventory/notifications flows lives
    // in the use case and repository unit tests per feature.
    await tester.pumpWidget(
      ProviderScope(
        child: MaterialApp(
          theme: AppTheme.light(),
          darkTheme: AppTheme.dark(),
          home: const Scaffold(body: Text('UniERP')),
        ),
      ),
    );

    expect(find.text('UniERP'), findsOneWidget);
  });
}
