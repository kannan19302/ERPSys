import 'package:dio/dio.dart';

import '../../logging/app_logger.dart';

/// Dev-only request/response tracing through the structured logger.
///
/// Headers are redacted by [AppLogger.redact] and bodies are never logged —
/// an ERP request body routinely carries customer PII.
class LoggingInterceptor extends Interceptor {
  const LoggingInterceptor();

  static const AppLogger _log = AppLogger('http');

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    _log.debug(
      '→ ${options.method} ${options.path}',
      data: <String, Object?>{
        'query': options.queryParameters,
        'requestId': options.headers['x-request-id'],
      },
    );
    handler.next(options);
  }

  @override
  void onResponse(
    Response<dynamic> response,
    ResponseInterceptorHandler handler,
  ) {
    _log.debug(
      '← ${response.statusCode} ${response.requestOptions.path}',
      data: <String, Object?>{
        'requestId': response.requestOptions.headers['x-request-id'],
      },
    );
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    _log.warn(
      '✗ ${err.response?.statusCode ?? '-'} ${err.requestOptions.path}',
      data: <String, Object?>{
        'type': err.type.name,
        'requestId': err.requestOptions.headers['x-request-id'],
      },
    );
    handler.next(err);
  }
}
