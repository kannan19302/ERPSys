import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart' show kIsWeb;

import '../../logging/app_logger.dart';
import '../../storage/cookie_store.dart';
import '../../storage/secure_session_store.dart';
import '../api_paths.dart';

/// Attaches the bearer access token and performs single-flight silent refresh.
///
/// This is the exact behaviour of the web client (`apps/web/src/lib/api.ts`):
/// the access token is short-lived, so a 401 on a non-auth route triggers one
/// `POST /auth/refresh` (which rotates the httpOnly refresh cookie) and the
/// original request is replayed once. `JwtAuthGuard` accepts either the
/// `auth_token` cookie or an `Authorization: Bearer` header, so both transports
/// are already supported server-side — nothing on the API changes for mobile.
class AuthInterceptor extends QueuedInterceptor {
  AuthInterceptor({
    required Dio refreshClient,
    required SecureSessionStore sessionStore,
    required CookieStore cookieStore,
    required Future<void> Function() onSessionExpired,
  })  : _refreshClient = refreshClient,
        _sessionStore = sessionStore,
        _cookieStore = cookieStore,
        _onSessionExpired = onSessionExpired;

  /// Routes that ARE the auth flow — a 401 from these must never be retried.
  static const List<String> _noRefreshPaths = <String>[
    ApiPaths.login,
    ApiPaths.refresh,
    ApiPaths.logout,
    ApiPaths.verifyMfaLogin,
    '/auth/login-demo',
    '/auth/register',
  ];

  static const String _retriedFlag = 'unerp.retried';

  final Dio _refreshClient;
  final SecureSessionStore _sessionStore;
  final CookieStore _cookieStore;
  final Future<void> Function() _onSessionExpired;
  final AppLogger _log = const AppLogger('auth-interceptor');

  Future<bool>? _refreshInFlight;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    if (!options.headers.containsKey('Authorization')) {
      final String? token = await _sessionStore.readAccessToken();
      if (token != null && token.isNotEmpty) {
        options.headers['Authorization'] = 'Bearer $token';
      }
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final RequestOptions request = err.requestOptions;
    final bool isUnauthorized = err.response?.statusCode == 401;
    final bool alreadyRetried = request.extra[_retriedFlag] == true;
    final bool isAuthFlow = _noRefreshPaths.any(request.path.startsWith);

    if (!isUnauthorized || alreadyRetried || isAuthFlow) {
      return handler.next(err);
    }

    final bool renewed = await _refreshOnce();
    if (!renewed) {
      await _onSessionExpired();
      return handler.next(err);
    }

    try {
      final String? token = await _sessionStore.readAccessToken();
      final Options options = Options(
        method: request.method,
        headers: <String, dynamic>{
          ...request.headers,
          if (token != null) 'Authorization': 'Bearer $token',
        },
        responseType: request.responseType,
        contentType: request.contentType,
        extra: <String, dynamic>{...request.extra, _retriedFlag: true},
      );
      final Response<dynamic> replay = await _refreshClient.request<dynamic>(
        request.path,
        data: request.data,
        queryParameters: request.queryParameters,
        options: options,
      );
      return handler.resolve(replay);
    } on DioException catch (retryError) {
      return handler.next(retryError);
    }
  }

  /// Deduplicates concurrent refreshes: parallel 401s share one refresh call.
  Future<bool> _refreshOnce() {
    return _refreshInFlight ??= _performRefresh().whenComplete(() {
      _refreshInFlight = null;
    });
  }

  Future<bool> _performRefresh() async {
    // `refresh_token` is httpOnly, so on web no JS-visible cookie jar — dio's
    // included — can ever see it; hasRefreshCookie() would always report false
    // there and skip the refresh call even though the browser holds a valid
    // cookie and will attach it automatically. Only gate on it off web, where
    // the app's own jar genuinely mirrors what will be sent.
    if (!kIsWeb && !await _cookieStore.hasRefreshCookie()) {
      _log.info('No refresh cookie held — session cannot be renewed silently');
      return false;
    }
    try {
      // The refresh cookie rides automatically via the cookie manager; the CSRF
      // interceptor supplies `x-csrf-token` because /auth/refresh is NOT in the
      // API's CSRF skip-list (only /auth/login and /auth/register are).
      final Response<dynamic> res = await _refreshClient.post<dynamic>(
        ApiPaths.refresh,
        options: Options(extra: <String, dynamic>{_retriedFlag: true}),
      );
      final Object? body = res.data;
      if (body is! Map<String, dynamic>) return false;

      final Object? token = body['token'];
      if (token is! String || token.isEmpty) return false;
      await _sessionStore.writeAccessToken(token);

      final Object? user = body['user'];
      if (user is Map<String, dynamic>) {
        await _sessionStore.writeUser(user);
        final Object? permissions = user['permissions'];
        if (permissions is List) {
          await _sessionStore.writePermissions(
            permissions.map((Object? p) => '$p').toList(growable: false),
          );
        }
      }
      final Object? tenant = body['tenant'];
      if (tenant is Map<String, dynamic>) {
        await _sessionStore.writeTenant(tenant);
      }
      return true;
    } on Object catch (error) {
      _log.warn('Silent refresh failed', data: <String, Object?>{'error': '$error'});
      return false;
    }
  }
}
