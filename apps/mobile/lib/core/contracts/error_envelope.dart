/// Dart mirror of the FROZEN error envelope contract.
///
/// Source of truth: `packages/shared/src/contracts/error-envelope.ts`
/// (Foundation Roadmap Track G.9). The API's global `AllExceptionsFilter`
/// produces this shape for every error. Changing it is a sealed-contract change
/// on the backend — this file only follows it.
library;

class ErrorEnvelope {
  const ErrorEnvelope({
    required this.statusCode,
    required this.code,
    required this.message,
    this.requestId,
    this.timestamp,
    this.path,
    this.errors,
  });

  /// Tolerant parse: some legacy handlers return `{ message }` only, and a few
  /// return `message` as a string array (Nest's default validation shape).
  factory ErrorEnvelope.fromJson(Map<String, dynamic> json, int fallbackStatus) {
    final dynamic rawMessage = json['message'];
    final String message = switch (rawMessage) {
      final String value => value,
      final List<dynamic> value when value.isNotEmpty => '${value.first}',
      _ => 'Request failed ($fallbackStatus)',
    };
    final int status = switch (json['statusCode']) {
      final int value => value,
      final String value => int.tryParse(value) ?? fallbackStatus,
      _ => fallbackStatus,
    };
    return ErrorEnvelope(
      statusCode: status,
      code: json['code'] as String? ?? codeForStatus(status),
      message: message,
      requestId: json['requestId'] as String?,
      timestamp: json['timestamp'] as String?,
      path: json['path'] as String?,
      errors: json['errors'],
    );
  }

  final int statusCode;

  /// Stable machine-readable code — see `ERROR_CODES` in the shared contract.
  final String code;
  final String message;

  /// Correlation id echoed from the `x-request-id` request header.
  final String? requestId;
  final String? timestamp;
  final String? path;
  final Object? errors;

  /// Field-level issues from a Zod validation failure, keyed by field path.
  Map<String, String> get fieldErrors {
    final Object? raw = errors;
    if (raw is! List) return const <String, String>{};
    final Map<String, String> out = <String, String>{};
    for (final Object? issue in raw) {
      if (issue is! Map) continue;
      final Object? path = issue['path'];
      final Object? message = issue['message'];
      if (message == null) continue;
      final String key = path is List && path.isNotEmpty
          ? path.map((Object? p) => '$p').join('.')
          : '_';
      out[key] = '$message';
    }
    return out;
  }

  @override
  String toString() => 'ErrorEnvelope($statusCode $code: $message)';
}

/// Mirrors `codeForStatus()` in the shared contract.
String codeForStatus(int status) {
  const Map<int, String> map = <int, String>{
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    429: 'RATE_LIMITED',
  };
  return map[status] ?? (status >= 500 ? 'INTERNAL_ERROR' : 'ERROR');
}
