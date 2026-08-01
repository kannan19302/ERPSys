import 'package:flutter/material.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/widgets/state_views.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../domain/entities/admin.dart';
import '../providers/admin_providers.dart';

class AdminTenantDetailPage extends ConsumerWidget {
  const AdminTenantDetailPage({required this.tenantId, super.key});
  static const String routeName = 'admin-tenant-detail';
  static const String routePath = '/admin/tenants/:id';
  final String tenantId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<AdminTenant> tenantAsync = ref.watch(adminTenantDetailProvider(tenantId));
    final Palette t = context.tokens;

    return Scaffold(
      appBar: AppBar(title: const Text('Tenant')),
      body: tenantAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load tenant.'),
          onRetry: () => ref.invalidate(adminTenantDetailProvider(tenantId)),
        ),
        data: (AdminTenant tenant) => ListView(
          padding: const EdgeInsets.all(Spacing.x4),
          children: <Widget>[
            _SectionCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Row(children: <Widget>[
                    Expanded(child: Text(tenant.name, style: Theme.of(context).textTheme.titleLarge)),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: Spacing.x2_5, vertical: Spacing.x1),
                      decoration: BoxDecoration(
                        color: tenant.status == 'ACTIVE' ? t.successLight : (tenant.status == 'SUSPENDED' ? t.warningLight : t.bgSunken),
                        borderRadius: Radii.pill,
                      ),
                      child: Text(tenant.status,
                          style: TextStyle(
                            color: tenant.status == 'ACTIVE' ? t.success : (tenant.status == 'SUSPENDED' ? t.warning : t.textSecondary),
                            fontSize: TypeScale.xs, fontWeight: TypeScale.medium,
                          ),),
                    ),
                  ],),
                ],
              ),
            ),
            const SizedBox(height: Spacing.x4),
            _SectionCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  const _SectionTitle(title: 'Details'),
                  _FieldRow('Name', tenant.name),
                  _FieldRow('Slug', tenant.slug),
                  _FieldRow('Domain', tenant.domain ?? '—'),
                  _FieldRow('Plan', tenant.plan),
                  _FieldRow('Status', tenant.status),
                ],
              ),
            ),
            const SizedBox(height: Spacing.x4),
            _SectionCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  const _SectionTitle(title: 'Usage'),
                  _FieldRow('Users', '${tenant.userCount}'),
                  if (tenant.createdAt != null)
                    _FieldRow('Created', '${tenant.createdAt!.year}-${tenant.createdAt!.month.toString().padLeft(2, '0')}-${tenant.createdAt!.day.toString().padLeft(2, '0')}'),
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
      width: double.infinity, padding: const EdgeInsets.all(Spacing.x4),
      decoration: BoxDecoration(color: t.bgElevated, borderRadius: Radii.card, border: Border.all(color: t.border)),
      child: child,
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title});
  final String title;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: Spacing.x3),
    child: Text(title, style: Theme.of(context).textTheme.titleMedium),
  );
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
      child: Row(children: <Widget>[
        Expanded(child: Text(label, style: TextStyle(color: t.textSecondary))),
        Text(value, style: Theme.of(context).textTheme.labelLarge),
      ],),
    );
  }
}