import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../models/session_model.dart';

/// The only place that speaks HTTP for authentication.
abstract class AuthRemoteDataSource {
  Future<RegisteredAccountModel> register(Map<String, dynamic> payload);

  Future<void> verifyEmail(String token);

  Future<void> resendVerification(String email);

  /// Returns either a [SessionModel] or an [MfaChallengeModel].
  Future<Object> login({
    required String email,
    required String password,
    String? tenantSlug,
    required bool rememberMe,
    String? captchaToken,
  });

  Future<SessionModel> verifyMfaLogin({
    required String challengeToken,
    required String code,
  });

  /// `null` while the pushed challenge is still pending.
  Future<SessionModel?> pollMfaPush({required String challengeToken});

  Future<AuthUserModel> fetchProfile();

  Future<List<TenantModel>> listTenants();

  Future<SessionModel> switchTenant(String tenantSlug);

  Future<void> logout();

  Future<void> forgotPassword(String email);
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  const AuthRemoteDataSourceImpl(this._client);

  final ApiClient _client;

  @override
  Future<RegisteredAccountModel> register(Map<String, dynamic> payload) async {
    final Map<String, dynamic> body =
        await _client.post(ApiPaths.register, body: payload);
    return RegisteredAccountModel.fromJson(body);
  }

  @override
  Future<void> verifyEmail(String token) async {
    await _client.post(ApiPaths.verifyEmail, body: <String, dynamic>{'token': token});
  }

  @override
  Future<void> resendVerification(String email) async {
    await _client.post(
      ApiPaths.resendVerification,
      body: <String, dynamic>{'email': email},
    );
  }

  @override
  Future<Object> login({
    required String email,
    required String password,
    String? tenantSlug,
    required bool rememberMe,
    String? captchaToken,
  }) async {
    final Map<String, dynamic> body = await _client.post(
      ApiPaths.login,
      body: <String, dynamic>{
        'email': email,
        'password': password,
        'rememberMe': rememberMe,
        if (tenantSlug != null && tenantSlug.isNotEmpty) 'tenantSlug': tenantSlug,
        if (captchaToken != null) 'captchaToken': captchaToken,
      },
    );

    // The controller returns the MFA challenge instead of a session when the
    // account has a second factor enabled.
    if (body['mfaRequired'] == true) {
      return MfaChallengeModel.fromJson(body);
    }
    return SessionModel.fromJson(body);
  }

  @override
  Future<SessionModel> verifyMfaLogin({
    required String challengeToken,
    required String code,
  }) async {
    final Map<String, dynamic> body = await _client.post(
      ApiPaths.verifyMfaLogin,
      body: <String, dynamic>{'challengeToken': challengeToken, 'code': code},
    );
    return SessionModel.fromJson(body);
  }

  @override
  Future<SessionModel?> pollMfaPush({required String challengeToken}) async {
    final Map<String, dynamic> body = await _client.post(
      ApiPaths.mfaPushStatus,
      body: <String, dynamic>{'challengeToken': challengeToken},
    );
    // Only an approved challenge carries a minted session.
    if (body['token'] is! String) return null;
    return SessionModel.fromJson(body);
  }

  @override
  Future<AuthUserModel> fetchProfile() async =>
      AuthUserModel.fromJson(await _client.getObject(ApiPaths.me));

  @override
  Future<List<TenantModel>> listTenants() async {
    final List<Map<String, dynamic>> rows =
        await _client.getList(ApiPaths.tenants);
    return rows.map(TenantModel.fromJson).toList(growable: false);
  }

  @override
  Future<SessionModel> switchTenant(String tenantSlug) async {
    final Map<String, dynamic> body = await _client.post(
      ApiPaths.switchTenant,
      body: <String, dynamic>{'tenantSlug': tenantSlug},
    );
    return SessionModel.fromJson(body);
  }

  @override
  Future<void> logout() async {
    await _client.post(ApiPaths.logout);
  }

  @override
  Future<void> forgotPassword(String email) async {
    await _client.post(
      ApiPaths.forgotPassword,
      body: <String, dynamic>{'email': email},
    );
  }
}
