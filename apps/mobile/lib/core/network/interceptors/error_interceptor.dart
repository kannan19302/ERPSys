import 'package:dio/dio.dart';

import '../../contracts/error_envelope.dart';
import '../../error/exceptions.dart';

/// Normalises every transport failure into an [ApiException] carrying the
/// backend's error envelope, or a [NetworkException] when no response arrived.
///
/// After this interceptor, no layer above the data sources needs to know Dio.
class ErrorInterceptor extends Interceptor {
  const ErrorInterceptor();

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    final Object? converted = switch (err.type) {
      DioExceptionType.connectionTimeout ||
      DioExceptionType.sendTimeout ||
      DioExceptionType.receiveTimeout =>
        const NetworkException('The request timed out. Check your connection.'),
      DioExceptionType.connectionError =>
        const NetworkException('No connection to the UniERP server.'),
      DioExceptionType.badCertificate =>
        const NetworkException('The server certificate could not be verified.'),
      DioExceptionType.cancel => null,
      DioExceptionType.badResponse => _fromResponse(err.response),
      DioExceptionType.unknown ||
      DioExceptionType.transformTimeout =>
        _fromResponse(err.response) ??
            const NetworkException('The UniERP server is unreachable.'),
    };

    if (converted == null) {
      return handler.next(err);
    }

    handler.reject(
      DioException(
        requestOptions: err.requestOptions,
        response: err.response,
        type: err.type,
        error: converted,
        message: err.message,
      ),
    );
  }

  static Object? _fromResponse(Response<dynamic>? response) {
    if (response == null) return null;
    final int status = response.statusCode ?? 500;
    final Object? body = response.data;

    if (body is Map<String, dynamic>) {
      return ApiException(ErrorEnvelope.fromJson(body, status));
    }
    return ApiException(
      ErrorEnvelope(
        statusCode: status,
        code: codeForStatus(status),
        message: 'Request failed ($status)',
      ),
    );
  }
}
