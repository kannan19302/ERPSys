import 'package:equatable/equatable.dart';

/// The signed-in user, as returned by `POST /auth/login`, `POST /auth/refresh`
/// and `GET /auth/me` (see `issueSession()` in
/// apps/api/src/modules/auth/auth.service.ts).
class AuthUser extends Equatable {
  const AuthUser({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    this.avatar,
    this.roles = const <String>[],
    this.permissions = const <String>[],
  });

  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String? avatar;
  final List<String> roles;
  final List<String> permissions;

  String get fullName => <String>[firstName, lastName]
      .where((String part) => part.trim().isNotEmpty)
      .join(' ')
      .trim();

  String get initials {
    final String first = firstName.isNotEmpty ? firstName[0] : '';
    final String last = lastName.isNotEmpty ? lastName[0] : '';
    final String combined = '$first$last'.toUpperCase();
    return combined.isEmpty ? email.substring(0, 1).toUpperCase() : combined;
  }

  @override
  List<Object?> get props =>
      <Object?>[id, email, firstName, lastName, avatar, roles, permissions];
}

/// The active tenant. Every request is implicitly scoped to it by the server
/// (the tenant id is sealed into the JWT and enforced by row-level security) —
/// the client never sends a tenant id of its own.
class Tenant extends Equatable {
  const Tenant({
    required this.id,
    required this.name,
    required this.slug,
    this.isCurrent = false,
  });

  final String id;
  final String name;
  final String slug;

  /// Set by `GET /auth/tenants`, which flags the membership in use.
  final bool isCurrent;

  @override
  List<Object?> get props => <Object?>[id, name, slug, isCurrent];
}

/// Result of `POST /auth/register`. Deliberately carries no session/token —
/// the account is created but the email is unverified, so the caller must
/// verify then sign in separately (mirrors the web registration contract).
class RegisteredAccount extends Equatable {
  const RegisteredAccount({
    required this.email,
    required this.organizationName,
    this.developerVerificationLink,
  });

  final String email;
  final String organizationName;

  /// Present only outside production — lets a dev tester skip real email
  /// delivery. Never rely on this in a release build.
  final String? developerVerificationLink;

  @override
  List<Object?> get props =>
      <Object?>[email, organizationName, developerVerificationLink];
}

/// A completed session: short-lived access token plus its user and tenant.
/// The refresh token is deliberately absent — it lives only in the httpOnly
/// cookie jar, mirroring the web contract.
class Session extends Equatable {
  const Session({
    required this.accessToken,
    required this.user,
    required this.tenant,
  });

  final String accessToken;
  final AuthUser user;
  final Tenant tenant;

  @override
  List<Object?> get props => <Object?>[accessToken, user, tenant];
}
