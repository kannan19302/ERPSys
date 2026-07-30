import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/widgets/state_views.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/rbac/permissions.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/widgets/state_views.dart';
import '../../domain/entities/real_estate.dart';
import '../providers/real_estate_providers.dart';

class TenantDetailPage extends ConsumerWidget {
  const TenantDetailPage({required this.tenantId, super.key});
  static const String routeName = 'real-estate-tenant-detail';
  static const String routePath = '/real-estate/tenants/:id';
  final String tenantId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(tenantDetailProvider(tenantId));
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tenant'),
        actions: [PermissionGate(permission: Permissions.realEstateDelete, child: IconButton(
          icon: const Icon(Icons.delete_outline), tooltip: 'Delete tenant',
          onPressed: () async {
            final confirmed = await showDialog<bool>(context: context, builder: (c) => AlertDialog(
              title: const Text('Delete tenant?'), content: const Text('This cannot be undone.'),
              actions: [TextButton(onPressed: () => Navigator.of(c).pop(false), child: const Text('Cancel')),
                FilledButton(onPressed: () => Navigator.of(c).pop(true), child: const Text('Delete'))],
            ));
            if (confirmed != true || !context.mounted) return;
            final r = await ref.read(propertyListControllerProvider.notifier).deleteTenant(tenantId);
            if (!context.mounted) return;
            r.fold((f) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(f.message))), (_) => Navigator.of(context).pop());
          },
        ))],
      ),
      body: async.when(
        loading: () => const LoadingView(),
        error: (e, _) => FailureView(failure: e is Failure ? e : const ServerFailure('Could not load tenant.'), onRetry: () => ref.invalidate(tenantDetailProvider(tenantId))),
        data: (t) => _TenantDetail(tenant: t),
      ),
    );
  }
}

class _TenantDetail extends StatelessWidget {
  const _TenantDetail({required this.tenant});
  final TenantDetail tenant;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final (label, color, bg) = switch (tenant.status) {
      'ACTIVE' => ('Active', t.success, t.successLight),
      'INACTIVE' => ('Inactive', t.textSecondary, t.bgSunken),
      _ => ('Unknown', t.warning, t.warningLight),
    };

    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: [
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Icon(Icons.person, color: t.primary, size: 40),
            const SizedBox(width: Spacing.x3),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(tenant.name, style: Theme.of(context).textTheme.titleLarge),
              if (tenant.company != null) Text(tenant.company!, style: TextStyle(color: t.textSecondary)),
            ])),
            Container(padding: const EdgeInsets.symmetric(horizontal: Spacing.x2_5, vertical: Spacing.x1),
              decoration: BoxDecoration(color: bg, borderRadius: Radii.pill),
              child: Text(label, style: TextStyle(color: color, fontSize: TypeScale.xs, fontWeight: TypeScale.medium))),
          ]),
          if (tenant.notes != null && tenant.notes!.isNotEmpty) Padding(padding: const EdgeInsets.only(top: Spacing.x2), child: Text(tenant.notes!, style: TextStyle(color: t.textSecondary))),
        ])),
        const SizedBox(height: Spacing.x4),
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const _SectionTitle(title: 'Contact'),
          _FieldRow('Email', tenant.email ?? '—'),
          _FieldRow('Phone', tenant.phone ?? '—'),
          if (tenant.emergencyContact != null) _FieldRow('Emergency Contact', tenant.emergencyContact!),
          if (tenant.emergencyPhone != null) _FieldRow('Emergency Phone', tenant.emergencyPhone!),
        ])),
        const SizedBox(height: Spacing.x4),
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const _SectionTitle(title: 'Leasing Activity'),
          _FieldRow('Active Leases', '${tenant.leaseCount}'),
          _FieldRow('Total Rent', Formatters.currency(tenant.totalRent)),
          _FieldRow('Outstanding', Formatters.currency(tenant.outstandingBalance)),
        ])),
        if (tenant.createdAt != null) ...[
          const SizedBox(height: Spacing.x4),
          _SectionCard(child: _FieldRow('Created', Formatters.dateTime(tenant.createdAt!))),
        ],
      ],
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.child}); final Widget child;
  @override Widget build(BuildContext context) { final t = context.tokens; return Container(width: double.infinity, padding: const EdgeInsets.all(Spacing.x4), decoration: BoxDecoration(color: t.bgElevated, borderRadius: Radii.card, border: Border.all(color: t.border)), child: child); }
}
class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title}); final String title;
  @override Widget build(BuildContext context) => Padding(padding: const EdgeInsets.only(bottom: Spacing.x3), child: Text(title, style: Theme.of(context).textTheme.titleMedium));
}
class _FieldRow extends StatelessWidget {
  const _FieldRow(this.label, this.value); final String label; final String value;
  @override Widget build(BuildContext context) { final t = context.tokens; return Padding(padding: const EdgeInsets.symmetric(vertical: Spacing.x1_5), child: Row(children: [Expanded(child: Text(label, style: TextStyle(color: t.textSecondary))), Text(value, style: Theme.of(context).textTheme.labelLarge)])); }
}