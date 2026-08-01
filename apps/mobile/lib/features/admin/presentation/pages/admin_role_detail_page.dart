import 'package:flutter/material.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/widgets/state_views.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/rbac/permissions.dart';
import '../../domain/entities/admin.dart';
import '../providers/admin_providers.dart';

class AdminRoleDetailPage extends ConsumerWidget {
  const AdminRoleDetailPage({required this.roleId, super.key});
  static const String routeName = 'admin-role-detail';
  static const String routePath = '/admin/roles/:id';
  final String roleId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<AdminRole> roleAsync = ref.watch(adminRoleDetailProvider(roleId));
    final Palette t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Role'),
        actions: <Widget>[
          PermissionGate(
            permission: Permissions.adminRoleUpdate,
            child: roleAsync.whenOrNull(
              data: (AdminRole role) => role.isSystem
                  ? const SizedBox.shrink()
                  : IconButton(
                      icon: const Icon(Icons.edit_outlined),
                      onPressed: () => context.pushNamed('admin-role-edit',
                          pathParameters: <String, String>{'id': role.id},),
                    ),
            ) ?? const SizedBox.shrink(),
          ),
        ],
      ),
      body: roleAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load role.'),
          onRetry: () => ref.invalidate(adminRoleDetailProvider(roleId)),
        ),
        data: (AdminRole role) => ListView(
          padding: const EdgeInsets.all(Spacing.x4),
          children: <Widget>[
            _SectionCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Row(
                    children: <Widget>[
                      Expanded(child: Text(role.name, style: Theme.of(context).textTheme.titleLarge)),
                      if (role.isSystem)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: Spacing.x2_5, vertical: Spacing.x1),
                          decoration: BoxDecoration(color: t.infoLight, borderRadius: Radii.pill),
                          child: Text('System', style: TextStyle(color: t.info, fontSize: TypeScale.xs, fontWeight: TypeScale.medium)),
                        ),
                    ],
                  ),
                  if (role.description != null) ...<Widget>[
                    const SizedBox(height: Spacing.x2),
                    Text(role.description!, style: TextStyle(color: t.textSecondary)),
                  ],
                ],
              ),
            ),
            const SizedBox(height: Spacing.x4),
            _SectionCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  const _SectionTitle(title: 'Details'),
                  _FieldRow('Users assigned', '${role.userCount}'),
                  _FieldRow('Permissions', '${role.permissions.length}'),
                ],
              ),
            ),
            const SizedBox(height: Spacing.x4),
            _SectionCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  const _SectionTitle(title: 'Permissions'),
                  if (role.permissions.isEmpty)
                    Text('No permissions assigned', style: TextStyle(color: t.textTertiary))
                  else
                    ...role.permissions.map((String p) => Container(
                      width: double.infinity,
                      margin: const EdgeInsets.only(bottom: Spacing.x1_5),
                      padding: const EdgeInsets.symmetric(horizontal: Spacing.x2_5, vertical: Spacing.x1_5),
                      decoration: BoxDecoration(color: t.bgSunken, borderRadius: Radii.control),
                      child: Text(p, style: const TextStyle(fontSize: TypeScale.xs, fontFamily: 'monospace')),
                    ),),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.child});
  final Widget child;
  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(Spacing.x4),
      decoration: BoxDecoration(color: t.bgElevated, borderRadius: Radii.card, border: Border.all(color: t.border)),
      child: child,
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title});
  final String title;
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: Spacing.x3),
      child: Text(title, style: Theme.of(context).textTheme.titleMedium),
    );
  }
}

class _FieldRow extends StatelessWidget {
  const _FieldRow(this.label, this.value);
  final String label;
  final String value;
  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: Spacing.x1_5),
      child: Row(
        children: <Widget>[
          Expanded(child: Text(label, style: TextStyle(color: t.textSecondary))),
          Text(value, style: Theme.of(context).textTheme.labelLarge),
        ],
      ),
    );
  }
}