import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/sales.dart';
import '../providers/sales_providers.dart';

class SalesDashboardPage extends ConsumerWidget {
  const SalesDashboardPage({super.key});

  static const String routeName = 'sales-dashboard';
  static const String routePath = '/sales/dashboard';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final Palette t = context.tokens;
    final SalesListState<SalesOrder> ordersState =
        ref.watch(salesOrdersProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Sales Dashboard'),
      ),
      body: ordersState.isLoading && ordersState.items.isEmpty
          ? const LoadingView()
          : ordersState.failure != null && ordersState.items.isEmpty
              ? FailureView(
                  failure: ordersState.failure!,
                  onRetry: () => ref.read(salesOrdersProvider.notifier).refresh(),
                )
              : _DashboardContent(orders: ordersState.items),
    );
  }
}

class _DashboardContent extends StatelessWidget {
  const _DashboardContent({required this.orders});

  final List<SalesOrder> orders;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    final int totalOrders = orders.length;
    final double totalRevenue =
        orders.fold(0, (double sum, SalesOrder o) => sum + o.totalAmount);
    final double avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    final int pendingOrders =
        orders.where((SalesOrder o) => o.status == 'DRAFT').length;

    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: <Widget>[
        Row(
          children: <Widget>[
            Expanded(
              child: _KpiCard(
                title: 'Total Orders',
                value: '$totalOrders',
                icon: Icons.receipt_long_outlined,
                color: t.primary,
              ),
            ),
            const SizedBox(width: Spacing.x3),
            Expanded(
              child: _KpiCard(
                title: 'Total Revenue',
                value: Formatters.compact(totalRevenue),
                icon: Icons.attach_money,
                color: t.success,
              ),
            ),
          ],
        ),
        const SizedBox(height: Spacing.x3),
        Row(
          children: <Widget>[
            Expanded(
              child: _KpiCard(
                title: 'Avg Order Value',
                value: Formatters.compact(avgOrderValue),
                icon: Icons.trending_up,
                color: t.info,
              ),
            ),
            const SizedBox(width: Spacing.x3),
            Expanded(
              child: _KpiCard(
                title: 'Pending',
                value: '$pendingOrders',
                icon: Icons.hourglass_empty,
                color: t.warning,
              ),
            ),
          ],
        ),
        const SizedBox(height: Spacing.x6),
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const UiSectionHeader(title: 'Revenue Trend'),
              SizedBox(
                height: 200,
                child: Center(
                  child: Text(
                    'Chart placeholder',
                    style: TextStyle(color: t.textTertiary),
                  ),
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
              const UiSectionHeader(title: 'Orders by Status'),
              SizedBox(
                height: 200,
                child: Center(
                  child: Text(
                    'Chart placeholder',
                    style: TextStyle(color: t.textTertiary),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x6),
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const UiSectionHeader(title: 'Recent Orders'),
              const SizedBox(height: Spacing.x2),
              ...orders.take(5).map(
                (SalesOrder order) => _RecentOrderRow(order: order),
              ),
              if (orders.isEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: Spacing.x4),
                  child: Center(
                    child: Text(
                      'No orders yet',
                      style: TextStyle(color: t.textTertiary),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }
}

class _KpiCard extends StatelessWidget {
  const _KpiCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  final String title;
  final String value;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return UiCard(
      padding: const EdgeInsets.all(Spacing.x3),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            children: <Widget>[
              Icon(icon, size: TypeScale.xl, color: color),
              const Spacer(),
              Icon(Icons.more_horiz, size: TypeScale.lg, color: t.textTertiary),
            ],
          ),
          const SizedBox(height: Spacing.x2),
          Text(
            value,
            style: TextStyle(
              fontSize: TypeScale.x2l,
              fontWeight: TypeScale.bold,
              color: color,
            ),
          ),
          const SizedBox(height: Spacing.x0_5),
          Text(
            title,
            style: TextStyle(
              fontSize: TypeScale.xs,
              color: t.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

class _RecentOrderRow extends StatelessWidget {
  const _RecentOrderRow({required this.order});

  final SalesOrder order;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: Spacing.x1_5),
      child: Row(
        children: <Widget>[
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  order.customerName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.labelLarge,
                ),
                Text(
                  '#${order.id.length > 8 ? order.id.substring(0, 8) : order.id}',
                  style: TextStyle(
                    fontSize: TypeScale.xs,
                    color: t.textTertiary,
                  ),
                ),
              ],
            ),
          ),
          Text(
            Formatters.currency(order.totalAmount),
            style: TextStyle(fontWeight: TypeScale.semibold),
          ),
        ],
      ),
    );
  }
}
