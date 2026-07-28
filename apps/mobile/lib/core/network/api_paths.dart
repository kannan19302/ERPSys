/// Every backend route the app calls, in one place.
///
/// Paths are relative to `Env.apiBaseUrl` (`<origin>/api/v1`). Each constant
/// names the controller it maps to so a backend rename is easy to trace. No
/// endpoint here is new — all of them already exist in `apps/api/src/modules`.
class ApiPaths {
  const ApiPaths._();

  // ── auth (apps/api/src/modules/auth/auth.controller.ts) ──
  static const String register = '/auth/register';
  static const String login = '/auth/login';
  static const String logout = '/auth/logout';
  static const String refresh = '/auth/refresh';
  static const String me = '/auth/me';
  static const String tenants = '/auth/tenants';
  static const String switchTenant = '/auth/switch-tenant';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';
  static const String verifyEmail = '/auth/verify-email';
  static const String resendVerification = '/auth/resend-verification';
  static const String verifyMfaLogin = '/auth/mfa/verify-login';
  static const String mfaPushStatus = '/auth/mfa/push/status';
  static const String sessions = '/auth/sessions';
  static const String revokeOtherSessions = '/auth/sessions/revoke-others';
  static String revokeSession(String id) => '/auth/sessions/$id';
  static const String loginHistory = '/auth/login-history';
  static const String pushSubscribe = '/auth/push/subscribe';
  static const String pushUnsubscribe = '/auth/push/unsubscribe';
  static const String pushDevices = '/auth/push/devices';

  // ── onboarding (apps/api/src/modules/auth/onboarding.controller.ts) ──
  static const String onboarding = '/auth/onboarding';
  static String onboardingComplete(String key) => '/auth/onboarding/complete/$key';
  static const String onboardingSeedDemo = '/auth/onboarding/seed-demo';

  // ── health (apps/api/src/health.controller.ts) ──
  static const String health = '/health';

  // ── inventory (apps/api/src/modules/inventory/inventory.controller.ts) ──
  static const String products = '/inventory/products';
  static const String productStats = '/inventory/products/stats';
  static String product(String id) => '/inventory/products/$id';
  static const String warehouses = '/inventory/warehouses';
  static const String stockLevels = '/inventory/stock-levels';
  static const String productCategories = '/inventory/categories';

  // ── notifications ──
  // Feed: apps/api/src/modules/communication/communication.controller.ts
  // (returns a plain array; status changes go through PUT .../status).
  static const String notifications = '/communication/notifications';
  static String notificationStatus(String id) =>
      '/communication/notifications/$id/status';

  // Preferences: apps/api/src/modules/notifications/notifications-deep.controller.ts
  static const String notificationPreferences = '/notifications/preferences';
  static const String notificationChannels = '/notifications/channels';
}
