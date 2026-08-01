import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/procurement.dart';
import '../providers/procurement_providers.dart';

class RFQDetailPage extends ConsumerWidget {
  const RFQDetailPage({required this.rfqId, super.key});
  static const String routeName = 'rfq-detail';
  static const String routePath = '/procurement/rfqs/:id';
  final String rfqId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(rfqDetailProvider(rfqId));

    return Scaffold(
      appBar: AppBar(title: const Text('RFQ')),
      body: async.when(
        loading: () => const LoadingView(),
        error: (error, _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load RFQ.'),
          onRetry: () => ref.invalidate(rfqDetailProvider(rfqId)),
        ),
        data: (rfq) => _RFQDetail(rfq: rfq),
      ),
    );
  }
}

class _RFQDetail extends StatelessWidget {
  const _RFQDetail({required this.rfq});
  final RFQ rfq;

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
              Expanded(child: Text(rfq.rfqNumber, style: Theme.of(context).textTheme.titleLarge)),
              UiStatusBadge(label: rfq.status, tone: _statusTone(rfq.status)),
            ],),
            if (rfq.vendorName != null) ...[
              const SizedBox(height: Spacing.x1),
              Text(rfq.vendorName!, style: TextStyle(color: t.textSecondary)),
            ],
          ],
        ),),
        const SizedBox(height: Spacing.x4),
        UiCard(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const UiSectionHeader(title: 'Items'),
            ...rfq.items.map((item) => Padding(
              padding: const EdgeInsets.symmetric(vertical: Spacing.x1),
              child: Row(children: [
                Expanded(child: Text(item.productName ?? 'Item')),
                Text('${item.quantity.toStringAsFixed(0)} ${item.uom ?? 'pcs'}'),
              ],),
            ),),
            if (rfq.items.isEmpty) Text('No items', style: TextStyle(color: t.textTertiary)),
          ],
        ),),
        const SizedBox(height: Spacing.x4),
        UiCard(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const UiSectionHeader(title: 'Details'),
            _Row('Vendors', '${rfq.vendorCount}'),
            if (rfq.deliveryDate != null) _Row('Delivery Date', Formatters.date(rfq.deliveryDate!)),
            if (rfq.responseDeadline != null) _Row('Response Deadline', Formatters.dateTime(rfq.responseDeadline!)),
            if (rfq.notes != null && rfq.notes!.isNotEmpty) _Row('Notes', rfq.notes!),
            if (rfq.createdAt != null) _Row('Created', Formatters.dateTime(rfq.createdAt!)),
          ],
        ),),
        if (rfq.quotations.isNotEmpty) ...[
          const SizedBox(height: Spacing.x4),
          UiCard(child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const UiSectionHeader(title: 'Quotations Received'),
              ...rfq.quotations.map((q) => Padding(
                padding: const EdgeInsets.symmetric(vertical: Spacing.x1),
                child: Row(children: [
                  Expanded(child: Text(q.vendorName ?? 'Supplier')),
                  Text(Formatters.currency(q.totalAmount)),
                ],),
              ),),
            ],
          ),),
        ],
      ],
    );
  }

  UiTone _statusTone(String status) => switch (status) {
        'DRAFT' => UiTone.neutral, 'SENT' => UiTone.info,
        'CLOSED' => UiTone.success, _ => UiTone.neutral,
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