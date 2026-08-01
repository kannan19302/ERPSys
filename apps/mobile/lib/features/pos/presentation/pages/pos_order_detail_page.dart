import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/pos.dart';
import '../providers/pos_providers.dart';

class PosOrderDetailPage extends ConsumerWidget {
  const PosOrderDetailPage({super.key, this.id});
  final String? id;

  static const String routeName = 'pos-order-detail';
  static const String routePath = '/pos/orders/:id';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final String orderId = id ?? '';
    final AsyncValue<PosOrder> orderAsync = ref.watch(posOrderDetailProvider(orderId));

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
        _SectionCard(
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
              const SizedBox(height: Spacing.x2),
              Text(
                order.customerName ?? 'Walk-in customer',
                style: TextStyle(color: t.textSecondary),
              ),
            ],
          ),
        ),
        if (order.items.isNotEmpty) ...[
          const SizedBox(height: Spacing.x4),
          _SectionCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                const UiSectionHeader(title: 'Items'),
                ...order.items.map(
                  (PosOrderItem item) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: Spacing.x1_5),
                    child: Row(
                      children: <Widget>[
                        Expanded(
                          child: Text(
                            '${item.productName} × ${Formatters.number(item.quantity)}',
                            style: Theme.of(context).textTheme.labelLarge,
                          ),
                        ),
                        Text(
                          Formatters.currency(item.amount),
                          style: TextStyle(color: t.textSecondary),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: Spacing.x4),
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const UiSectionHeader(title: 'Totals'),
              _FieldRow('Subtotal', Formatters.currency(order.subtotal)),
              _FieldRow('Discount', Formatters.currency(order.discountTotal)),
              _FieldRow('Tax', Formatters.currency(order.taxTotal)),
              const Divider(height: Spacing.x4),
              _FieldRow('Total', Formatters.currency(order.totalAmount)),
            ],
          ),
        ),
        if (order.payments.isNotEmpty) ...[
          const SizedBox(height: Spacing.x4),
          _SectionCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                const UiSectionHeader(title: 'Payments'),
                ...order.payments.map(
                  (PosPayment payment) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: Spacing.x1_5),
                    child: Row(
                      children: <Widget>[
                        Expanded(child: Text(payment.method)),
                        Text(
                          Formatters.currency(payment.amount),
                          style: TextStyle(color: t.textSecondary),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }

  static UiTone _statusTone(String status) => switch (status) {
        'COMPLETED' => UiTone.success,
        'CANCELLED' || 'VOIDED' => UiTone.danger,
        _ => UiTone.warning,
      };
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return UiCard(child: child);
  }
}

class _FieldRow extends StatelessWidget {
  const _FieldRow(this.label, this.value);

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: Spacing.x1_5),
      child: Row(
        children: <Widget>[
          Expanded(child: Text(label, style: TextStyle(color: t.textSecondary))),
          Text(value, style: Theme.of(context).textTheme.labelLarge),
        ],
      ),
    );
  }
}
