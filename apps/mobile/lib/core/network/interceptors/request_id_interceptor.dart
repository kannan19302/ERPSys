import 'dart:math';

import 'package:dio/dio.dart';

/// Stamps `x-request-id` on every outbound call.
///
/// The API echoes it back in the error envelope's `requestId` field and in its
/// structured logs, so a mobile failure can be traced end-to-end in the same
/// way a web one is.
class RequestIdInterceptor extends Interceptor {
  RequestIdInterceptor({required this.clientId});

  /// Stable per-install id, so all requests from one device correlate.
  final String clientId;

  static final Random _random = Random.secure();

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    options.headers['x-request-id'] ??= _generateId();
    options.headers['x-client'] = 'unerp-mobile';
    options.headers['x-client-install'] = clientId;
    handler.next(options);
  }

  static String _generateId() {
    const String alphabet = 'abcdef0123456789';
    final StringBuffer buffer = StringBuffer('mob-');
    for (int i = 0; i < 24; i++) {
      buffer.write(alphabet[_random.nextInt(alphabet.length)]);
    }
    return buffer.toString();
  }
}
