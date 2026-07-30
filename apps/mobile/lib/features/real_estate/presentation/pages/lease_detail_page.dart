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

class LeaseDetailPage extends ConsumerWidget {
  const LeaseDetailPage({required this.leaseId, super.key});
  static const String routeName = 'lease-detail';
  static const String routePath = '/real-estate/leases/:id';
  final String leaseId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(leaseDetailProvider(leaseId));
    return Scaffold(
      appBar: AppBar(
        title: const Text('Lease'),
        actions: [PermissionGate(permission: Permissions.realEstateDelete, child: IconButton(
          icon: const Icon(Icons.delete_outline), tooltip: 'Delete lease',
          onPressed: () async {
            final confirmed = await showDialog<bool>(context: context, builder: (c) => AlertDialog(
              title: const Text('Delete lease?'), content: const Text('This cannot be undone.'),
              actions: [TextButton(onPressed: () => Navigator.of(c).pop(false), child: const Text('Cancel')),
                FilledButton(onPressed: () => Navigator.of(c).pop(true), child: const Text('Delete'))],
            ));
            if (confirmed != true || !context.mounted) return;
            final r = await ref.read(propertyListControllerProvider.notifier).deleteLease(leaseId);
            if (!context.mounted) return;
            r.fold((f) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(f.message))), (_) => Navigator.of(context).pop());
          },
        ))],
      ),
      body: async.when(
        loading: () => const LoadingView(),
        error: (e, _) => FailureView(failure: e is Failure ? e : const ServerFailure('Could not load lease.'), onRetry: () => ref.invalidate(leaseDetailProvider(leaseId))),
        data: (l) => _LeaseDetail(lease: l),
      ),
    );
  }
}

class _LeaseDetail extends StatelessWidget {
  const _LeaseDetail({required this.lease});
  final Lease lease;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final (label, color, bg) = switch (lease.status) {
      'ACTIVE' => ('Active', t.success, t.successLight),
      'PENDING' => ('Pending', t.warning, t.warningLight),
      'EXPIRED' => ('Expired', t.textSecondary, t.bgSunken),
      'TERMINATED' => ('Terminated', t.danger, t.dangerLight),
      _ => ('Unknown', t.warning, t.warningLight),
    };
    final isExpired = lease.endDate != null && lease.endDate!.isBefore(DateTime.now());

    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: [
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Icon(Icons.description, color: t.primary, size: 40),
            const SizedBox(width: Spacing.x3),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Lease ${lease.leaseNumber}', style: Theme.of(context).textTheme.titleLarge),
              Text(lease.propertyName, style: TextStyle(color: t.textSecondary)),
            ])),
            Column(children: [
              Container(padding: const EdgeInsets.symmetric(horizontal: Spacing.x2_5, vertical: Spacing.x1),
                decoration: BoxDecoration(color: bg, borderRadius: Radii.pill),
                child: Text(label, style: TextStyle(color: color, fontSize: TypeScale.xs, fontWeight: TypeScale.medium))),
              if (isExpired) const SizedBox(height: Spacing.x1),
              if (isExpired) Text('Overdue', style: TextStyle(color: t.danger, fontSize: TypeScale.xs)),
            ]),
          ]),
          if (lease.notes != null && lease.notes!.isNotEmpty) Padding(padding: const EdgeInsets.only(top: Spacing.x2), child: Text(lease.notes!, style: TextStyle(color: t.textSecondary))),
        ])),
        const SizedBox(height: Spacing.x4),
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const _SectionTitle(title: 'Tenant'),
          _FieldRow('Name', lease.tenantName ?? '—'),
          _FieldRow('Unit', lease.unitLabel ?? '—'),
        ])),
        const SizedBox(height: Spacing.x4),
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const _SectionTitle(title: 'Term'),
          _FieldRow('Start', lease.startDate != null ? Formatters.date(lease.startDate!) : '—'),
          _FieldRow('End', lease.endDate != null ? Formatters.date(lease.endDate!) : '—'),
          if (lease.startDate != null && lease.endDate != null)
            _FieldRow('Duration', '${lease.endDate!.difference(lease.startDate!).inDays ~/ 30} months'),
        ])),
        const SizedBox(height: Spacing.x4),
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const _SectionTitle(title: 'Financials'),
          _FieldRow('Monthly Rent', Formatters.currency(lease.monthlyRent, currencyCode: lease.currency)),
          _FieldRow('Security Deposit', Formatters.currency(lease.securityDeposit, currencyCode: lease.currency)),
          _FieldRow('Payment Day', '${lease.paymentDay}'),
          if (lease.renewalTerms != null) _FieldRow('Renewal Terms', lease.renewalTerms!),
        ])),
        if (lease.createdAt != null) ...[
          const SizedBox(height: Spacing.x4),
          _SectionCard(child: _FieldRow('Created', Formatters.dateTime(lease.createdAt!))),
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