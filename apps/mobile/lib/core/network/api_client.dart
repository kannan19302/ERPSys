import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';

import '../config/env.dart';
import '../contracts/paginated.dart';
import '../error/exceptions.dart';
import '../storage/cookie_store.dart';
import '../storage/secure_session_store.dart';
import 'interceptors/csrf_interceptor.dart';
import 'interceptors/error_interceptor.dart';
import 'interceptors/jwt_auth_interceptor.dart';
import 'interceptors/logging_interceptor.dart';
import 'interceptors/request_id_interceptor.dart';
import 'interceptors/retry_interceptor.dart';

/// The single HTTP entry point to the existing UniERP REST API.
///
/// Data sources depend on this, never on Dio directly, so the transport can be
/// swapped without touching a feature. Every response is unwrapped here and
/// every transport failure has already been converted to an [ApiException] or
/// [NetworkException] by [ErrorInterceptor].
class ApiClient {
  ApiClient._(this._dio);

  /// Test seam — lets a unit test inject a mocked/adaptered Dio.
  factory ApiClient.forTesting(Dio dio) = ApiClient._;

  /// Builds the client and wires the interceptor chain in dependency order.
  ///
  /// Order matters: cookies → request id → CSRF (needs the cookie) → auth
  /// (needs to run before the response is turned into an exception) → retry →
  /// error normalisation, with logging outermost in dev.
  static Future<ApiClient> create({
    required CookieStore cookieStore,
    required SecureSessionStore sessionStore,
    required String installId,
    required Future<void> Function() onSessionExpired,
  }) async {
    final BaseOptions options = BaseOptions(
      baseUrl: Env.apiBaseUrl,
      connectTimeout: Env.connectTimeout,
      receiveTimeout: Env.requestTimeout,
      sendTimeout: Env.requestTimeout,
      contentType: Headers.jsonContentType,
      responseType: ResponseType.json,
      // 4xx/5xx must raise so ErrorInterceptor can normalise them.
      validateStatus: (int? status) =>
          status != null && status >= 200 && status < 300,
    );

    final CookieManager cookieManager = CookieManager(cookieStore.jar);

    // Bare client used for the CSRF priming call and for replaying a request
    // after a refresh; it shares the cookie jar but not the auth/retry chain,
    // which would otherwise recurse.
    final Dio innerDio = Dio(options)
      ..interceptors.addAll(<Interceptor>[
        cookieManager,
        RequestIdInterceptor(clientId: installId),
      ]);

    final Dio dio = Dio(options);
    dio.interceptors.addAll(<Interceptor>[
      cookieManager,
      RequestIdInterceptor(clientId: installId),
      CsrfInterceptor(cookieStore: cookieStore, bootstrapClient: innerDio),
      JwtAuthInterceptor(
        refreshClient: innerDio,
        sessionStore: sessionStore,
        cookieStore: cookieStore,
        onSessionExpired: onSessionExpired,
      ),
      RetryInterceptor(client: innerDio),
      const ErrorInterceptor(),
      if (Env.networkLogging) const LoggingInterceptor(),
    ]);

    // The refresh/replay client needs CSRF + error normalisation too, but must
    // never carry the auth or retry interceptors.
    innerDio.interceptors.addAll(<Interceptor>[
      CsrfInterceptor(cookieStore: cookieStore, bootstrapClient: Dio(options)),
      const ErrorInterceptor(),
    ]);

    return ApiClient._(dio);
  }

  final Dio _dio;

  Future<Map<String, dynamic>> getObject(
    String path, {
    Map<String, dynamic>? query,
    CancelToken? cancelToken,
  }) async =>
      _asObject(
        await _dio.get<dynamic>(
          path,
          queryParameters: query,
          cancelToken: cancelToken,
        ),
      );

  Future<List<Map<String, dynamic>>> getList(
    String path, {
    Map<String, dynamic>? query,
    CancelToken? cancelToken,
  }) async =>
      _asList(
        await _dio.get<dynamic>(
          path,
          queryParameters: query,
          cancelToken: cancelToken,
        ),
      );

  /// GET a list endpoint that follows the frozen pagination contract.
  ///
  /// Tolerates endpoints that still return a bare array (several legacy
  /// controllers do) by synthesising a single-page meta.
  Future<Paginated<T>> getPaginated<T>(
    String path,
    ListQuery query,
    T Function(Map<String, dynamic>) fromJson, {
    CancelToken? cancelToken,
  }) async {
    final Response<dynamic> response = await _dio.get<dynamic>(
      path,
      queryParameters: query.toQueryParameters(),
      cancelToken: cancelToken,
    );
    final Object? body = response.data;

    if (body is Map<String, dynamic>) {
      return Paginated<T>.fromJson(body, fromJson);
    }
    if (body is List) {
      final List<T> items = body
          .whereType<Map<String, dynamic>>()
          .map(fromJson)
          .toList(growable: false);
      return Paginated<T>(
        data: items,
        meta: PaginationMeta(
          page: 1,
          limit: items.length,
          total: items.length,
          totalPages: items.isEmpty ? 0 : 1,
        ),
      );
    }
    throw const ParseException('Expected a paginated list response');
  }

  Future<Map<String, dynamic>> post(
    String path, {
    Object? body,
    Map<String, dynamic>? query,
    CancelToken? cancelToken,
  }) async =>
      _asObject(
        await _dio.post<dynamic>(
          path,
          data: body,
          queryParameters: query,
          cancelToken: cancelToken,
        ),
      );

  Future<Map<String, dynamic>> patch(
    String path, {
    Object? body,
    CancelToken? cancelToken,
  }) async =>
      _asObject(
        await _dio.patch<dynamic>(path, data: body, cancelToken: cancelToken),
      );

  Future<Map<String, dynamic>> put(
    String path, {
    Object? body,
    CancelToken? cancelToken,
  }) async =>
      _asObject(
        await _dio.put<dynamic>(path, data: body, cancelToken: cancelToken),
      );

  Future<void> delete(String path, {CancelToken? cancelToken}) async {
    await _dio.delete<dynamic>(path, cancelToken: cancelToken);
  }

  Map<String, dynamic> _asObject(Response<dynamic> response) {
    final Object? body = response.data;
    if (body == null || (body is String && body.isEmpty)) {
      return const <String, dynamic>{};
    }
    if (body is Map<String, dynamic>) return body;
    throw const ParseException('Expected a JSON object response');
  }

  List<Map<String, dynamic>> _asList(Response<dynamic> response) {
    final Object? body = response.data;
    if (body is List) {
      return body.whereType<Map<String, dynamic>>().toList(growable: false);
    }
    // Some endpoints wrap an array under `data` without pagination meta.
    if (body is Map<String, dynamic> && body['data'] is List) {
      return (body['data'] as List<dynamic>)
          .whereType<Map<String, dynamic>>()
          .toList(growable: false);
    }
    throw const ParseException('Expected a JSON array response');
  }
}
