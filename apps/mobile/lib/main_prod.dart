import 'bootstrap.dart';

/// Production entry point:
///
///   flutter build apk -t lib/main_prod.dart \
///     --dart-define=FLAVOR=prod \
///     --dart-define=API_BASE_URL=https://api.unerp.example
Future<void> main() => bootstrap();
