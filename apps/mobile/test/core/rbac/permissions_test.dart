import 'package:flutter_test/flutter_test.dart';
import 'package:unerp_mobile/core/rbac/permissions.dart';

void main() {
  group('PermissionSet', () {
    test('empty set grants nothing', () {
      const PermissionSet set = PermissionSet.empty();
      expect(set.isEmpty, isTrue);
      expect(set.has('inventory.product.read'), isFalse);
    });

    test('exact match is granted', () {
      final PermissionSet set = PermissionSet(<String>['inventory.product.read']);
      expect(set.has('inventory.product.read'), isTrue);
      expect(set.has('inventory.product.update'), isFalse);
    });

    test('super-admin wildcard "*" grants everything', () {
      final PermissionSet set = PermissionSet(<String>['*']);
      expect(set.has('inventory.product.read'), isTrue);
      expect(set.has('anything.at.all'), isTrue);
    });

    test('module-level wildcard grants its resources', () {
      final PermissionSet set = PermissionSet(<String>['finance.*']);
      expect(set.has('finance'), isTrue);
      expect(set.has('finance.invoice.create'), isTrue);
      expect(set.has('finance.invoice.approve'), isTrue);
    });

    test('wildcard respects the "." boundary — no accidental prefix match', () {
      // Mirrors the doc comment on hasPermission() in
      // packages/shared/src/utils/index.ts: "finance.invoice.*" must not also
      // match "finance.invoiceapproval.create" just because the raw string
      // happens to start with the same characters.
      final PermissionSet set = PermissionSet(<String>['finance.invoice.*']);
      expect(set.has('finance.invoice.create'), isTrue);
      expect(set.has('finance.invoiceapproval.create'), isFalse);
    });

    test('resource-level wildcard scopes correctly', () {
      final PermissionSet set = PermissionSet(<String>['inventory.product.*']);
      expect(set.has('inventory.product.create'), isTrue);
      expect(set.has('inventory.product.delete'), isTrue);
      expect(set.has('inventory.warehouse.read'), isFalse);
    });

    test('hasAny requires at least one match', () {
      final PermissionSet set = PermissionSet(<String>['auth.read']);
      expect(
        set.hasAny(<String>['inventory.product.read', 'auth.read']),
        isTrue,
      );
      expect(
        set.hasAny(<String>['inventory.product.read', 'inventory.warehouse.read']),
        isFalse,
      );
    });

    test('hasAll requires every permission to be present', () {
      final PermissionSet set = PermissionSet(<String>[
        'inventory.product.read',
        'inventory.product.create',
      ]);
      expect(
        set.hasAll(<String>['inventory.product.read', 'inventory.product.create']),
        isTrue,
      );
      expect(
        set.hasAll(<String>['inventory.product.read', 'inventory.product.delete']),
        isFalse,
      );
    });
  });
}
