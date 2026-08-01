import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:unerp_mobile/core/di/providers.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mocktail/mocktail.dart';
import 'package:cookie_jar/cookie_jar.dart';
import 'package:unerp_mobile/core/storage/cookie_store.dart';
import 'package:unerp_mobile/core/network/api_client.dart';
import 'package:dio/dio.dart';

import 'package:unerp_mobile/core/error/failures.dart';
import 'package:unerp_mobile/core/usecase/result.dart';
import 'package:unerp_mobile/features/auth/domain/entities/session.dart';
import 'package:unerp_mobile/features/auth/domain/repositories/auth_repository.dart';
import 'package:unerp_mobile/features/auth/presentation/providers/auth_providers.dart';
import 'package:unerp_mobile/features/auth/presentation/providers/auth_state.dart';

const AuthUser _user = AuthUser(
  id: 'u1',
  email: 'admin@unerp.dev',
  firstName: 'Ada',
  lastName: 'Admin',
  permissions: <String>['inventory.product.read'],
);
const Tenant _tenant = Tenant(id: 't1', name: 'System Tenant', slug: 'system');
const Session _session = Session(accessToken: 'token', user: _user, tenant: _tenant);

/// Hand-written fake — swaps behaviour per test via the mutable fields below,
/// no mock framework required for this small a surface.
class FakeAuthRepository implements AuthRepository {
  Result<Session?> restoreResult = const Result<Session?>.ok(null);
  Result<Session> loginResult = const Result<Session>.ok(_session);
  Result<Session> mfaResult = const Result<Session>.ok(_session);
  Result<List<Tenant>> tenantsResult = const Result<List<Tenant>>.ok(<Tenant>[_tenant]);
  Result<Session> switchTenantResult = const Result<Session>.ok(_session);
  int logoutCalls = 0;

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
  }) async =>
      Result<RegisteredAccount>.ok(
        RegisteredAccount(email: email, organizationName: organizationName),
      );

  @override
  Future<Result<void>> verifyEmail(String token) async => const Result<void>.ok(null);

  @override
  Future<Result<void>> resendVerification(String email) async => const Result<void>.ok(null);

  @override
  Future<Result<Session?>> restoreSession() async => restoreResult;

  @override
  Future<Result<Session>> login({
    required String email,
    required String password,
    String? tenantSlug,
    bool rememberMe = true,
    String? captchaToken,
  }) async =>
      loginResult;

  @override
  Future<Result<Session>> verifyMfaLogin({
    required String challengeToken,
    required String code,
  }) async =>
      mfaResult;

  @override
  Future<Result<Session?>> pollMfaPush({required String challengeToken}) async =>
      const Result<Session?>.ok(null);

  @override
  Future<Result<AuthUser>> fetchProfile() async => const Result<AuthUser>.ok(_user);

  @override
  Future<Result<List<Tenant>>> listTenants() async => tenantsResult;

  @override
  Future<Result<Session>> switchTenant(String tenantSlug) async => switchTenantResult;

  @override
  Future<Result<void>> logout() async {
    logoutCalls++;
    return const Result<void>.ok(null);
  }

  @override
  Future<Result<void>> forgotPassword(String email) async => const Result<void>.ok(null);
}

