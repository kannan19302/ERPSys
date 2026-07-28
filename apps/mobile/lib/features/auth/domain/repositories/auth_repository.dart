import '../../../../core/usecase/result.dart';
import '../entities/session.dart';

/// Domain contract for authentication. The domain layer depends on this
/// abstraction only; the concrete implementation lives in the data layer and is
/// the sole place that knows about HTTP, cookies, or storage.
abstract class AuthRepository {
  /// Creates a new organisation + administrator account
  /// (`POST /auth/register`). No session is returned — the email must be
  /// verified, then the caller signs in separately.
  Future<Result<RegisteredAccount>> register({
    required String email,
    required String password,
    required String confirmPassword,
    required String firstName,
    required String lastName,
    required String organizationName,
    String? industry,
    String? country,
  });

  /// Completes email verification with the single-use token from the link
  /// (`POST /auth/verify-email`).
  Future<Result<void>> verifyEmail(String token);

  /// Re-issues a verification email (`POST /auth/resend-verification`).
  /// Responds success-shaped whether or not the address exists.
  Future<Result<void>> resendVerification(String email);

  /// Signs in. Returns [MfaRequiredFailure] when the account has MFA enabled,
  /// [TenantSelectionRequiredFailure] when the email spans several tenants, and
  /// [CaptchaRequiredFailure] once the API demands a challenge.
  Future<Result<Session>> login({
    required String email,
    required String password,
    String? tenantSlug,
    bool rememberMe,
    String? captchaToken,
  });

  /// Completes an MFA login with the 6-digit code and the challenge token from
  /// the interrupted login.
  Future<Result<Session>> verifyMfaLogin({
    required String challengeToken,
    required String code,
  });

  /// Polls whether a push-approved MFA challenge has been answered.
  Future<Result<Session?>> pollMfaPush({required String challengeToken});

  /// Restores a session from secure storage on a warm start, refreshing the
  /// access token when the persisted one has expired.
  Future<Result<Session?>> restoreSession();

  /// Re-reads the profile from `GET /auth/me`.
  Future<Result<AuthUser>> fetchProfile();

  /// Tenants this account can sign in to (`GET /auth/tenants`).
  Future<Result<List<Tenant>>> listTenants();

  /// Re-issues the session against another tenant (`POST /auth/switch-tenant`).
  Future<Result<Session>> switchTenant(String tenantSlug);

  /// Revokes the server-side session and wipes every local artefact.
  Future<Result<void>> logout();

  /// Triggers the reset email (`POST /auth/forgot-password`).
  Future<Result<void>> forgotPassword(String email);
}
