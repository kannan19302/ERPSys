import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/procurement.dart';
import '../providers/procurement_providers.dart';

class SupplierQuotationDetailPage extends ConsumerWidget {
  const SupplierQuotationDetailPage({required this.quotationId, super.key});
  static const String routeName = 'supplier-quotation-detail';
  static const String routePath = '/procurement/supplier-quotations/:id';
  final String quotationId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(supplierQuotationDetailProvider(quotationId));

    return Scaffold(
      appBar: AppBar(title: const Text('Supplier Quotation')),
      body: async.when(
        loading: () => const LoadingView(),
        error: (error, _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load quotation.'),
          onRetry: () => ref.invalidate(supplierQuotationDetailProvider(quotationId)),
        ),
        data: (q) => _SupplierQuotationDetail(quotation: q),
      ),
    );
  }
}

class _SupplierQuotationDetail extends StatelessWidget {
  const _SupplierQuotationDetail({required this.quotation});
  final SupplierQuotation quotation;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: [
        UiCard(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Expanded(child: Text(quotation.vendorName ?? 'Quotation', style: Theme.of(context).textTheme.titleLarge)),
              UiStatusBadge(label: quotation.status, tone: _statusTone(quotation.status)),
            ],),
            if (quotation.rfqNumber != null) ...[
              const SizedBox(height: Spacing.x1),
              Text('RFQ: ${quotation.rfqNumber}', style: TextStyle(color: t.textSecondary)),
            ],
          ],
        ),),
        const SizedBox(height: Spacing.x4),
        UiCard(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const UiSectionHeader(title: 'Items'),
            ...quotation.items.map((item) => Padding(
              padding: const EdgeInsets.symmetric(vertical: Spacing.x1),
              child: Row(children: [
                Expanded(child: Text(item.productName ?? 'Item')),
                Text('${item.quantity} \u00d7 \$${item.rate.toStringAsFixed(2)}'),
                const SizedBox(width: Spacing.x2),
                Text('\$${item.amount.toStringAsFixed(2)}',
                    style: Theme.of(context).textTheme.labelLarge,),
              ],),
            ),),
            if (quotation.items.isEmpty) Text('No items', style: TextStyle(color: t.textTertiary)),
            const Divider(height: Spacing.x4),
            _Row('Subtotal', Formatters.currency(quotation.subtotal)),
            _Row('Tax', Formatters.currency(quotation.taxTotal)),
            _Row('Total', Formatters.currency(quotation.totalAmount)),
          ],
        ),),
        const SizedBox(height: Spacing.x4),
        UiCard(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const UiSectionHeader(title: 'Details'),
            _Row('Currency', quotation.currency),
            if (quotation.validUntil != null) _Row('Valid Until', Formatters.date(quotation.validUntil!)),
            if (quotation.notes != null && quotation.notes!.isNotEmpty) _Row('Notes', quotation.notes!),
            if (quotation.createdAt != null) _Row('Created', Formatters.dateTime(quotation.createdAt!)),
          ],
        ),),
      ],
    );
  }

  UiTone _statusTone(String s) => switch (s) {
        'DRAFT' => UiTone.neutral, 'SUBMITTED' => UiTone.info,
        'APPROVED' => UiTone.success, 'REJECTED' => UiTone.danger, _ => UiTone.neutral,
      };
}

class _Row extends StatelessWidget {
  const _Row(this.label, this.value);
  final String label;
  final String value;
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: Spacing.x1_5),
      child: Row(children: [
        Expanded(child: Text(label, style: TextStyle(color: context.tokens.textSecondary))),
        Text(value, style: Theme.of(context).textTheme.labelLarge),
      ],),
    );
  }
}