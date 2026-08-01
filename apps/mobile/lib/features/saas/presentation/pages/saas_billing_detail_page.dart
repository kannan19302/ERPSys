import 'package:flutter/material.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/widgets/state_views.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../domain/entities/saas.dart';
import '../providers/saas_providers.dart';

class SaasBillingDetailPage extends ConsumerWidget {
  const SaasBillingDetailPage({required this.invoiceId, super.key});
  static const String routeName = 'saas-billing-detail';
  static const String routePath = '/saas/billing/:id';
  final String invoiceId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(saasInvoiceDetailProvider(invoiceId));
    return Scaffold(
      appBar: AppBar(title: const Text('Invoice')),
      body: async.when(
        loading: () => const LoadingView(),
        error: (e, _) => FailureView(
          failure: e is Failure ? e : const ServerFailure('Could not load invoice.'),
          onRetry: () => ref.invalidate(saasInvoiceDetailProvider(invoiceId)),
        ),
        data: (inv) => _InvoiceDetail(invoice: inv),
      ),
    );
  }
}

class _InvoiceDetail extends StatelessWidget {
  const _InvoiceDetail({required this.invoice}); final SaasInvoice invoice;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final (String statusLabel, Color statusColor, Color statusBg) = switch (invoice.status) {
      'PAID' => ('Paid', t.success, t.successLight),
      'PENDING' => ('Pending', t.textSecondary, t.bgSunken),
      'OVERDUE' => ('Overdue', t.danger, t.dangerLight),
      'CANCELED' => ('Canceled', t.textSecondary, t.bgSunken),
      _ => (invoice.status, t.textSecondary, t.bgSunken),
    };

    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: [
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Icon(Icons.receipt_long_outlined, color: t.primary, size: 40),
            const SizedBox(width: Spacing.x3),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(invoice.invoiceNumber ?? 'Invoice', style: Theme.of(context).textTheme.titleLarge),
              Text('${invoice.currency} ${invoice.amount.toStringAsFixed(2)}', style: TextStyle(color: t.textSecondary, fontSize: TypeScale.lg, fontWeight: TypeScale.semibold)),
            ],),),
            Container(padding: const EdgeInsets.symmetric(horizontal: Spacing.x2_5, vertical: Spacing.x1),
              decoration: BoxDecoration(color: statusBg, borderRadius: Radii.pill),
              child: Text(statusLabel, style: TextStyle(color: statusColor, fontSize: TypeScale.xs, fontWeight: TypeScale.medium)),),
          ],),
        ],),),
        const SizedBox(height: Spacing.x4),
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const _SectionTitle(title: 'Details'),
          _FieldRow('Amount', Formatters.currency(invoice.amount)),
          _FieldRow('Currency', invoice.currency),
          _FieldRow('Status', statusLabel),
          if (invoice.paidAt != null) _FieldRow('Paid At', Formatters.dateTime(invoice.paidAt!)),
          if (invoice.createdAt != null) _FieldRow('Created', Formatters.dateTime(invoice.createdAt!)),
          if (invoice.invoicePdf != null) _FieldRow('PDF', invoice.invoicePdf!),
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
