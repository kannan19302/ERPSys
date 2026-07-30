import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../providers/saas_portal_providers.dart';

class BillingHistoryPage extends ConsumerWidget {
  const BillingHistoryPage({super.key});
  static const String routeName = 'portal-billing-history';
  static const String routePath = '/saas-portal/billing';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final billingAsync = ref.watch(portalBillingInfoProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Billing & History')),
      body: billingAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => Text('Error: '),
        data: (info) {
          final t = context.tokens;
          return ListView(padding: const EdgeInsets.all(Spacing.x4), children: [
            _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [Icon(Icons.credit_card_outlined, color: t.primary, size: 40), const SizedBox(width: Spacing.x3),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(info.companyName ?? 'Billing Info', style: Theme.of(context).textTheme.titleLarge),
                  if (info.email != null) Text(info.email!, style: TextStyle(color: t.textSecondary)),
                ])),
              ]),
            ])),
            const SizedBox(height: Spacing.x4),
            _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const _SectionTitle(title: 'Payment Method'),
              if (info.paymentMethod != null) ...[
                Row(children: [
                  Icon(info.cardBrand == 'Visa' ? Icons.credit_card : Icons.payment, color: t.primary),
                  const SizedBox(width: Spacing.x2),
                  Text(' ending in '),
                ]),
                if (info.expMonth != null && info.expYear != null) Text('Expires /', style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs)),
              ] else const Text('No payment method on file', style: TextStyle(color: Colors.grey)),
            ])),
            const SizedBox(height: Spacing.x4),
            _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const _SectionTitle(title: 'Address'),
              if (info.address != null) Text(info.address!), if (info.city != null) Text(info.city!),
              if (info.country != null) Text(info.country!), if (info.zipCode != null) Text(info.zipCode!),
            ])),
          ]);
        },
      ),
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
