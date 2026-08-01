import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/procurement.dart';
import '../providers/procurement_providers.dart';

class PurchaseReceiptDetailPage extends ConsumerWidget {
  const PurchaseReceiptDetailPage({required this.receiptId, super.key});
  static const String routeName = 'purchase-receipt-detail';
  static const String routePath = '/procurement/purchase-receipts/:id';
  final String receiptId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(purchaseReceiptDetailProvider(receiptId));

    return Scaffold(
      appBar: AppBar(title: const Text('Purchase Receipt')),
      body: async.when(
        loading: () => const LoadingView(),
        error: (error, _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load receipt.'),
          onRetry: () => ref.invalidate(purchaseReceiptDetailProvider(receiptId)),
        ),
        data: (r) => _PurchaseReceiptDetail(receipt: r),
      ),
    );
  }
}

class _PurchaseReceiptDetail extends StatelessWidget {
  const _PurchaseReceiptDetail({required this.receipt});
  final PurchaseReceipt receipt;

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
              Expanded(child: Text(receipt.receiptNumber, style: Theme.of(context).textTheme.titleLarge)),
              UiStatusBadge(label: receipt.status, tone: _statusTone(receipt.status)),
            ],),
            if (receipt.supplierName != null) ...[
              const SizedBox(height: Spacing.x1),
              Text(receipt.supplierName!, style: TextStyle(color: t.textSecondary)),
            ],
          ],
        ),),
        const SizedBox(height: Spacing.x4),
        UiCard(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const UiSectionHeader(title: 'Items Received'),
            ...receipt.items.map((item) => Padding(
              padding: const EdgeInsets.symmetric(vertical: Spacing.x1),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(item.productName ?? 'Item', style: Theme.of(context).textTheme.labelLarge),
                  const SizedBox(height: Spacing.x0_5),
                  Text('Ordered: ${item.orderedQuantity.toStringAsFixed(0)}  |  Received: ${item.receivedQuantity.toStringAsFixed(0)}',
                      style: TextStyle(fontSize: TypeScale.xs, color: t.textSecondary),),
                  if (item.acceptedQuantity > 0 || item.rejectedQuantity > 0)
                    Text('Accepted: ${item.acceptedQuantity.toStringAsFixed(0)}  |  Rejected: ${item.rejectedQuantity.toStringAsFixed(0)}',
                        style: TextStyle(fontSize: TypeScale.xs, color: t.textSecondary),),
                ],
              ),
            ),),
            if (receipt.items.isEmpty) Text('No items', style: TextStyle(color: t.textTertiary)),
          ],
        ),),
        const SizedBox(height: Spacing.x4),
        UiCard(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const UiSectionHeader(title: 'Details'),
            if (receipt.poNumber != null) _Row('Purchase Order', receipt.poNumber!),
            if (receipt.warehouseName != null) _Row('Warehouse', receipt.warehouseName!),
            if (receipt.receivedDate != null) _Row('Received Date', Formatters.date(receipt.receivedDate!)),
            if (receipt.notes != null && receipt.notes!.isNotEmpty) _Row('Notes', receipt.notes!),
            if (receipt.createdAt != null) _Row('Created', Formatters.dateTime(receipt.createdAt!)),
          ],
        ),),
      ],
    );
  }

  UiTone _statusTone(String s) => switch (s) {
        'DRAFT' => UiTone.neutral, 'RECEIVED' => UiTone.success,
        'PARTIAL' => UiTone.warning, 'CANCELLED' => UiTone.danger, _ => UiTone.neutral,
      };
}

class _Row extends StatelessWidget {
  const _Row(this.label, this.value);
  final String label; final String value;
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