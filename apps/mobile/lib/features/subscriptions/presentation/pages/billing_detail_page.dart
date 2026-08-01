import 'package:flutter/material.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/widgets/state_views.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../domain/entities/subscriptions.dart';
import '../providers/subscriptions_providers.dart';

class BillingDetailPage extends ConsumerWidget {
  const BillingDetailPage({required this.billingId, super.key});
  static const String routeName = 'billing-detail';
  static const String routePath = '/subscriptions/billing/:id';
  final String billingId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(subscriptionBillingCycleDetailProvider(billingId));
    return Scaffold(
      appBar: AppBar(title: const Text('Billing Cycle')),
      body: async.when(
        loading: () => const LoadingView(),
        error: (e, _) => FailureView(
          failure: e is Failure ? e : const ServerFailure('Could not load billing cycle.'),
          onRetry: () => ref.invalidate(subscriptionBillingCycleDetailProvider(billingId)),
        ),
        data: (b) => _BillingDetail(billing: b),
      ),
    );
  }
}

class _BillingDetail extends StatelessWidget {
  const _BillingDetail({required this.billing}); final SubscriptionBillingCycle billing;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final (String statusLabel, Color statusColor, Color statusBg) = switch (billing.status) {
      'PAID' => ('Paid', t.success, t.successLight),
      'PENDING' => ('Pending', t.textSecondary, t.bgSunken),
      'OVERDUE' => ('Overdue', t.danger, t.dangerLight),
      'CANCELED' => ('Canceled', t.textSecondary, t.bgSunken),
      _ => (billing.status, t.textSecondary, t.bgSunken),
    };

    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: [
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Icon(Icons.receipt_outlined, color: t.primary, size: 40),
            const SizedBox(width: Spacing.x3),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(billing.currency, style: Theme.of(context).textTheme.titleLarge),
              Text(Formatters.currency(billing.amount), style: TextStyle(color: t.textSecondary, fontSize: TypeScale.lg, fontWeight: TypeScale.semibold)),
            ],),),
            Container(padding: const EdgeInsets.symmetric(horizontal: Spacing.x2_5, vertical: Spacing.x1),
              decoration: BoxDecoration(color: statusBg, borderRadius: Radii.pill),
              child: Text(statusLabel, style: TextStyle(color: statusColor, fontSize: TypeScale.xs, fontWeight: TypeScale.medium)),),
          ],),
        ],),),
        const SizedBox(height: Spacing.x4),
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const _SectionTitle(title: 'Period'),
          _FieldRow('Start', Formatters.date(billing.periodStart)),
          _FieldRow('End', Formatters.date(billing.periodEnd)),
        ],),),
        const SizedBox(height: Spacing.x4),
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const _SectionTitle(title: 'Details'),
          _FieldRow('Amount', Formatters.currency(billing.amount)),
          _FieldRow('Currency', billing.currency),
          _FieldRow('Status', statusLabel),
          if (billing.paidAt != null) _FieldRow('Paid At', Formatters.dateTime(billing.paidAt!)),
          if (billing.createdAt != null) _FieldRow('Created', Formatters.dateTime(billing.createdAt!)),
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
