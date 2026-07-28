import 'bootstrap.dart';

/// Staging entry point:
///
///   flutter run -t lib/main_staging.dart \
///     --dart-define=FLAVOR=staging \
///     --dart-define=API_BASE_URL=https://staging-api.unerp.example
Future<void> main() => bootstrap();
