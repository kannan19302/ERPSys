import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/pos.dart';
import '../providers/pos_providers.dart';

/// `GET /pos/orders/:id`. Read-only.
class PosOrderDetailPage extends ConsumerWidget {
  const PosOrderDetailPage({required this.orderId, super.key});

  static const String routeName = 'pos-order-detail';

  final String orderId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<PosOrder> orderAsync =
        ref.watch(posOrderDetailProvider(orderId));

    return Scaffold(
      appBar: AppBar(title: const Text('Order')),
      body: orderAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load order.'),
          onRetry: () => ref.invalidate(posOrderDetailProvider(orderId)),
        ),
        data: (PosOrder order) => _PosOrderDetail(order: order),
      ),
    );
  }
}

class _PosOrderDetail extends StatelessWidget {
  const _PosOrderDetail({required this.order});

  final PosOrder order;

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
                      order.orderNumber,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  UiStatusBadge(label: order.status, tone: _statusTone(order.status)),
                ],
              ),
              const SizedBox(height: Spacing.x1),
              Text(order.customerName ?? 'Walk-in customer',
                  style: TextStyle(color: t.textSecondary)),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        if (order.items.isNotEmpty)
          UiCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                const UiSectionHeader(title: 'Items'),
                for (final PosOrderItem item in order.items)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: Spacing.x1_5),
                    child: Row(
                      children: <Widget>[
                        Expanded(
                          child: Text(
                            '${item.productName} × ${Formatters.number(item.quantity, decimals: 0)}',
                          ),
                        ),
                        Text(Formatters.currency(item.amount)),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        const SizedBox(height: Spacing.x4),
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const UiSectionHeader(title: 'Totals'),
              _Row('Subtotal', Formatters.currency(order.subtotal)),
              _Row('Discount', Formatters.currency(order.discountTotal)),
              _Row('Tax', Formatters.currency(order.taxTotal)),
              _Row('Total', Formatters.currency(order.totalAmount)),
            ],
          ),
        ),
        if (order.payments.isNotEmpty) ...<Widget>[
          const SizedBox(height: Spacing.x4),
          UiCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                const UiSectionHeader(title: 'Payments'),
                for (final PosPayment payment in order.payments)
                  _Row(payment.method, Formatters.currency(payment.amount)),
              ],
            ),
          ),
        ],
      ],
    );
  }

  UiTone _statusTone(String status) => switch (status) {
        'COMPLETED' => UiTone.success,
        'VOIDED' => UiTone.danger,
        'PENDING' => UiTone.neutral,
        'REFUNDED' => UiTone.warning,
        _ => UiTone.neutral,
      };
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