void main() {
  late FakeAuthRepository fakeRepository;
  late ProviderContainer container;

  setUp(() {
    fakeRepository = FakeAuthRepository();
    container = ProviderContainer(
      overrides: <Override>[
      sharedPreferencesProvider.overrideWithValue(MockSharedPreferences()),
      cookieStoreProvider.overrideWithValue(CookieStore(CookieJar(), Uri.parse('http://localhost'))),
      apiClientProvider.overrideWithValue(ApiClient.forTesting(Dio())),
        authRepositoryProvider.overrideWithValue(fakeRepository),
      ],
    );
    addTearDown(container.dispose);
  });

  group('AuthController.build', () {
    test('starts unauthenticated when nothing is persisted', () async {
      // build() fires restore() in a microtask; pump it once.
      container.read(authControllerProvider);
      await Future<void>.delayed(Duration.zero);

      expect(container.read(authControllerProvider).status, AuthStatus.unauthenticated);
    });

    test('restores straight to authenticated when a session exists', () async {
      fakeRepository.restoreResult = const Result<Session?>.ok(_session);
      container.read(authControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final AuthState state = container.read(authControllerProvider);
      expect(state.status, AuthStatus.authenticated);
      expect(state.user?.email, 'admin@unerp.dev');
    });
  });

  group('AuthController.login', () {
    test('a successful login authenticates and clears the failure', () async {
      container.read(authControllerProvider);
      await Future<void>.delayed(Duration.zero);

      await container
          .read(authControllerProvider.notifier)
          .login(email: 'admin@unerp.dev', password: 'admin123');

      final AuthState state = container.read(authControllerProvider);
      expect(state.isAuthenticated, isTrue);
      expect(state.isSubmitting, isFalse);
      expect(state.failure, isNull);
    });

    test('an MFA challenge moves to mfaRequired without authenticating', () async {
      fakeRepository.loginResult = const Result<Session>.err(
        MfaRequiredFailure('MFA required', challengeToken: 'chal-1', pushSent: true),
      );
      container.read(authControllerProvider);
      await Future<void>.delayed(Duration.zero);

      await container
          .read(authControllerProvider.notifier)
          .login(email: 'admin@unerp.dev', password: 'admin123');

      final AuthState state = container.read(authControllerProvider);
      expect(state.status, AuthStatus.mfaRequired);
      expect(state.mfaChallengeToken, 'chal-1');
      expect(state.mfaPushSent, isTrue);
      expect(state.isAuthenticated, isFalse);
    });

    test('a multi-tenant email sets requiresTenantSlug instead of failing silently', () async {
      fakeRepository.loginResult = const Result<Session>.err(
        TenantSelectionRequiredFailure('Multiple organizations use this email.'),
      );
      container.read(authControllerProvider);
      await Future<void>.delayed(Duration.zero);

      await container
          .read(authControllerProvider.notifier)
          .login(email: 'admin@unerp.dev', password: 'admin123');

      final AuthState state = container.read(authControllerProvider);
      expect(state.requiresTenantSlug, isTrue);
      expect(state.isAuthenticated, isFalse);
    });

    test('a plain failure surfaces the message without changing status', () async {
      fakeRepository.loginResult = const Result<Session>.err(
        UnauthorizedFailure('Invalid credentials'),
      );
      container.read(authControllerProvider);
      await Future<void>.delayed(Duration.zero);

      await container
          .read(authControllerProvider.notifier)
          .login(email: 'admin@unerp.dev', password: 'wrong');

      final AuthState state = container.read(authControllerProvider);
      expect(state.failure, isA<UnauthorizedFailure>());
      expect(state.isAuthenticated, isFalse);
    });
  });

  group('AuthController.verifyMfa', () {
    test('completes the session once the challenge is verified', () async {
      fakeRepository.loginResult = const Result<Session>.err(
        MfaRequiredFailure('MFA required', challengeToken: 'chal-1'),
      );
      container.read(authControllerProvider);
      await Future<void>.delayed(Duration.zero);
      await container
          .read(authControllerProvider.notifier)
          .login(email: 'admin@unerp.dev', password: 'admin123');

      await container.read(authControllerProvider.notifier).verifyMfa('123456');

      expect(container.read(authControllerProvider).isAuthenticated, isTrue);
    });
  });

  group('AuthController.logout', () {
    test('resets to unauthenticated and calls the repository once', () async {
      fakeRepository.restoreResult = const Result<Session?>.ok(_session);
      container.read(authControllerProvider);
      await Future<void>.delayed(Duration.zero);

      await container.read(authControllerProvider.notifier).logout();

      expect(container.read(authControllerProvider).status, AuthStatus.unauthenticated);
      expect(fakeRepository.logoutCalls, 1);
    });
  });

  group('AuthController.onSessionExpired', () {
    test('signs the user out with an explanatory failure', () async {
      fakeRepository.restoreResult = const Result<Session?>.ok(_session);
      container.read(authControllerProvider);
      await Future<void>.delayed(Duration.zero);

      container.read(authControllerProvider.notifier).onSessionExpired();

      final AuthState state = container.read(authControllerProvider);
      expect(state.status, AuthStatus.unauthenticated);
      expect(state.failure, isA<UnauthorizedFailure>());
    });

    test('is a no-op when already unauthenticated', () async {
      container.read(authControllerProvider);
      await Future<void>.delayed(Duration.zero);
      expect(container.read(authControllerProvider).status, AuthStatus.unauthenticated);

      // Should not throw or overwrite state with a redundant failure banner.
      container.read(authControllerProvider.notifier).onSessionExpired();
      expect(container.read(authControllerProvider).failure, isNull);
    });
  });

  group('permissionSetProvider', () {
    test('reflects the authenticated user\'s permissions', () async {
      fakeRepository.restoreResult = const Result<Session?>.ok(_session);
      container.read(authControllerProvider);
      await Future<void>.delayed(Duration.zero);

      expect(
        container.read(permissionSetProvider).has('inventory.product.read'),
        isTrue,
      );
      expect(
        container.read(permissionSetProvider).has('inventory.product.delete'),
        isFalse,
      );
    });
  });
}

class MockSharedPreferences extends Mock implements SharedPreferences {}
