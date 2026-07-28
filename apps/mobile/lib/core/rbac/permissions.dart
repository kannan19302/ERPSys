/// Permission keys used by the mobile surface.
///
/// These are the same `module.resource.action` strings the API's `RbacGuard`
/// enforces via `@Permissions(...)` and that live in the canonical registry at
/// `packages/shared/src/permissions/registry.ts`. Nothing new is defined here —
/// every constant below already gates an existing endpoint, so the client can
/// hide an action the server would reject anyway.
///
/// Client-side checks are UX only. The API remains the sole authority; a hidden
/// button is a convenience, never a security control.
class Permissions {
  const Permissions._();

  // auth
  static const String authRead = 'auth.read';
  static const String authUpdate = 'auth.update';
  static const String sessionRead = 'auth.session.read';
  static const String sessionRevoke = 'auth.session.revoke';

  // inventory
  static const String productRead = 'inventory.product.read';
  static const String productCreate = 'inventory.product.create';
  static const String productUpdate = 'inventory.product.update';
  static const String productDelete = 'inventory.product.delete';
  static const String warehouseRead = 'inventory.warehouse.read';
  static const String stockRead = 'inventory.stock.read';

  // communication / notifications
  static const String notificationRead = 'communication.notification.read';
  static const String notificationUpdate = 'communication.notification.update';
}

/// The permission set resolved for the current session.
///
/// The login and refresh responses carry `user.permissions`; a wildcard grant
/// (`*` or `module.*`) is honoured the same way the backend guard does.
class PermissionSet {
  PermissionSet(Iterable<String> permissions)
      : _granted = Set<String>.unmodifiable(permissions);

  const PermissionSet.empty() : _granted = const <String>{};

  final Set<String> _granted;

  Set<String> get all => _granted;

  bool get isEmpty => _granted.isEmpty;

  bool has(String permission) {
    if (_granted.contains('*') || _granted.contains(permission)) return true;

    // `module.*` / `module.resource.*` wildcards, matched on the "." boundary
    // exactly as `hasPermission()` in packages/shared/src/utils/index.ts does:
    // a grant of `finance.*` covers `finance` and `finance.invoice.create`, but
    // never an unrelated `financeops.read`.
    for (final String grant in _granted) {
      if (!grant.endsWith('.*')) continue;
      final String prefix = grant.substring(0, grant.length - 2);
      if (permission == prefix || permission.startsWith('$prefix.')) return true;
    }
    return false;
  }

  bool hasAny(Iterable<String> permissions) => permissions.any(has);

  bool hasAll(Iterable<String> permissions) => permissions.every(has);
}
