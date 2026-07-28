import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/auth/presentation/providers/auth_providers.dart';
import '../rbac/permissions.dart';

/// Mobile counterpart of the web `<ProtectedComponent permission="x">`
/// (AGENTS.md Rule 23): every privileged action is wrapped so it renders only
/// when the session actually carries the permission.
///
/// This is presentation only. The API's `RbacGuard` still enforces the same
/// permission on the endpoint, so hiding the control never becomes the control.
class PermissionGate extends ConsumerWidget {
  const PermissionGate({
    required String this.permission,
    required this.child,
    this.fallback,
    super.key,
  })  : _allOf = null,
        _anyOf = null;

  /// Requires every listed permission (matches the guard's `.every()`).
  const PermissionGate.all({
    required List<String> permissions,
    required this.child,
    this.fallback,
    super.key,
  })  : permission = null,
        _allOf = permissions,
        _anyOf = null;

  /// Requires at least one — for a screen reachable by several roles.
  const PermissionGate.any({
    required List<String> permissions,
    required this.child,
    this.fallback,
    super.key,
  })  : permission = null,
        _allOf = null,
        _anyOf = permissions;

  final String? permission;
  final List<String>? _allOf;
  final List<String>? _anyOf;
  final Widget child;
  final Widget? fallback;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final PermissionSet granted = ref.watch(permissionSetProvider);

    final String? single = permission;
    final List<String>? allOf = _allOf;
    final List<String>? anyOf = _anyOf;

    final bool allowed = single != null
        ? granted.has(single)
        : allOf != null
            ? granted.hasAll(allOf)
            : anyOf != null && granted.hasAny(anyOf);

    if (allowed) return child;
    return fallback ?? const SizedBox.shrink();
  }
}
