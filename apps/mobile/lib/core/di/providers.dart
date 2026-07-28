import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../connectivity/network_info.dart';
import '../network/api_client.dart';
import '../storage/cookie_store.dart';
import '../storage/response_cache.dart';
import '../storage/secure_session_store.dart';

/// Composition root for infrastructure.
///
/// Everything async (preferences, cookie jar, HTTP client) is resolved once in
/// `bootstrap()` and injected by overriding these providers, so no widget ever
/// awaits a dependency and every one of them is trivially replaceable in tests.
final Provider<SharedPreferences> sharedPreferencesProvider =
    Provider<SharedPreferences>(
  (Ref ref) => throw UnimplementedError('Override in bootstrap()'),
);

final Provider<CookieStore> cookieStoreProvider = Provider<CookieStore>(
  (Ref ref) => throw UnimplementedError('Override in bootstrap()'),
);

final Provider<ApiClient> apiClientProvider = Provider<ApiClient>(
  (Ref ref) => throw UnimplementedError('Override in bootstrap()'),
);

final Provider<SecureSessionStore> secureSessionStoreProvider =
    Provider<SecureSessionStore>(
  (Ref ref) => const SecureSessionStore(SecureSessionStore.defaultStorage),
);

final Provider<ResponseCache> responseCacheProvider = Provider<ResponseCache>(
  (Ref ref) => ResponseCache(ref.watch(sharedPreferencesProvider)),
);

final Provider<NetworkInfo> networkInfoProvider = Provider<NetworkInfo>(
  (Ref ref) => ConnectivityNetworkInfo(Connectivity()),
);

/// Live online/offline signal for banners and cache decisions.
final StreamProvider<bool> connectivityProvider = StreamProvider<bool>(
  (Ref ref) => ref.watch(networkInfoProvider).onConnectivityChanged,
);
