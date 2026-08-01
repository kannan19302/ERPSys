import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/di/providers.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/rbac/permissions.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../../data/datasources/auth_remote_datasource.dart';
import '../../data/repositories/auth_repository_impl.dart';
import '../../domain/entities/session.dart';
import '../../domain/repositories/auth_repository.dart';
import '../../domain/usecases/auth_usecases.dart';
import 'auth_state.dart';

// ── Wiring ────────────────────────────────────────────────────────────────

final Provider<AuthRemoteDataSource> authRemoteDataSourceProvider =
    Provider<AuthRemoteDataSource>(
  (Ref ref) => AuthRemoteDataSourceImpl(ref.watch(apiClientProvider)),
);

final Provider<AuthRepository> authRepositoryProvider = Provider<AuthRepository>(
  (Ref ref) => AuthRepositoryImpl(
    remote: ref.watch(authRemoteDataSourceProvider),
    sessionStore: ref.watch(secureSessionStoreProvider),
    cookieStore: ref.watch(cookieStoreProvider),
    cache: ref.watch(responseCacheProvider),
  ),
);

// ── Session state ─────────────────────────────────────────────────────────

final NotifierProvider<AuthController, AuthState> authControllerProvider =
    NotifierProvider<AuthController, AuthState>(AuthController.new);

/// The active tenant id — every cache read/write is scoped by it, so a tenant
/// switch can never surface another organisation's data.
final Provider<String> activeTenantIdProvider = Provider<String>(
  (Ref ref) =>
      ref.watch(authControllerProvider.select((AuthState s) => s.tenant?.id ?? '')),
);

/// Permission set for the signed-in user, consumed by [PermissionGate].
final Provider<PermissionSet> permissionSetProvider = Provider<PermissionSet>(
  (Ref ref) => PermissionSet(
    ref.watch(
      authControllerProvider.select(
        (AuthState s) => s.user?.permissions ?? const <String>[],
      ),
    ),
  ),
);

/// Presentation-layer orchestrator. Holds no business rules of its own — it
/// only sequences use cases and projects their results into [AuthState].
class AuthController extends Notifier<AuthState> {
  @override
  AuthState build() {
    // Kicked off immediately; the router shows the splash until it settles.
    Future<void>.microtask(restore);
    return const AuthState();
  }

  AuthRepository get _repository => ref.read(authRepositoryProvider);

  Future<void> restore() async {
    final Result<Session?> result =
        await RestoreSessionUseCase(_repository)(const NoParams());

    state = result.fold(
      (Failure failure) => state.signedOut(failure: failure),
      (Session? session) => session == null
          ? state.signedOut()
          : state.copyWith(
              status: AuthStatus.authenticated,
              session: session,
              clearFailure: true,
            ),
    );

    if (state.isAuthenticated) unawaited(loadTenants());
  }

  Future<void> login({
    required String email,
    required String password,
    String? tenantSlug,
    bool rememberMe = true,
  }) async {
    state = state.copyWith(isSubmitting: true, clearFailure: true);

    final Result<Session> result = await LoginUseCase(_repository)(
      LoginParams(
        email: email,
        password: password,
        tenantSlug: tenantSlug,
        rememberMe: rememberMe,
      ),
    );

    state = result.fold(
      (Failure failure) => switch (failure) {
        MfaRequiredFailure(
          challengeToken: final String token,
          pushSent: final bool pushed,
        ) =>
          state.copyWith(
            status: AuthStatus.mfaRequired,
            isSubmitting: false,
            mfaChallengeToken: token,
            mfaPushSent: pushed,
            clearFailure: true,
          ),
        TenantSelectionRequiredFailure() => state.copyWith(
            isSubmitting: false,
            requiresTenantSlug: true,
            failure: failure,
          ),
        _ => state.copyWith(isSubmitting: false, failure: failure),
      },
      (Session session) => state.copyWith(
        status: AuthStatus.authenticated,
        session: session,
        isSubmitting: false,
        requiresTenantSlug: false,
        clearFailure: true,
      ),
    );

    if (state.isAuthenticated) unawaited(loadTenants());
  }

  Future<void> verifyMfa(String code) async {
    final String? challenge = state.mfaChallengeToken;
    if (challenge == null) return;

    state = state.copyWith(isSubmitting: true, clearFailure: true);
    final Result<Session> result = await VerifyMfaUseCase(_repository)(
      VerifyMfaParams(challengeToken: challenge, code: code),
    );

    state = result.fold(
      (Failure failure) => state.copyWith(isSubmitting: false, failure: failure),
      (Session session) => state.copyWith(
        status: AuthStatus.authenticated,
        session: session,
        isSubmitting: false,
        clearFailure: true,
      ),
    );

    if (state.isAuthenticated) unawaited(loadTenants());
  }

  Future<void> loadTenants() async {
    final Result<List<Tenant>> result =
        await ListTenantsUseCase(_repository)(const NoParams());
    result.fold(
      (Failure _) => null,
      (List<Tenant> tenants) => state = state.copyWith(tenants: tenants),
    );
  }

  Future<void> switchTenant(String slug) async {
    state = state.copyWith(isSubmitting: true, clearFailure: true);
    final Result<Session> result = await SwitchTenantUseCase(_repository)(slug);

    state = result.fold(
      (Failure failure) => state.copyWith(isSubmitting: false, failure: failure),
      (Session session) => state.copyWith(
        status: AuthStatus.authenticated,
        session: session,
        isSubmitting: false,
        clearFailure: true,
      ),
    );

    // Feature controllers watch `activeTenantIdProvider`, so the id change
    // alone rebuilds them against the new tenant — no manual invalidation, and
    // no window in which the previous organisation's rows stay on screen.
    if (state.isAuthenticated) unawaited(loadTenants());
  }

  Future<void> logout() async {
    await LogoutUseCase(_repository)(const NoParams());
    state = state.signedOut();
  }

  /// Called by the network layer when a refresh definitively fails.
  void onSessionExpired() {
    if (state.status == AuthStatus.unauthenticated) return;
    state = state.signedOut(
      failure: const UnauthorizedFailure('Your session expired. Please sign in again.'),
    );
  }

  void clearError() => state = state.copyWith(clearFailure: true);
}

/// Local `unawaited` so the file needs no extra import for a fire-and-forget.
void unawaited(Future<void> future) {
  future.ignore();
}
