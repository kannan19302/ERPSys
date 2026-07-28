import '../../../../core/error/error_mapper.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/logging/app_logger.dart';
import '../../../../core/storage/cookie_store.dart';
import '../../../../core/storage/response_cache.dart';
import '../../../../core/storage/secure_session_store.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/session.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_remote_datasource.dart';
import '../models/session_model.dart';

/// Bridges the auth API to the domain, and owns local session persistence.
class AuthRepositoryImpl implements AuthRepository {
  AuthRepositoryImpl({
    required AuthRemoteDataSource remote,
    required SecureSessionStore sessionStore,
    required CookieStore cookieStore,
    required ResponseCache cache,
  })  : _remote = remote,
        _sessionStore = sessionStore,
        _cookieStore = cookieStore,
        _cache = cache;

  final AuthRemoteDataSource _remote;
  final SecureSessionStore _sessionStore;
  final CookieStore _cookieStore;
  final ResponseCache _cache;
  final AppLogger _log = const AppLogger('auth-repository');

  @override
  Future<Result<RegisteredAccount>> register({
    required String email,
    required String password,
    required String confirmPassword,
    required String firstName,
    required String lastName,
    required String organizationName,
    String? industry,
    String? country,
  }) async {
    try {
      final RegisteredAccountModel account = await _remote.register(<String, dynamic>{
        'email': email,
        'password': password,
        'confirmPassword': confirmPassword,
        'firstName': firstName,
        'lastName': lastName,
        'organizationName': organizationName,
        if (industry != null && industry.isNotEmpty) 'industry': industry,
        if (country != null && country.isNotEmpty) 'country': country,
        'termsAccepted': true,
      });
      return Result<RegisteredAccount>.ok(account);
    } on Object catch (error) {
      return Result<RegisteredAccount>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<void>> verifyEmail(String token) async {
    try {
      await _remote.verifyEmail(token);
      return const Result<void>.ok(null);
    } on Object catch (error) {
      return Result<void>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<void>> resendVerification(String email) async {
    try {
      await _remote.resendVerification(email);
      return const Result<void>.ok(null);
    } on Object catch (error) {
      return Result<void>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Session>> login({
    required String email,
    required String password,
    String? tenantSlug,
    bool rememberMe = true,
    String? captchaToken,
  }) async {
    try {
      final Object result = await _remote.login(
        email: email,
        password: password,
        tenantSlug: tenantSlug,
        rememberMe: rememberMe,
        captchaToken: captchaToken,
      );

      if (result is MfaChallengeModel) {
        return Result<Session>.err(
          MfaRequiredFailure(
            result.message,
            challengeToken: result.challengeToken,
            pushSent: result.pushSent,
          ),
        );
      }

      final SessionModel session = result as SessionModel;
      await _persist(session);
      return Result<Session>.ok(session);
    } on ApiException catch (error) {
      return Result<Session>.err(_mapLoginError(error));
    } on Object catch (error) {
      return Result<Session>.err(mapExceptionToFailure(error));
    }
  }

  /// The login route overloads 400 with two non-error outcomes: a multi-tenant
  /// email and a CAPTCHA demand. Both are surfaced as typed failures so the
  /// controller can render the right next step instead of a red banner.
  ///
  /// Known backend gap: `AllExceptionsFilter.unwrapHttpResponse()` keeps only
  /// `message` and `errors` from a thrown `HttpException` body, so the CAPTCHA
  /// branch's `provider`/`siteKey` fields never reach the client — the web app
  /// has the same blind spot. Detection therefore falls back to the message,
  /// and the challenge is deferred to the browser sign-in flow. Fixing this
  /// belongs in the API (move the fields under `errors`), not here.
  Failure _mapLoginError(ApiException error) {
    if (error.statusCode == 400) {
      final Object? details = error.envelope.errors;
      if (details is Map && details['captchaRequired'] == true) {
        return CaptchaRequiredFailure(
          '${details['message'] ?? 'Verification required.'}',
          provider: '${details['provider'] ?? 'hcaptcha'}',
          siteKey: '${details['siteKey'] ?? ''}',
        );
      }
      if (error.message.contains('CAPTCHA')) {
        return CaptchaRequiredFailure(
          error.message,
          provider: 'unknown',
          siteKey: '',
        );
      }
      if (error.message.contains('Organization Slug')) {
        return TenantSelectionRequiredFailure(error.message);
      }
    }
    return mapExceptionToFailure(error);
  }

  @override
  Future<Result<Session>> verifyMfaLogin({
    required String challengeToken,
    required String code,
  }) async {
    try {
      final SessionModel session = await _remote.verifyMfaLogin(
        challengeToken: challengeToken,
        code: code,
      );
      await _persist(session);
      return Result<Session>.ok(session);
    } on Object catch (error) {
      return Result<Session>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Session?>> pollMfaPush({required String challengeToken}) async {
    try {
      final SessionModel? session =
          await _remote.pollMfaPush(challengeToken: challengeToken);
      if (session != null) await _persist(session);
      return Result<Session?>.ok(session);
    } on Object catch (error) {
      return Result<Session?>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Session?>> restoreSession() async {
    try {
      final String? token = await _sessionStore.readAccessToken();
      final Map<String, dynamic>? user = await _sessionStore.readUser();
      final Map<String, dynamic>? tenant = await _sessionStore.readTenant();

      if (token == null || user == null) {
        // Nothing persisted, but a live refresh cookie may still exist (the
        // access token is short-lived and may have been evicted).
        if (!await _cookieStore.hasRefreshCookie()) {
          return const Result<Session?>.ok(null);
        }
      }

      // Validate against the server. A 401 here triggers the interceptor's
      // silent refresh; if that also fails the session is genuinely dead.
      final AuthUserModel profile = await _remote.fetchProfile();
      final String? freshToken = await _sessionStore.readAccessToken();
      if (freshToken == null) return const Result<Session?>.ok(null);

      final Session session = Session(
        accessToken: freshToken,
        user: profile,
        tenant: tenant != null
            ? TenantModel.fromJson(tenant)
            : const TenantModel(id: '', name: '', slug: ''),
      );
      await _sessionStore.writeUser(profile.toJson());
      await _sessionStore.writePermissions(profile.permissions);
      return Result<Session?>.ok(session);
    } on ApiException catch (error) {
      if (error.statusCode == 401 || error.statusCode == 403) {
        await _clearLocalSession();
        return const Result<Session?>.ok(null);
      }
      return Result<Session?>.err(mapExceptionToFailure(error));
    } on NetworkException {
      // Offline warm start: trust the persisted session rather than signing the
      // user out. The next authenticated call re-validates it.
      final String? token = await _sessionStore.readAccessToken();
      final Map<String, dynamic>? user = await _sessionStore.readUser();
      final Map<String, dynamic>? tenant = await _sessionStore.readTenant();
      if (token == null || user == null) return const Result<Session?>.ok(null);

      return Result<Session?>.ok(
        Session(
          accessToken: token,
          user: AuthUserModel.fromJson(user),
          tenant: tenant != null
              ? TenantModel.fromJson(tenant)
              : const TenantModel(id: '', name: '', slug: ''),
        ),
      );
    } on Object catch (error) {
      return Result<Session?>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<AuthUser>> fetchProfile() async {
    try {
      final AuthUserModel profile = await _remote.fetchProfile();
      await _sessionStore.writeUser(profile.toJson());
      await _sessionStore.writePermissions(profile.permissions);
      return Result<AuthUser>.ok(profile);
    } on Object catch (error) {
      return Result<AuthUser>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<List<Tenant>>> listTenants() async {
    try {
      return Result<List<Tenant>>.ok(await _remote.listTenants());
    } on Object catch (error) {
      return Result<List<Tenant>>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Session>> switchTenant(String tenantSlug) async {
    try {
      final Map<String, dynamic>? previous = await _sessionStore.readTenant();
      final SessionModel session = await _remote.switchTenant(tenantSlug);

      // The cache is tenant-scoped; drop the outgoing tenant's entries so no
      // stale row from the previous organisation can ever be rendered.
      final Object? previousId = previous?['id'];
      if (previousId is String && previousId.isNotEmpty) {
        await _cache.clearTenant(previousId);
      }

      await _persist(session);
      return Result<Session>.ok(session);
    } on Object catch (error) {
      return Result<Session>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<void>> logout() async {
    try {
      await _remote.logout();
    } on Object catch (error) {
      // A failed server logout must not strand the user in a signed-in shell —
      // the local session is wiped either way.
      _log.warn(
        'Server logout failed; clearing locally',
        data: <String, Object?>{'error': '$error'},
      );
    }
    await _clearLocalSession();
    return const Result<void>.ok(null);
  }

  @override
  Future<Result<void>> forgotPassword(String email) async {
    try {
      await _remote.forgotPassword(email);
      return const Result<void>.ok(null);
    } on Object catch (error) {
      return Result<void>.err(mapExceptionToFailure(error));
    }
  }

  Future<void> _persist(SessionModel session) async {
    await _sessionStore.writeAccessToken(session.accessToken);
    await _sessionStore.writeUser(session.userModel.toJson());
    await _sessionStore.writeTenant(session.tenantModel.toJson());
    await _sessionStore.writePermissions(session.user.permissions);
  }

  Future<void> _clearLocalSession() async {
    await _sessionStore.clear();
    await _cookieStore.clear();
    await _cache.clearAll();
  }
}
