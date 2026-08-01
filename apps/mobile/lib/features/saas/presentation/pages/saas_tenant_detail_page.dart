import 'package:flutter/material.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/widgets/state_views.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../domain/entities/saas.dart';
import '../providers/saas_providers.dart';

class SaasTenantDetailPage extends ConsumerWidget {
  const SaasTenantDetailPage({required this.tenantId, super.key});
  static const String routeName = 'saas-tenant-detail';
  static const String routePath = '/saas/tenants/:id';
  final String tenantId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(saasTenantDetailProvider(tenantId));
    return Scaffold(
      appBar: AppBar(title: const Text('Tenant')),
      body: async.when(
        loading: () => const LoadingView(),
        error: (e, _) => FailureView(
          failure: e is Failure ? e : const ServerFailure('Could not load tenant.'),
          onRetry: () => ref.invalidate(saasTenantDetailProvider(tenantId)),
        ),
        data: (t) => _TenantDetail(tenant: t),
      ),
    );
  }
}

class _TenantDetail extends StatelessWidget {
  const _TenantDetail({required this.tenant}); final SaasTenant tenant;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final (String statusLabel, Color statusColor, Color statusBg) = switch (tenant.status) {
      'ACTIVE' => ('Active', t.success, t.successLight),
      'SUSPENDED' => ('Suspended', t.danger, t.dangerLight),
      _ => ('Inactive', t.textSecondary, t.bgSunken),
    };

    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: [
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Icon(Icons.business, color: t.primary, size: 40),
            const SizedBox(width: Spacing.x3),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(tenant.organizationName, style: Theme.of(context).textTheme.titleLarge),
              if (tenant.domain != null) Text(tenant.domain!, style: TextStyle(color: t.textSecondary)),
            ],),),
            Container(padding: const EdgeInsets.symmetric(horizontal: Spacing.x2_5, vertical: Spacing.x1),
              decoration: BoxDecoration(color: statusBg, borderRadius: Radii.pill),
              child: Text(statusLabel, style: TextStyle(color: statusColor, fontSize: TypeScale.xs, fontWeight: TypeScale.medium)),),
          ],),
        ],),),
        const SizedBox(height: Spacing.x4),
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const _SectionTitle(title: 'Details'),
          _FieldRow('Plan', tenant.planName ?? '—'),
          _FieldRow('Users', '${tenant.userCount}'),
          _FieldRow('Storage Used', '${tenant.storageUsed.toStringAsFixed(1)} GB'),
        ],),),
        const SizedBox(height: Spacing.x4),
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const _SectionTitle(title: 'Timeline'),
          if (tenant.createdAt != null) _FieldRow('Created', Formatters.dateTime(tenant.createdAt!)),
          if (tenant.updatedAt != null) _FieldRow('Updated', Formatters.dateTime(tenant.updatedAt!)),
        ],),),
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
