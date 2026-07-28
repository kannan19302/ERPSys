import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../config/env.dart';

/// Tenant-scoped read-through cache for GET responses.
///
/// Purpose is offline continuity, not a second source of truth: entries are
/// written only after a successful API read and are always tagged with the
/// tenant that produced them, so a tenant switch can never surface another
/// tenant's rows (the mobile mirror of the backend's tenant isolation rule).
class ResponseCache {
  ResponseCache(this._prefs);

  static const String _prefix = 'unerp.cache.';

  final SharedPreferences _prefs;

  String _key(String tenantId, String namespace, String suffix) =>
      '$_prefix$tenantId.$namespace.$suffix';

  Future<void> write(
    String tenantId,
    String namespace,
    String suffix,
    Object payload,
  ) async {
    final Map<String, Object?> entry = <String, Object?>{
      'at': DateTime.now().toUtc().toIso8601String(),
      'payload': payload,
    };
    await _prefs.setString(_key(tenantId, namespace, suffix), jsonEncode(entry));
  }

  /// Returns the cached payload when present and younger than [Env.cacheTtl].
  CachedEntry<T>? read<T>(String tenantId, String namespace, String suffix) {
    final String? raw = _prefs.getString(_key(tenantId, namespace, suffix));
    if (raw == null) return null;

    final Object? decoded = jsonDecode(raw);
    if (decoded is! Map<String, dynamic>) return null;

    final DateTime? at = DateTime.tryParse('${decoded['at']}');
    final Object? payload = decoded['payload'];
    if (at == null || payload is! T) return null;

    return CachedEntry<T>(
      value: payload,
      cachedAt: at,
      isStale: DateTime.now().toUtc().difference(at) > Env.cacheTtl,
    );
  }

  /// Drops every entry for a tenant — used on logout and on tenant switch.
  Future<void> clearTenant(String tenantId) async {
    final String scope = '$_prefix$tenantId.';
    for (final String key in _prefs.getKeys().toList(growable: false)) {
      if (key.startsWith(scope)) {
        await _prefs.remove(key);
      }
    }
  }

  Future<void> clearAll() async {
    for (final String key in _prefs.getKeys().toList(growable: false)) {
      if (key.startsWith(_prefix)) {
        await _prefs.remove(key);
      }
    }
  }
}

class CachedEntry<T> {
  const CachedEntry({
    required this.value,
    required this.cachedAt,
    required this.isStale,
  });

  final T value;
  final DateTime cachedAt;

  /// Still served when offline, but the UI must label it as stale.
  final bool isStale;
}
