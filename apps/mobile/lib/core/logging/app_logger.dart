import 'dart:developer' as developer;

import '../config/env.dart';

/// Structured logger — the mobile counterpart of `@unerp/shared/logger`.
///
/// AGENTS.md Rule 3 forbids raw `print`; `avoid_print` is enforced by the
/// analyzer. In release builds only warnings and above are emitted, and secrets
/// are redacted before anything reaches the log sink.
enum LogLevel { debug, info, warn, error }

class AppLogger {
  const AppLogger(this.context);

  final String context;

  static const Set<String> _redactedKeys = <String>{
    'authorization',
    'password',
    'token',
    'refreshtoken',
    'refresh_token',
    'accesstoken',
    'auth_token',
    'challengetoken',
    'x-csrf-token',
    'csrf_token',
    'cookie',
    'set-cookie',
    'secret',
    'apikey',
    'api_key',
  };

  void debug(String message, {Map<String, Object?>? data}) =>
      _log(LogLevel.debug, message, data: data);

  void info(String message, {Map<String, Object?>? data}) =>
      _log(LogLevel.info, message, data: data);

  void warn(String message, {Map<String, Object?>? data}) =>
      _log(LogLevel.warn, message, data: data);

  void error(
    String message, {
    Object? error,
    StackTrace? stackTrace,
    Map<String, Object?>? data,
  }) =>
      _log(
        LogLevel.error,
        message,
        data: data,
        error: error,
        stackTrace: stackTrace,
      );

  void _log(
    LogLevel level,
    String message, {
    Map<String, Object?>? data,
    Object? error,
    StackTrace? stackTrace,
  }) {
    if (Env.isProduction && level.index < LogLevel.warn.index) return;

    final String payload = data == null || data.isEmpty
        ? message
        : '$message ${redact(data)}';

    developer.log(
      payload,
      name: 'unerp.$context',
      level: switch (level) {
        LogLevel.debug => 500,
        LogLevel.info => 800,
        LogLevel.warn => 900,
        LogLevel.error => 1000,
      },
      error: error,
      stackTrace: stackTrace,
    );
  }

  /// Replaces the value of any sensitive key with `***`, recursively.
  static Map<String, Object?> redact(Map<String, Object?> input) {
    return input.map((String key, Object? value) {
      if (_redactedKeys.contains(key.toLowerCase())) {
        return MapEntry<String, Object?>(key, '***');
      }
      if (value is Map<String, Object?>) {
        return MapEntry<String, Object?>(key, redact(value));
      }
      return MapEntry<String, Object?>(key, value);
    });
  }
}
