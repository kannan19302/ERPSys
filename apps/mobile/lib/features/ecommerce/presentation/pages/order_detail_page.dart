import 'package:flutter/material.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/widgets/state_views.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../domain/entities/ecommerce.dart';
import '../providers/ecommerce_providers.dart';

class EcommerceOrderDetailPage extends ConsumerWidget {
  const EcommerceOrderDetailPage({required this.orderId, super.key});

  static const String routeName = 'ecommerce-order-detail';
  static const String routePath = '/ecommerce/orders/:id';

  final String orderId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<EcommerceOrder> orderAsync =
        ref.watch(ecommerceOrderDetailProvider(orderId));

    return Scaffold(
      appBar: AppBar(title: const Text('Order')),
      body: orderAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load order.'),
          onRetry: () => ref.invalidate(ecommerceOrderDetailProvider(orderId)),
        ),
        data: (EcommerceOrder order) => _OrderDetail(order: order),
      ),
    );
  }
}

class _OrderDetail extends StatelessWidget {
  const _OrderDetail({required this.order});

  final EcommerceOrder order;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: <Widget>[
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(Spacing.x4),
          decoration: BoxDecoration(
            color: t.bgElevated,
            borderRadius: Radii.card,
            border: Border.all(color: t.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
                children: <Widget>[
                  Expanded(
                    child: Text(
                      '#${order.orderNumber}',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  _OrderStatusPill(status: order.status, t: t),
                ],
              ),
              const SizedBox(height: Spacing.x2),
              Text(
                Formatters.currency(order.totalAmount, currencyCode: order.currency),
                style: Theme.of(context).textTheme.headlineSmall,
              ),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(Spacing.x4),
          decoration: BoxDecoration(
            color: t.bgElevated,
            borderRadius: Radii.card,
            border: Border.all(color: t.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const Text('Customer', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              const SizedBox(height: Spacing.x2),
              Text(order.customerName ?? '—'),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(Spacing.x4),
          decoration: BoxDecoration(
            color: t.bgElevated,
            borderRadius: Radii.card,
            border: Border.all(color: t.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const Text('Items', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              const SizedBox(height: Spacing.x3),
              ...order.items.map((EcommerceOrderItem item) => Padding(
                padding: const EdgeInsets.symmetric(vertical: Spacing.x1),
                child: Row(
                  children: <Widget>[
                    Expanded(child: Text(item.productName ?? 'Product')),
                    Text('x${item.quantity.toStringAsFixed(0)}'),
                    const SizedBox(width: Spacing.x3),
                    Text(Formatters.currency(item.totalPrice, currencyCode: order.currency)),
                  ],
                ),
              ),),
              const Divider(height: Spacing.x6),
              Row(
                children: <Widget>[
                  const Expanded(child: Text('Subtotal')),
                  Text(Formatters.currency(order.subtotal, currencyCode: order.currency)),
                ],
              ),
              const SizedBox(height: Spacing.x1),
              Row(
                children: <Widget>[
                  const Expanded(child: Text('Shipping')),
                  Text(Formatters.currency(order.shippingCost, currencyCode: order.currency)),
                ],
              ),
              const SizedBox(height: Spacing.x1),
              Row(
                children: <Widget>[
                  const Expanded(child: Text('Tax')),
                  Text(Formatters.currency(order.taxTotal, currencyCode: order.currency)),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(Spacing.x4),
          decoration: BoxDecoration(
            color: t.bgElevated,
            borderRadius: Radii.card,
            border: Border.all(color: t.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const Text('Details', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              const SizedBox(height: Spacing.x3),
              _FieldRow('Payment', order.paymentStatus ?? '—'),
              _FieldRow('Shipping', order.shippingAddress ?? '—'),
              _FieldRow('Created', Formatters.date(order.createdAt ?? DateTime.now())),
            ],
          ),
        ),
      ],
    );
  }
}

class _OrderStatusPill extends StatelessWidget {
  const _OrderStatusPill({required this.status, required this.t});

  final String status;
  final Palette t;

  @override
  Widget build(BuildContext context) {
    final (String label, Color color, Color bg) = switch (status) {
      'PENDING' => ('Pending', t.warning, t.warningLight),
      'CONFIRMED' => ('Confirmed', t.info, t.infoLight),
      'SHIPPED' => ('Shipped', t.primary, t.primaryLight),
      'DELIVERED' => ('Delivered', t.success, t.successLight),
      'CANCELLED' => ('Cancelled', t.danger, t.dangerLight),
      _ => (status, t.textSecondary, t.bgSunken),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: Spacing.x2_5, vertical: Spacing.x1),
      decoration: BoxDecoration(color: bg, borderRadius: Radii.pill),
      child: Text(label, style: TextStyle(color: color, fontSize: TypeScale.xs, fontWeight: TypeScale.medium)),
    );
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
          Expanded(
            child: Text(label, style: TextStyle(color: t.textSecondary)),
          ),
          Text(value, style: Theme.of(context).textTheme.labelLarge),
        ],
      ),
    );
  }
}