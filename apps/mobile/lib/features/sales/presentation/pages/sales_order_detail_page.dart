import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/rbac/permissions.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/sales.dart';
import '../providers/sales_providers.dart';

class SalesOrderDetailPage extends ConsumerWidget {
  const SalesOrderDetailPage({required this.orderId, super.key});

  static const String routeName = 'sales-order-detail';
  static const String routePath = '/sales/orders/:id';

  final String orderId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<SalesOrder> orderAsync =
        ref.watch(salesOrderDetailProvider(orderId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Sales Order'),
        actions: <Widget>[
          PermissionGate(
            permission: Permissions.productDelete,
            child: IconButton(
              icon: const Icon(Icons.delete_outline),
              tooltip: 'Delete order',
              onPressed: () => _confirmDelete(context, ref),
            ),
          ),
        ],
      ),
      body: orderAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure
              ? error
              : const ServerFailure('Could not load sales order.'),
          onRetry: () => ref.invalidate(salesOrderDetailProvider(orderId)),
        ),
        data: (SalesOrder order) => _SalesOrderDetail(order: order),
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (BuildContext dialogContext) => AlertDialog(
        title: const Text('Delete sales order?'),
        content: const Text('This cannot be undone.'),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;

    final result =
        await ref.read(salesOrdersProvider.notifier).delete(orderId);

    if (!context.mounted) return;
    result.fold(
      (failure) => ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(failure.message))),
      (_) => Navigator.of(context).pop(),
    );
  }
}

class _SalesOrderDetail extends StatelessWidget {
  const _SalesOrderDetail({required this.order});

  final SalesOrder order;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: <Widget>[
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
                children: <Widget>[
                  Expanded(
                    child: Text(
                      order.customerName,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  UiStatusBadge(
                    label: order.status,
                    tone: _statusTone(order.status),
                  ),
                ],
              ),
              const SizedBox(height: Spacing.x1),
              Text(
                'Customer ID: ${order.customerId}',
                style: TextStyle(color: t.textSecondary),
              ),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const UiSectionHeader(title: 'Items'),
              ...order.items.map(
                (SalesOrderItem item) => _ItemRow(item: item),
              ),
              const Divider(),
              _Row('Total', Formatters.currency(order.totalAmount)),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const UiSectionHeader(title: 'Details'),
              if (order.deliveryDate != null)
                _Row('Delivery date', Formatters.date(order.deliveryDate!)),
              if (order.notes != null && order.notes!.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: Spacing.x2),
                  child: Text(order.notes!),
                ),
              if (order.createdAt != null)
                _Row('Created', Formatters.dateTime(order.createdAt!)),
              if (order.updatedAt != null)
                _Row('Updated', Formatters.dateTime(order.updatedAt!)),
            ],
          ),
        ),
      ],
    );
  }

  static UiTone _statusTone(String status) => switch (status.toUpperCase()) {
        'DRAFT' => UiTone.neutral,
        'CONFIRMED' => UiTone.info,
        'IN_TRANSIT' => UiTone.warning,
        'DELIVERED' => UiTone.success,
        'CANCELLED' => UiTone.danger,
        _ => UiTone.neutral,
      };
}

class _ItemRow extends StatelessWidget {
  const _ItemRow({required this.item});

  final SalesOrderItem item;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: Spacing.x1_5),
      child: Row(
        children: <Widget>[
          Expanded(
            flex: 2,
            child: Text(
              item.productName,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          SizedBox(
            width: Spacing.x10,
            child: Text(
              '${item.quantity}',
              textAlign: TextAlign.right,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ),
          SizedBox(
            width: Spacing.x12,
            child: Text(
              Formatters.currency(item.rate),
              textAlign: TextAlign.right,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ),
          SizedBox(
            width: Spacing.x12,
            child: Text(
              Formatters.currency(item.amount),
              textAlign: TextAlign.right,
              style: Theme.of(context).textTheme.labelLarge,
            ),
          ),
        ],
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row(this.label, this.value);

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: Spacing.x1_5),
      child: Row(
        children: <Widget>[
          Expanded(
            child: Text(label, style: TextStyle(color: t.textSecondary)),
          ),
          Text(value, style: Theme.of(context).textTheme.labelLarge),
        ],
      ),
    );
  }
}
