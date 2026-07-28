import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/domain/entities/session.dart';
import '../../features/auth/presentation/pages/login_page.dart';
import '../../features/auth/presentation/pages/mfa_challenge_page.dart';
import '../../features/auth/presentation/pages/register_page.dart';
import '../../features/auth/presentation/pages/splash_page.dart';
import '../../features/auth/presentation/pages/verify_email_pending_page.dart';
import '../../features/auth/presentation/providers/auth_providers.dart';
import '../../features/auth/presentation/providers/auth_state.dart';
import '../../features/home/presentation/pages/home_page.dart';
import '../../features/inventory/presentation/pages/product_detail_page.dart';
import '../../features/inventory/presentation/pages/product_list_page.dart';
import '../../features/notifications/presentation/pages/notifications_page.dart';
import '../../features/onboarding/presentation/pages/onboarding_page.dart';
import '../shell/app_shell.dart';

/// Route graph, gated centrally by [AuthState.status] via `redirect` — no
/// individual page needs to guard itself.
final Provider<GoRouter> appRouterProvider = Provider<GoRouter>((Ref ref) {
  final GoRouter router = GoRouter(
    initialLocation: HomePage.routePath,
    refreshListenable: _AuthRefreshListenable(ref),
    redirect: (BuildContext context, GoRouterState state) {
      final AuthState auth = ref.read(authControllerProvider);
      final String location = state.matchedLocation;

      final bool onSplash = location == '/splash';
      final bool onLogin = location == LoginPage.routePath;
      final bool onMfa = location == MfaChallengePage.routePath;
      // Unauthenticated dead ends reachable only from the login/register
      // flow — never redirected away from once the user lands there.
      final bool onRegister = location == RegisterPage.routePath;
      final bool onVerifyPending = location == VerifyEmailPendingPage.routePath;

      if (auth.status == AuthStatus.initialising) {
        return onSplash ? null : '/splash';
      }
      if (auth.status == AuthStatus.mfaRequired) {
        return onMfa ? null : MfaChallengePage.routePath;
      }
      if (!auth.isAuthenticated) {
        if (onLogin || onRegister || onVerifyPending) return null;
        return LoginPage.routePath;
      }
      // Authenticated: never let the user land back on an auth screen.
      if (onLogin || onMfa || onSplash || onRegister || onVerifyPending) {
        return HomePage.routePath;
      }
      return null;
    },
    routes: <RouteBase>[
      GoRoute(path: '/splash', builder: (_, __) => const SplashPage()),
      GoRoute(
        path: LoginPage.routePath,
        name: LoginPage.routeName,
        builder: (_, __) => const LoginPage(),
      ),
      GoRoute(
        path: RegisterPage.routePath,
        name: RegisterPage.routeName,
        builder: (_, __) => const RegisterPage(),
      ),
      GoRoute(
        path: VerifyEmailPendingPage.routePath,
        name: VerifyEmailPendingPage.routeName,
        // `extra` only survives in-app navigation (not a cold deep link /
        // hot restart) — redirect to login rather than crash if it's gone.
        redirect: (_, GoRouterState state) =>
            state.extra is RegisteredAccount ? null : LoginPage.routePath,
        builder: (_, GoRouterState state) => VerifyEmailPendingPage(
          account: state.extra! as RegisteredAccount,
        ),
      ),
      GoRoute(
        path: MfaChallengePage.routePath,
        name: MfaChallengePage.routeName,
        builder: (_, __) => const MfaChallengePage(),
      ),
      GoRoute(
        path: OnboardingPage.routePath,
        name: OnboardingPage.routeName,
        builder: (_, __) => const OnboardingPage(),
      ),
      StatefulShellRoute.indexedStack(
        builder: (_, __, StatefulNavigationShell shell) =>
            AppShell(navigationShell: shell),
        branches: <StatefulShellBranch>[
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: HomePage.routePath,
                name: HomePage.routeName,
                builder: (_, __) => const HomePage(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: ProductListPage.routePath,
                name: ProductListPage.routeName,
                builder: (_, __) => const ProductListPage(),
                routes: <RouteBase>[
                  GoRoute(
                    path: ':id',
                    name: ProductDetailPage.routeName,
                    builder: (_, GoRouterState state) => ProductDetailPage(
                      productId: state.pathParameters['id']!,
                    ),
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: NotificationsPage.routePath,
                name: NotificationsPage.routeName,
                builder: (_, __) => const NotificationsPage(),
              ),
            ],
          ),
        ],
      ),
    ],
  );

  ref.onDispose(router.dispose);
  return router;
});

/// Bridges Riverpod state changes into go_router's `Listenable` refresh hook.
class _AuthRefreshListenable extends ChangeNotifier {
  _AuthRefreshListenable(Ref ref) {
    ref.listen<AuthState>(
      authControllerProvider,
      (AuthState? previous, AuthState next) {
        if (previous?.status != next.status) notifyListeners();
      },
    );
  }
}
