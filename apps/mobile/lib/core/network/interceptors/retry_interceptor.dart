import 'dart:async';
import 'dart:math';

import 'package:dio/dio.dart';

/// Bounded exponential-backoff retry for transient failures only.
///
/// Retries idempotent methods on connection errors, timeouts, 502/503/504, and
/// 429 (honouring `Retry-After`). Never retries 4xx business errors, and never
/// retries a non-idempotent method without an idempotency key — the API's
/// idempotency contract rejects a reused key, so blind POST retries would
/// surface `IDEMPOTENCY_KEY_REUSED` instead of succeeding.
class RetryInterceptor extends Interceptor {
  RetryInterceptor({
    required Dio client,
    this.maxAttempts = 3,
    this.baseDelay = const Duration(milliseconds: 400),
  }) : _client = client;

  static const Set<String> _idempotentMethods = <String>{
    'GET',
    'HEAD',
    'OPTIONS',
    'PUT',
    'DELETE',
  };
  static const Set<int> _retryableStatuses = <int>{429, 502, 503, 504};
  static const String _attemptKey = 'unerp.retry.attempt';

  final Dio _client;
  final int maxAttempts;
  final Duration baseDelay;
  final Random _jitter = Random();

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final RequestOptions request = err.requestOptions;
    final int attempt = (request.extra[_attemptKey] as int?) ?? 0;

    if (attempt + 1 >= maxAttempts || !_isRetryable(err, request)) {
      return handler.next(err);
    }

    await Future<void>.delayed(_delayFor(attempt, err.response));

    try {
      final Response<dynamic> response = await _client.request<dynamic>(
        request.path,
        data: request.data,
        queryParameters: request.queryParameters,
        options: Options(
          method: request.method,
          headers: request.headers,
          responseType: request.responseType,
          contentType: request.contentType,
          extra: <String, dynamic>{...request.extra, _attemptKey: attempt + 1},
        ),
      );
      return handler.resolve(response);
    } on DioException catch (retryError) {
      return handler.next(retryError);
    }
  }

  bool _isRetryable(DioException err, RequestOptions request) {
    if (!_idempotentMethods.contains(request.method.toUpperCase())) return false;

    return switch (err.type) {
      DioExceptionType.connectionTimeout ||
      DioExceptionType.sendTimeout ||
      DioExceptionType.receiveTimeout ||
      DioExceptionType.connectionError =>
        true,
      DioExceptionType.badResponse =>
        _retryableStatuses.contains(err.response?.statusCode),
      _ => false,
    };
  }

  Duration _delayFor(int attempt, Response<dynamic>? response) {
    final String? retryAfter = response?.headers.value('retry-after');
    final int? seconds = retryAfter == null ? null : int.tryParse(retryAfter);
    if (seconds != null) return Duration(seconds: seconds);

    final int exponential = baseDelay.inMilliseconds * (1 << attempt);
    return Duration(milliseconds: exponential + _jitter.nextInt(200));
  }
}
