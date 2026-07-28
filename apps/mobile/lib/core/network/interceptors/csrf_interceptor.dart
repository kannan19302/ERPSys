import 'package:dio/dio.dart';

import '../../storage/cookie_store.dart';
import '../api_paths.dart';

/// Double-submit CSRF for state-changing requests.
///
/// `apps/api/src/common/middleware/csrf.middleware.ts` issues a readable
/// `csrf_token` cookie on the first response and, for every non-safe method,
/// requires the same value in the `x-csrf-token` header. Login and register are
/// exempt (no cookie exists yet) — everything else, including `/auth/refresh`,
/// is not.
///
/// If no cookie is held yet (cold start, cleared jar), one cheap safe request
/// is issued to `/health` purely to make the middleware mint the cookie.
class CsrfInterceptor extends Interceptor {
  CsrfInterceptor({
    required CookieStore cookieStore,
    required Dio bootstrapClient,
  })  : _cookieStore = cookieStore,
        _bootstrapClient = bootstrapClient;

  static const Set<String> _safeMethods = <String>{'GET', 'HEAD', 'OPTIONS'};

  /// Mirrors the middleware's exemption list exactly.
  static const List<String> _exemptPaths = <String>[
    ApiPaths.login,
    '/auth/login-demo',
    '/auth/register',
  ];

  final CookieStore _cookieStore;
  final Dio _bootstrapClient;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final String method = options.method.toUpperCase();
    if (_safeMethods.contains(method) ||
        _exemptPaths.any(options.path.startsWith)) {
      return handler.next(options);
    }

    String? token = await _cookieStore.readCsrfToken();
    token ??= await _primeCsrfCookie();

    if (token != null && token.isNotEmpty) {
      options.headers['x-csrf-token'] = token;
    }
    handler.next(options);
  }

  /// A safe request is enough: the middleware sets the cookie on any response.
  Future<String?> _primeCsrfCookie() async {
    try {
      await _bootstrapClient.get<dynamic>(
        ApiPaths.health,
        options: Options(
          // A degraded API returns 503 from /health; the cookie is still set.
          validateStatus: (int? status) => status != null && status < 600,
        ),
      );
    } on DioException {
      return null;
    }
    return _cookieStore.readCsrfToken();
  }
}
