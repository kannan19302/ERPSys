import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../error/exceptions.dart';

/// Keychain (iOS) / EncryptedSharedPreferences (Android) storage for the
/// session. The short-lived access token returned in the login response body
/// lives here; the refresh token never does — it stays an httpOnly cookie
/// managed by [CookieStore], exactly as on web (see `sealSessionCookies` in
/// apps/api/src/modules/auth/auth.controller.ts).
class SecureSessionStore {
  const SecureSessionStore(this._storage);

  static const String _kAccessToken = 'unerp.access_token';
  static const String _kUser = 'unerp.user';
  static const String _kTenant = 'unerp.tenant';
  static const String _kPermissions = 'unerp.permissions';
  static const String _kBiometricEnabled = 'unerp.biometric_enabled';

  static const FlutterSecureStorage defaultStorage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock_this_device,
    ),
  );

  final FlutterSecureStorage _storage;

  Future<String?> readAccessToken() => _guard(() => _storage.read(key: _kAccessToken));

  Future<void> writeAccessToken(String token) =>
      _guard(() => _storage.write(key: _kAccessToken, value: token));

  Future<Map<String, dynamic>?> readUser() async => _readJson(_kUser);

  Future<void> writeUser(Map<String, dynamic> user) => _writeJson(_kUser, user);

  Future<Map<String, dynamic>?> readTenant() async => _readJson(_kTenant);

  Future<void> writeTenant(Map<String, dynamic> tenant) => _writeJson(_kTenant, tenant);

  Future<List<String>> readPermissions() async {
    final String? raw = await _guard(() => _storage.read(key: _kPermissions));
    if (raw == null || raw.isEmpty) return const <String>[];
    final Object? decoded = jsonDecode(raw);
    if (decoded is! List) return const <String>[];
    return decoded.map((Object? e) => '$e').toList(growable: false);
  }

  Future<void> writePermissions(List<String> permissions) =>
      _guard(() => _storage.write(key: _kPermissions, value: jsonEncode(permissions)));

  Future<bool> readBiometricEnabled() async =>
      await _guard(() => _storage.read(key: _kBiometricEnabled)) == 'true';

  Future<void> writeBiometricEnabled({required bool enabled}) => _guard(
        () => _storage.write(key: _kBiometricEnabled, value: '$enabled'),
      );

  /// Wipes every session artefact. Called on logout and on a dead refresh token.
  Future<void> clear() async {
    await _guard(() async {
      await Future.wait<void>(<Future<void>>[
        _storage.delete(key: _kAccessToken),
        _storage.delete(key: _kUser),
        _storage.delete(key: _kTenant),
        _storage.delete(key: _kPermissions),
      ]);
    });
  }

  Future<Map<String, dynamic>?> _readJson(String key) async {
    final String? raw = await _guard(() => _storage.read(key: key));
    if (raw == null || raw.isEmpty) return null;
    final Object? decoded = jsonDecode(raw);
    return decoded is Map<String, dynamic> ? decoded : null;
  }

  Future<void> _writeJson(String key, Map<String, dynamic> value) =>
      _guard(() => _storage.write(key: key, value: jsonEncode(value)));

  Future<T> _guard<T>(Future<T> Function() action) async {
    try {
      return await action();
    } on Object catch (error) {
      throw CacheException('Secure storage unavailable: $error');
    }
  }
}
