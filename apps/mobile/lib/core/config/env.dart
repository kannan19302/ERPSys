/// Build-time configuration.
///
/// Nothing here is a secret (AGENTS.md Rule 18) — only the public API origin and
/// feature switches. Supply values with `--dart-define`:
///
///   flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3001
///
/// The API mounts every route under the global prefix `api/v1`
/// (apps/api/src/main.ts), so [apiBaseUrl] appends it exactly once.
library;

enum Flavor { dev, staging, prod }

class Env {
  const Env._();

  static const String _rawApiOrigin = String.fromEnvironment(
    'API_BASE_URL',
    // Android emulator loopback for the containerised API on host port 3001.
    defaultValue: 'http://10.0.2.2:3001',
  );

  static const String _flavorName = String.fromEnvironment(
    'FLAVOR',
    defaultValue: 'dev',
  );

  /// Origin only, e.g. `https://api.unerp.example`.
  static String get apiOrigin => _stripTrailingSlash(_rawApiOrigin);

  /// Fully-qualified API root, e.g. `https://api.unerp.example/api/v1`.
  static String get apiBaseUrl => '$apiOrigin/api/v1';

  static Flavor get flavor => switch (_flavorName) {
        'prod' => Flavor.prod,
        'staging' => Flavor.staging,
        _ => Flavor.dev,
      };

  static bool get isProduction => flavor == Flavor.prod;

  /// Verbose request/response logging is dev-only; it can echo bearer tokens.
  static bool get networkLogging => !isProduction;

  /// The API rejects plaintext transport expectations in production builds.
  static bool get requiresTls => isProduction;

  /// Read-cache lifetime for list/detail responses served while offline.
  static const Duration cacheTtl = Duration(hours: 12);

  /// Matches the API access-token TTL closely enough to pre-empt a 401.
  static const Duration requestTimeout = Duration(seconds: 30);
  static const Duration connectTimeout = Duration(seconds: 15);

  static String _stripTrailingSlash(String value) =>
      value.endsWith('/') ? value.substring(0, value.length - 1) : value;
}
