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
import '../../domain/entities/pwa.dart';
import '../providers/pwa_providers.dart';

class PushSubscriptionDetailPage extends ConsumerWidget {
  const PushSubscriptionDetailPage({required this.subscriptionId, super.key});
  static const String routeName = 'push-subscription-detail';
  static const String routePath = '/pwa/push-subscriptions/:id';
  final String subscriptionId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(pushSubscriptionListControllerProvider);
    final item = state.items.where((s) => s.id == subscriptionId).firstOrNull;
    if (state.isLoading) return const Scaffold(body: LoadingView());
    if (item == null) return Scaffold(
      appBar: AppBar(title: const Text('Push Subscription')),
      body: const FailureView(failure: NotFoundFailure('Subscription not found')),
    );
    return Scaffold(
      appBar: AppBar(title: const Text('Push Subscription')),
      body: _SubscriptionDetail(subscription: item),
    );
  }
}

class _SubscriptionDetail extends StatelessWidget {
  const _SubscriptionDetail({required this.subscription});
  final PwaPushSubscription subscription;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: [
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Icon(Icons.notifications_active_outlined, color: t.primary, size: 40),
            const SizedBox(width: Spacing.x3),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Push Subscription', style: Theme.of(context).textTheme.titleLarge),
              Text(subscription.deviceType ?? subscription.browser ?? 'Unknown device', style: TextStyle(color: t.textSecondary)),
            ])),
            Container(padding: const EdgeInsets.symmetric(horizontal: Spacing.x2_5, vertical: Spacing.x1),
              decoration: BoxDecoration(color: subscription.status == 'ACTIVE' ? t.successLight : t.bgSunken, borderRadius: Radii.pill),
              child: Text(subscription.status, style: TextStyle(color: subscription.status == 'ACTIVE' ? t.success : t.textSecondary, fontSize: TypeScale.xs, fontWeight: TypeScale.medium))),
          ]),
        ])),
        const SizedBox(height: Spacing.x4),
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const _SectionTitle(title: 'Device Info'),
          _FieldRow('User Agent', subscription.userAgent ?? '—'),
          _FieldRow('Device Type', subscription.deviceType ?? '—'),
          _FieldRow('Browser', subscription.browser ?? '—'),
          _FieldRow('Platform', subscription.platform ?? '—'),
        ])),
        const SizedBox(height: Spacing.x4),
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const _SectionTitle(title: 'Keys'),
          _FieldRow('Endpoint', subscription.endpoint.length > 60 ? '${subscription.endpoint.substring(0, 60)}...' : subscription.endpoint),
          _FieldRow('P256DH Key', subscription.p256dhKey.length > 40 ? '${subscription.p256dhKey.substring(0, 40)}...' : subscription.p256dhKey),
        ])),
        const SizedBox(height: Spacing.x4),
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const _SectionTitle(title: 'Timeline'),
          _FieldRow('Created', subscription.createdAt != null ? Formatters.dateTime(subscription.createdAt!) : '—'),
          _FieldRow('Last Push', subscription.lastPushedAt != null ? Formatters.dateTime(subscription.lastPushedAt!) : '—'),
          _FieldRow('Expires', subscription.expiresAt != null ? Formatters.dateTime(subscription.expiresAt!) : '—'),
        ])),
        if (subscription.tags.isNotEmpty) ...[
          const SizedBox(height: Spacing.x4),
          _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const _SectionTitle(title: 'Tags'),
            Wrap(spacing: Spacing.x1, runSpacing: Spacing.x1,
              children: subscription.tags.map((t) => Chip(label: Text(t, style: const TextStyle(fontSize: TypeScale.xs)), materialTapTargetSize: MaterialTapTargetSize.shrinkWrap)).toList()),
          ])),
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