import '../../../../core/error/exceptions.dart';
import '../../domain/entities/session.dart';

/// Wire models for the auth endpoints.
///
/// Parsing is hand-written rather than generated so the app has no build_runner
/// step; each field maps 1:1 to the response built by `issueSession()` in
/// apps/api/src/modules/auth/auth.service.ts.
class AuthUserModel extends AuthUser {
  const AuthUserModel({
    required super.id,
    required super.email,
    required super.firstName,
    required super.lastName,
    super.avatar,
    super.roles,
    super.permissions,
  });

  factory AuthUserModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('Auth response is missing the user id');
    }
    return AuthUserModel(
      id: id,
      email: json['email'] as String? ?? '',
      firstName: json['firstName'] as String? ?? '',
      lastName: json['lastName'] as String? ?? '',
      avatar: json['avatar'] as String?,
      roles: _stringList(json['roles']),
      permissions: _stringList(json['permissions']),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'email': email,
        'firstName': firstName,
        'lastName': lastName,
        'avatar': avatar,
        'roles': roles,
        'permissions': permissions,
      };
}

class RegisteredAccountModel extends RegisteredAccount {
  const RegisteredAccountModel({
    required super.email,
    required super.organizationName,
    super.developerVerificationLink,
  });

  factory RegisteredAccountModel.fromJson(Map<String, dynamic> json) {
    final Object? user = json['user'];
    final Object? tenant = json['tenant'];
    return RegisteredAccountModel(
      email: user is Map ? user['email'] as String? ?? '' : '',
      organizationName: tenant is Map ? tenant['name'] as String? ?? '' : '',
      developerVerificationLink: json['developerVerificationLink'] as String?,
    );
  }
}

class TenantModel extends Tenant {
  const TenantModel({
    required super.id,
    required super.name,
    required super.slug,
    super.isCurrent,
  });

  factory TenantModel.fromJson(Map<String, dynamic> json) => TenantModel(
        id: json['id'] as String? ?? '',
        name: json['name'] as String? ?? '',
        slug: json['slug'] as String? ?? '',
        isCurrent: json['current'] as bool? ?? false,
      );

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'slug': slug,
        'current': isCurrent,
      };
}

class SessionModel extends Session {
  const SessionModel({
    required super.accessToken,
    required AuthUserModel super.user,
    required TenantModel super.tenant,
  });

  /// Parses the body of `/auth/login`, `/auth/refresh`, `/auth/switch-tenant`
  /// and `/auth/mfa/verify-login`. The refresh token is never present here —
  /// the controller strips it into an httpOnly cookie before responding.
  factory SessionModel.fromJson(Map<String, dynamic> json) {
    final Object? token = json['token'];
    if (token is! String || token.isEmpty) {
      throw const ParseException('Auth response is missing the access token');
    }
    final Object? user = json['user'];
    if (user is! Map<String, dynamic>) {
      throw const ParseException('Auth response is missing the user');
    }
    final Object? tenant = json['tenant'];

    return SessionModel(
      accessToken: token,
      user: AuthUserModel.fromJson(user),
      tenant: tenant is Map<String, dynamic>
          ? TenantModel.fromJson(tenant)
          : const TenantModel(id: '', name: '', slug: ''),
    );
  }

  AuthUserModel get userModel => user as AuthUserModel;

  TenantModel get tenantModel => tenant as TenantModel;
}

/// The MFA branch of `POST /auth/login` — a challenge, not a session.
class MfaChallengeModel {
  const MfaChallengeModel({
    required this.challengeToken,
    required this.pushSent,
    required this.message,
  });

  factory MfaChallengeModel.fromJson(Map<String, dynamic> json) =>
      MfaChallengeModel(
        challengeToken: json['challengeToken'] as String? ?? '',
        pushSent: json['pushSent'] as bool? ?? false,
        message: json['message'] as String? ?? 'MFA authentication required.',
      );

  final String challengeToken;
  final bool pushSent;
  final String message;
}

List<String> _stringList(Object? value) => value is List
    ? value.map((Object? e) => '$e').toList(growable: false)
    : const <String>[];
