import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';

/// Connectivity signal used to decide between a live read and a cached one.
///
/// Reachability of the radio is not reachability of the API, so this is only a
/// hint — a request is still attempted and the cache is used on failure.
abstract class NetworkInfo {
  Future<bool> get isConnected;

  Stream<bool> get onConnectivityChanged;
}

class ConnectivityNetworkInfo implements NetworkInfo {
  ConnectivityNetworkInfo(this._connectivity);

  final Connectivity _connectivity;

  @override
  Future<bool> get isConnected async =>
      _hasConnection(await _connectivity.checkConnectivity());

  @override
  Stream<bool> get onConnectivityChanged => _connectivity.onConnectivityChanged
      .map(_hasConnection)
      .distinct();

  static bool _hasConnection(List<ConnectivityResult> results) =>
      results.any((ConnectivityResult r) => r != ConnectivityResult.none);
}
