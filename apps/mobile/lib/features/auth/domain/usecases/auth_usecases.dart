import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/session.dart';
import '../repositories/auth_repository.dart';

class LoginParams {
  const LoginParams({
    required this.email,
    required this.password,
    this.tenantSlug,
    this.rememberMe = true,
    this.captchaToken,
  });

  final String email;
  final String password;

  /// Required only when the email exists in more than one tenant.
  final String? tenantSlug;
  final bool rememberMe;
  final String? captchaToken;
}

class LoginUseCase extends UseCase<Session, LoginParams> {
  const LoginUseCase(this._repository);

  final AuthRepository _repository;

  @override
  Future<Result<Session>> call(LoginParams params) => _repository.login(
        email: params.email.trim().toLowerCase(),
        password: params.password,
        tenantSlug: params.tenantSlug?.trim(),
        rememberMe: params.rememberMe,
        captchaToken: params.captchaToken,
      );
}

class RegisterParams {
  const RegisterParams({
    required this.email,
    required this.password,
    required this.confirmPassword,
    required this.firstName,
    required this.lastName,
    required this.organizationName,
    this.industry,
    this.country,
  });

  final String email;
  final String password;
  final String confirmPassword;
  final String firstName;
  final String lastName;
  final String organizationName;
  final String? industry;
  final String? country;
}

class RegisterUseCase extends UseCase<RegisteredAccount, RegisterParams> {
  const RegisterUseCase(this._repository);

  final AuthRepository _repository;

  @override
  Future<Result<RegisteredAccount>> call(RegisterParams params) =>
      _repository.register(
        email: params.email.trim().toLowerCase(),
        password: params.password,
        confirmPassword: params.confirmPassword,
        firstName: params.firstName.trim(),
        lastName: params.lastName.trim(),
        organizationName: params.organizationName.trim(),
        industry: params.industry,
        country: params.country,
      );
}

class VerifyEmailUseCase extends UseCase<void, String> {
  const VerifyEmailUseCase(this._repository);

  final AuthRepository _repository;

  @override
  Future<Result<void>> call(String token) => _repository.verifyEmail(token);
}

class ResendVerificationUseCase extends UseCase<void, String> {
  const ResendVerificationUseCase(this._repository);

  final AuthRepository _repository;

  @override
  Future<Result<void>> call(String email) =>
      _repository.resendVerification(email.trim().toLowerCase());
}

class VerifyMfaParams {
  const VerifyMfaParams({required this.challengeToken, required this.code});

  final String challengeToken;
  final String code;
}

class VerifyMfaUseCase extends UseCase<Session, VerifyMfaParams> {
  const VerifyMfaUseCase(this._repository);

  final AuthRepository _repository;

  @override
  Future<Result<Session>> call(VerifyMfaParams params) =>
      _repository.verifyMfaLogin(
        challengeToken: params.challengeToken,
        code: params.code.trim(),
      );
}

/// Warm-start session restore. Returns `null` when there is nothing to restore.
class RestoreSessionUseCase extends UseCase<Session?, NoParams> {
  const RestoreSessionUseCase(this._repository);

  final AuthRepository _repository;

  @override
  Future<Result<Session?>> call(NoParams params) => _repository.restoreSession();
}

class LogoutUseCase extends UseCase<void, NoParams> {
  const LogoutUseCase(this._repository);

  final AuthRepository _repository;

  @override
  Future<Result<void>> call(NoParams params) => _repository.logout();
}

class ListTenantsUseCase extends UseCase<List<Tenant>, NoParams> {
  const ListTenantsUseCase(this._repository);

  final AuthRepository _repository;

  @override
  Future<Result<List<Tenant>>> call(NoParams params) => _repository.listTenants();
}

class SwitchTenantUseCase extends UseCase<Session, String> {
  const SwitchTenantUseCase(this._repository);

  final AuthRepository _repository;

  @override
  Future<Result<Session>> call(String tenantSlug) =>
      _repository.switchTenant(tenantSlug);
}

class ForgotPasswordUseCase extends UseCase<void, String> {
  const ForgotPasswordUseCase(this._repository);

  final AuthRepository _repository;

  @override
  Future<Result<void>> call(String email) =>
      _repository.forgotPassword(email.trim().toLowerCase());
}
