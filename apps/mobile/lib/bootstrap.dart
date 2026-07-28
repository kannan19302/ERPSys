import 'dart:io';

import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'app/app.dart';
import 'core/di/providers.dart';
import 'core/logging/app_logger.dart';
import 'core/network/api_client.dart';
import 'core/storage/cookie_store.dart';
import 'core/storage/secure_session_store.dart';
import 'features/auth/presentation/providers/auth_providers.dart';

const AppLogger _log = AppLogger('bootstrap');

/// Wires the async infrastructure (preferences, cookie jar, HTTP client) once
/// and hands the app a fully-formed [ProviderScope]. Called from each
/// flavor's `main()`.
Future<void> bootstrap() async {
  WidgetsFlutterBinding.ensureInitialized();

  final SharedPreferences prefs = await SharedPreferences.getInstance();
  final CookieStore cookieStore = await CookieStore.create();
  final String installId = await _resolveInstallId();

  // secureSessionStoreProvider has no async dependencies, so it can be built
  // directly without a container — that lets ApiClient.create() (which needs
  // it) run BEFORE the container exists, avoiding Riverpod's rule that a
  // container's override set can be updated but never resized after creation.
  const SecureSessionStore sessionStore = SecureSessionStore(
    SecureSessionStore.defaultStorage,
  );

  // `container` is assigned after creation; the closure only runs later, once
  // a request actually gets a 401, by which point it's always set.
  late final ProviderContainer container;

  final ApiClient apiClient = await ApiClient.create(
    cookieStore: cookieStore,
    sessionStore: sessionStore,
    installId: installId,
    onSessionExpired: () async {
      container.read(authControllerProvider.notifier).onSessionExpired();
    },
  );

  container = ProviderContainer(
    overrides: <Override>[
      sharedPreferencesProvider.overrideWithValue(prefs),
      cookieStoreProvider.overrideWithValue(cookieStore),
      secureSessionStoreProvider.overrideWithValue(sessionStore),
      apiClientProvider.overrideWithValue(apiClient),
    ],
  );

  FlutterError.onError = (FlutterErrorDetails details) {
    _log.error(
      'Uncaught Flutter error',
      error: details.exception,
      stackTrace: details.stack,
    );
    FlutterError.presentError(details);
  };

  runApp(
    UncontrolledProviderScope(
      container: container,
      child: const UniErpApp(),
    ),
  );
}

/// Stable per-install identifier attached to every request as
/// `x-client-install`, purely for support correlation — never used for auth.
Future<String> _resolveInstallId() async {
  try {
    final PackageInfo info = await PackageInfo.fromPlatform();
    final DeviceInfoPlugin deviceInfo = DeviceInfoPlugin();
    if (Platform.isAndroid) {
      final AndroidDeviceInfo android = await deviceInfo.androidInfo;
      return '${info.packageName}-${android.id}';
    }
    if (Platform.isIOS) {
      final IosDeviceInfo ios = await deviceInfo.iosInfo;
      return '${info.packageName}-${ios.identifierForVendor ?? ios.name}';
    }
    return info.packageName;
  } on Object catch (error) {
    _log.warn('Could not resolve install id', data: <String, Object?>{'error': '$error'});
    return 'unknown-install';
  }
}
