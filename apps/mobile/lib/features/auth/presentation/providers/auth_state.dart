import 'package:equatable/equatable.dart';

import '../../../../core/error/failures.dart';
import '../../domain/entities/session.dart';

enum AuthStatus {
  /// Warm start: restoring a persisted session.
  initialising,
  unauthenticated,

  /// Credentials accepted, waiting on the second factor.
  mfaRequired,
  authenticated,
}

class AuthState extends Equatable {
  const AuthState({
    this.status = AuthStatus.initialising,
    this.session,
    this.failure,
    this.isSubmitting = false,
    this.mfaChallengeToken,
    this.mfaPushSent = false,
    this.tenants = const <Tenant>[],
    this.requiresTenantSlug = false,
  });

  final AuthStatus status;
  final Session? session;

  /// Last failure, cleared as soon as the user edits the form.
  final Failure? failure;
  final bool isSubmitting;
  final String? mfaChallengeToken;
  final bool mfaPushSent;

  /// Populated for the tenant switcher once signed in.
  final List<Tenant> tenants;

  /// Set when the email exists in more than one organisation.
  final bool requiresTenantSlug;

  bool get isAuthenticated => status == AuthStatus.authenticated && session != null;

  AuthUser? get user => session?.user;

  Tenant? get tenant => session?.tenant;

  AuthState copyWith({
    AuthStatus? status,
    Session? session,
    Failure? failure,
    bool clearFailure = false,
    bool? isSubmitting,
    String? mfaChallengeToken,
    bool? mfaPushSent,
    List<Tenant>? tenants,
    bool? requiresTenantSlug,
  }) =>
      AuthState(
        status: status ?? this.status,
        session: session ?? this.session,
        failure: clearFailure ? null : (failure ?? this.failure),
        isSubmitting: isSubmitting ?? this.isSubmitting,
        mfaChallengeToken: mfaChallengeToken ?? this.mfaChallengeToken,
        mfaPushSent: mfaPushSent ?? this.mfaPushSent,
        tenants: tenants ?? this.tenants,
        requiresTenantSlug: requiresTenantSlug ?? this.requiresTenantSlug,
      );

  /// Signed-out reset — drops the session rather than merging it forward.
  AuthState signedOut({Failure? failure}) => AuthState(
        status: AuthStatus.unauthenticated,
        failure: failure,
      );

  @override
  List<Object?> get props => <Object?>[
        status,
        session,
        failure,
        isSubmitting,
        mfaChallengeToken,
        mfaPushSent,
        tenants,
        requiresTenantSlug,
      ];
}
