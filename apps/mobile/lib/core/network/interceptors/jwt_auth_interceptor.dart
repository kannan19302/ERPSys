import 'auth_interceptor.dart';

/// Concrete implementation of JwtAuthInterceptor using AuthInterceptor.
/// Handles automatic Bearer token injection, single-flight token refresh locking,
/// request queuing on 401 response, and secure token persistence.
class JwtAuthInterceptor extends AuthInterceptor {
  JwtAuthInterceptor({
    required super.refreshClient,
    required super.sessionStore,
    required super.cookieStore,
    required super.onSessionExpired,
  });
}
