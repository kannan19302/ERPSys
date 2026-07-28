import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/rbac/permissions.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/procurement.dart';
import '../providers/procurement_providers.dart';

class PurchaseOrderDetailPage extends ConsumerWidget {
  const PurchaseOrderDetailPage({required this.poId, super.key});
  static const String routeName = 'po-detail';
  static const String routePath = '/procurement/purchase-orders/:id';
  final String poId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final poAsync = ref.watch(purchaseOrderDetailProvider(poId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Purchase Order'),
        actions: [
          PermissionGate(
            permission: Permissions.productDelete,
            child: IconButton(
              icon: const Icon(Icons.delete_outline),
              onPressed: () => _confirmDelete(context, ref),
            ),
          ),
        ],
      ),
      body: poAsync.when(
        loading: () => const LoadingView(),
        error: (error, _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load PO.'),
          onRetry: () => ref.invalidate(purchaseOrderDetailProvider(poId)),
        ),
        data: (po) => _PurchaseOrderDetail(po: po),
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete PO?'),
        content: const Text('This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.of(ctx).pop(true), child: const Text('Delete')),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;
    final result = await ref.read(purchaseOrderListControllerProvider.notifier).delete(poId);
    if (!context.mounted) return;
    result.fold(
      (f) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(f.message))),
      (_) => Navigator.of(context).pop(),
    );
  }
}

class _PurchaseOrderDetail extends StatelessWidget {
  const _PurchaseOrderDetail({required this.po});
  final PurchaseOrder po;

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
              Expanded(child: Text(po.poNumber, style: Theme.of(context).textTheme.titleLarge)),
              UiStatusBadge(label: po.status, tone: _statusTone(po.status)),
            ]),
            const SizedBox(height: Spacing.x1),
            Text(po.vendorName, style: TextStyle(color: t.textSecondary)),
          ],
        )),
        const SizedBox(height: Spacing.x4),
        UiCard(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const UiSectionHeader(title: 'Items'),
            ...po.items.map((item) => Padding(
              padding: const EdgeInsets.symmetric(vertical: Spacing.x1),
              child: Row(children: [
                Expanded(child: Text(item.productName ?? 'Item')),
                Text('${item.quantity} \u00d7 \$${item.rate.toStringAsFixed(2)}'),
                const SizedBox(width: Spacing.x2),
                Text('\$${item.amount.toStringAsFixed(2)}',
                    style: Theme.of(context).textTheme.labelLarge),
              ]),
            )),
            const Divider(height: Spacing.x4),
            _Row('Subtotal', Formatters.currency(po.subtotal)),
            _Row('Tax', Formatters.currency(po.taxTotal)),
            _Row('Total', Formatters.currency(po.totalAmount)),
          ],
        )),
        const SizedBox(height: Spacing.x4),
        UiCard(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const UiSectionHeader(title: 'Details'),
            _Row('Currency', po.currency),
            if (po.orderDate != null) _Row('Order date', Formatters.dateTime(po.orderDate!)),
            if (po.expectedDate != null) _Row('Expected', Formatters.dateTime(po.expectedDate!)),
            if (po.notes != null && po.notes!.isNotEmpty) _Row('Notes', po.notes!),
            if (po.createdAt != null) _Row('Created', Formatters.dateTime(po.createdAt!)),
          ],
        )),
      ],
    );
  }

  UiTone _statusTone(String status) => switch (status) {
        'DRAFT' => UiTone.neutral, 'SUBMITTED' => UiTone.info,
        'APPROVED' => UiTone.success, 'RECEIVED' => UiTone.success,
        'CANCELLED' => UiTone.danger, _ => UiTone.neutral,
      };
}

class _Row extends StatelessWidget {
  const _Row(this.label, this.value);
  final String label;
  final String value;
  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: Spacing.x1_5),
      child: Row(children: [
        Expanded(child: Text(label, style: TextStyle(color: t.textSecondary))),
        Text(value, style: Theme.of(context).textTheme.labelLarge),
      ]),
    );
  }
}
