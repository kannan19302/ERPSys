import 'package:equatable/equatable.dart';

/// Domain-layer error type. The domain and presentation layers never see Dio,
/// sockets, or HTTP status codes — only these.
sealed class Failure extends Equatable {
  const Failure(this.message, {this.code, this.requestId});

  /// Human-readable and safe to display (the API guarantees this for the
  /// `message` field of its error envelope).
  final String message;

  /// Stable machine-readable code from the shared error contract.
  final String? code;

  /// Correlation id for support — echoes `x-request-id`.
  final String? requestId;

  @override
  List<Object?> get props => <Object?>[message, code, requestId];
}

/// 400 / 422 — request rejected by Zod validation or a business rule.
class ValidationFailure extends Failure {
  const ValidationFailure(
    super.message, {
    super.code,
    super.requestId,
    this.fieldErrors = const <String, String>{},
  });

  final Map<String, String> fieldErrors;

  @override
  List<Object?> get props => <Object?>[...super.props, fieldErrors];
}

/// 401 — no session, or the session was revoked/expired after a failed refresh.
class UnauthorizedFailure extends Failure {
  const UnauthorizedFailure(
    super.message, {
    super.code,
    super.requestId,
  });
}

/// 403 — authenticated but the RBAC guard denied the permission, or CSRF.
class ForbiddenFailure extends Failure {
  const ForbiddenFailure(super.message, {super.code, super.requestId});
}

/// 404 — includes routes gated off by the tenant's module entitlements.
class NotFoundFailure extends Failure {
  const NotFoundFailure(super.message, {super.code, super.requestId});
}

/// 409 — unique constraint, stale write (optimistic concurrency), idempotency.
class ConflictFailure extends Failure {
  const ConflictFailure(super.message, {super.code, super.requestId});
}

/// 429 — the API throttler rejected the call.
class RateLimitFailure extends Failure {
  const RateLimitFailure(super.message, {super.code, super.requestId, this.retryAfter});

  final Duration? retryAfter;

  @override
  List<Object?> get props => <Object?>[...super.props, retryAfter];
}

/// 5xx — the API failed. Safe to retry with backoff.
class ServerFailure extends Failure {
  const ServerFailure(super.message, {super.code, super.requestId});
}

/// No connectivity, DNS failure, or timeout. Cached data may still be served.
class NetworkFailure extends Failure {
  const NetworkFailure(super.message, {super.code});
}

/// Response arrived but did not match the expected contract.
class ParseFailure extends Failure {
  const ParseFailure(super.message, {super.code, super.requestId});
}

/// Local device failure (secure storage, filesystem, biometrics).
class CacheFailure extends Failure {
  const CacheFailure(super.message, {super.code});
}

/// MFA challenge issued by `POST /auth/login`; not an error, but it interrupts
/// the use case's happy path, so it travels as a typed failure.
class MfaRequiredFailure extends Failure {
  const MfaRequiredFailure(super.message, {required this.challengeToken, this.pushSent = false});

  final String challengeToken;
  final bool pushSent;

  @override
  List<Object?> get props => <Object?>[...super.props, challengeToken, pushSent];
}

/// The account exists in more than one tenant, so login needs an org slug.
class TenantSelectionRequiredFailure extends Failure {
  const TenantSelectionRequiredFailure(super.message);
}

/// `POST /auth/login` demanded a CAPTCHA after repeated failures.
class CaptchaRequiredFailure extends Failure {
  const CaptchaRequiredFailure(
    super.message, {
    required this.provider,
    required this.siteKey,
  });

  final String provider;
  final String siteKey;

  @override
  List<Object?> get props => <Object?>[...super.props, provider, siteKey];
}
