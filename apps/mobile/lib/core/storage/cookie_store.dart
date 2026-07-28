import 'dart:io' show Cookie, Directory;

import 'package:cookie_jar/cookie_jar.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:path_provider/path_provider.dart';

import '../config/env.dart';

/// Persistent cookie jar backing the API's cookie-based session transport.
///
/// The API sets three cookies (apps/api/src/modules/auth/auth.controller.ts and
/// apps/api/src/common/middleware/csrf.middleware.ts):
///
///   * `auth_token`   — httpOnly access token, path `/`
///   * `refresh_token`— httpOnly rotating refresh token, path `/api/v1/auth`
///   * `csrf_token`   — readable double-submit token, path `/`
///
/// `SameSite=Strict` is a browser-only construct and does not apply to a native
/// HTTP client, so the same server contract works unchanged on mobile — no API
/// modification is required.
class CookieStore {
  CookieStore(this._jar, this._origin);

  static const String csrfCookieName = 'csrf_token';
  static const String accessCookieName = 'auth_token';
  static const String refreshCookieName = 'refresh_token';

  /// Cookies survive process death so a warm start can silently refresh.
  ///
  /// On web, `auth_token`/`refresh_token` are httpOnly and managed by the
  /// browser itself (Dio's browser adapter sends them automatically with
  /// `withCredentials`) — there's no filesystem for `path_provider`/
  /// `FileStorage` to use, and no need for a persisted jar. An in-memory
  /// [CookieJar] still lets [readCsrfToken] read the one cookie JS can see.
  static Future<CookieStore> create() async {
    if (kIsWeb) {
      return CookieStore(CookieJar(ignoreExpires: false), Uri.parse(Env.apiOrigin));
    }
    final Directory supportDir = await getApplicationSupportDirectory();
    final PersistCookieJar jar = PersistCookieJar(
      ignoreExpires: false,
      storage: FileStorage('${supportDir.path}/.unerp_cookies/'),
    );
    return CookieStore(jar, Uri.parse(Env.apiOrigin));
  }

  final CookieJar _jar;
  final Uri _origin;

  CookieJar get jar => _jar;

  /// Value of the double-submit CSRF cookie, or null before the first response.
  Future<String?> readCsrfToken() async {
    final List<Cookie> cookies = await _jar.loadForRequest(_origin);
    for (final Cookie cookie in cookies) {
      if (cookie.name == csrfCookieName && cookie.value.isNotEmpty) {
        return cookie.value;
      }
    }
    return null;
  }

  /// True when a refresh cookie is still held — a silent refresh can be tried.
  Future<bool> hasRefreshCookie() async {
    final List<Cookie> cookies = await _jar.loadForRequest(
      _origin.replace(path: '/api/v1/auth'),
    );
    return cookies.any(
      (Cookie c) => c.name == refreshCookieName && c.value.isNotEmpty,
    );
  }

  Future<void> clear() => _jar.deleteAll();
}
