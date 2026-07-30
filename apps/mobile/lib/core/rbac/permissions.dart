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

  // crm
  static const String crmCustomerRead = 'crm.customer.read';
  static const String crmCustomerCreate = 'crm.customer.create';
  static const String crmCustomerUpdate = 'crm.customer.update';
  static const String crmCustomerDelete = 'crm.customer.delete';
  static const String crmContactRead = 'crm.contact.read';
  static const String crmContactCreate = 'crm.contact.create';
  static const String crmContactUpdate = 'crm.contact.update';
  static const String crmContactDelete = 'crm.contact.delete';
  static const String crmLeadRead = 'crm.lead.read';
  static const String crmLeadCreate = 'crm.lead.create';
  static const String crmLeadUpdate = 'crm.lead.update';
  static const String crmLeadDelete = 'crm.lead.delete';
  static const String crmActivityRead = 'crm.activity.read';
  static const String crmActivityCreate = 'crm.activity.create';
  static const String crmActivityUpdate = 'crm.activity.update';
  static const String crmActivityDelete = 'crm.activity.delete';
  static const String crmTemplateRead = 'crm.email_template.read';
  static const String crmTemplateCreate = 'crm.email_template.create';
  static const String crmTemplateUpdate = 'crm.email_template.update';
  static const String crmTemplateDelete = 'crm.email_template.delete';
  static const String crmSourceRead = 'crm.lead_source.read';
  static const String crmSourceCreate = 'crm.lead_source.create';
  static const String crmSourceDelete = 'crm.lead_source.delete';

  // admin
  static const String adminRead = 'admin.read';
  static const String adminUpdate = 'admin.update';
  static const String adminRoleCreate = 'admin.role.create';
  static const String adminRoleUpdate = 'admin.role.update';
  static const String adminRoleDelete = 'admin.role.delete';
  static const String adminSettingUpdate = 'admin.setting.update';
  static const String adminApiKeyCreate = 'admin.api_key.create';
  static const String adminApiKeyDelete = 'admin.api_key.delete';
  static const String adminTenantCreate = 'admin.tenant.create';

  // real_estate
  static const String realEstateRead = 'real_estate.read';
  static const String realEstateCreate = 'real_estate.create';
  static const String realEstateUpdate = 'real_estate.update';
  static const String realEstateDelete = 'real_estate.delete';

  // service_management
  static const String serviceManagementRead = 'service_management.read';
  static const String serviceManagementCreate = 'service_management.create';
  static const String serviceManagementUpdate = 'service_management.update';
  static const String serviceManagementDelete = 'service_management.delete';
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
