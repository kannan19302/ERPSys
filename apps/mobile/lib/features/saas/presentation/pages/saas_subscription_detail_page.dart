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
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../domain/entities/saas.dart';
import '../providers/saas_providers.dart';

class SaasSubscriptionDetailPage extends ConsumerWidget {
  const SaasSubscriptionDetailPage({required this.subscriptionId, super.key});
  static const String routeName = 'saas-subscription-detail';
  static const String routePath = '/saas/subscriptions/:id';
  final String subscriptionId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(saasSubscriptionDetailProvider(subscriptionId));
    return Scaffold(
      appBar: AppBar(title: const Text('Subscription')),
      body: async.when(
        loading: () => const LoadingView(),
        error: (e, _) => FailureView(
          failure: e is Failure ? e : const ServerFailure('Could not load subscription.'),
          onRetry: () => ref.invalidate(saasSubscriptionDetailProvider(subscriptionId)),
        ),
        data: (s) => _SubscriptionDetail(subscription: s),
      ),
    );
  }
}

class _SubscriptionDetail extends StatelessWidget {
  const _SubscriptionDetail({required this.subscription}); final SaasSubscription subscription;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final (String statusLabel, Color statusColor, Color statusBg) = switch (subscription.status) {
      'ACTIVE' => ('Active', t.success, t.successLight),
      'TRIALING' => ('Trialing', t.info, t.infoLight),
      'CANCELED' => ('Canceled', t.textSecondary, t.bgSunken),
      'PAST_DUE' => ('Past Due', t.danger, t.dangerLight),
      _ => (subscription.status, t.textSecondary, t.bgSunken),
    };

    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: [
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Icon(Icons.subscriptions_outlined, color: t.primary, size: 40),
            const SizedBox(width: Spacing.x3),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(subscription.planName, style: Theme.of(context).textTheme.titleLarge),
              if (subscription.stripeSubscriptionId != null) Text(subscription.stripeSubscriptionId!, style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs)),
            ])),
            Container(padding: const EdgeInsets.symmetric(horizontal: Spacing.x2_5, vertical: Spacing.x1),
              decoration: BoxDecoration(color: statusBg, borderRadius: Radii.pill),
              child: Text(statusLabel, style: TextStyle(color: statusColor, fontSize: TypeScale.xs, fontWeight: TypeScale.medium))),
          ]),
        ])),
        const SizedBox(height: Spacing.x4),
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const _SectionTitle(title: 'Period'),
          if (subscription.currentPeriodStart != null) _FieldRow('Start', Formatters.date(subscription.currentPeriodStart!)),
          if (subscription.currentPeriodEnd != null) _FieldRow('End', Formatters.date(subscription.currentPeriodEnd!)),
          if (subscription.trialEndsAt != null) _FieldRow('Trial Ends', Formatters.date(subscription.trialEndsAt!)),
          _FieldRow('Cancel at Period End', subscription.cancelAtPeriodEnd ? 'Yes' : 'No'),
        ])),
        const SizedBox(height: Spacing.x4),
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const _SectionTitle(title: 'Timeline'),
          if (subscription.createdAt != null) _FieldRow('Created', Formatters.dateTime(subscription.createdAt!)),
          if (subscription.updatedAt != null) _FieldRow('Updated', Formatters.dateTime(subscription.updatedAt!)),
        ])),
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
