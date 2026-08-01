import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/procurement.dart';
import '../providers/procurement_providers.dart';

class ProcurementDashboardPage extends ConsumerWidget {
  const ProcurementDashboardPage({super.key});
  static const String routeName = 'procurement-dashboard';
  static const String routePath = '/procurement';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(procurementDashboardProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Procurement')),
      body: async.when(
        loading: () => const LoadingView(),
        error: (error, _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load dashboard.'),
          onRetry: () => ref.invalidate(procurementDashboardProvider),
        ),
        data: (stats) => _DashboardContent(stats: stats),
      ),
    );
  }
}

class _DashboardContent extends StatelessWidget {
  const _DashboardContent({required this.stats});
  final ProcurementDashboardStats stats;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: [
        Row(children: [
          Expanded(child: _KpiCard(
            title: 'Purchase Orders',
            value: stats.totalPO.toString(),
            icon: Icons.shopping_cart_outlined,
            color: t.primary,
          ),),
          const SizedBox(width: Spacing.x3),
          Expanded(child: _KpiCard(
            title: 'Total Spend',
            value: Formatters.compact(stats.totalSpend),
            icon: Icons.attach_money,
            color: t.success,
          ),),
        ],),
        const SizedBox(height: Spacing.x3),
        Row(children: [
          Expanded(child: _KpiCard(
            title: 'Pending Approvals',
            value: stats.pendingApprovals.toString(),
            icon: Icons.hourglass_empty,
            color: t.warning,
          ),),
          const SizedBox(width: Spacing.x3),
          Expanded(child: _KpiCard(
            title: 'Vendors',
            value: stats.vendorCount.toString(),
            icon: Icons.business,
            color: t.info,
          ),),
        ],),
        const SizedBox(height: Spacing.x4),
        if (stats.spendByMonth.isNotEmpty) ...[
          UiCard(child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const UiSectionHeader(title: 'Spend by Month'),
              ...stats.spendByMonth.map((dp) => Padding(
                padding: const EdgeInsets.symmetric(vertical: Spacing.x1),
                child: Row(children: [
                  SizedBox(width: 100, child: Text(dp.label, style: const TextStyle(fontSize: TypeScale.xs))),
                  Expanded(child: LinearProgressIndicator(
                    value: dp.value / stats.spendByMonth
                        .map((e) => e.value)
                        .reduce((a, b) => a > b ? a : b),
                    backgroundColor: t.bgSunken,
                  ),),
                  const SizedBox(width: Spacing.x2),
                  Text(Formatters.compact(dp.value), style: const TextStyle(fontSize: TypeScale.xs)),
                ],),
              ),),
            ],
          ),),
          const SizedBox(height: Spacing.x4),
        ],
        UiCard(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              const Expanded(child: UiSectionHeader(title: 'Recent Purchase Orders')),
              TextButton(
                onPressed: () => context.pushNamed('purchase-orders'),
                child: const Text('View all'),
              ),
            ],),
            ...stats.recentPOs.take(5).map((po) => Padding(
              padding: const EdgeInsets.symmetric(vertical: Spacing.x1),
              child: InkWell(
                onTap: () => context.pushNamed('po-detail', pathParameters: {'id': po.id}),
                child: Row(children: [
                  Expanded(child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(po.poNumber, style: Theme.of(context).textTheme.labelLarge),
                      Text(po.vendorName, style: TextStyle(fontSize: TypeScale.xs, color: t.textSecondary)),
                    ],
                  ),),
                  Text(Formatters.currency(po.totalAmount), style: Theme.of(context).textTheme.labelLarge),
                ],),
              ),
            ),),
            if (stats.recentPOs.isEmpty)
              Text('No recent orders', style: TextStyle(color: t.textTertiary)),
          ],
        ),),
        if (stats.overdueDeliveries > 0) ...[
          const SizedBox(height: Spacing.x3),
          UiCard(child: Row(children: [
            Icon(Icons.warning_amber_rounded, color: t.danger),
            const SizedBox(width: Spacing.x2),
            Text('${stats.overdueDeliveries} overdue deliver${stats.overdueDeliveries == 1 ? 'y' : 'ies'}',
                style: TextStyle(color: t.danger),),
          ],),),
        ],
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
    final t = context.tokens;
    return UiCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: TypeScale.xl),
          const SizedBox(height: Spacing.x2),
          Text(value, style: Theme.of(context).textTheme.titleLarge?.copyWith(color: color)),
          const SizedBox(height: Spacing.x0_5),
          Text(title, style: TextStyle(fontSize: TypeScale.xs, color: t.textSecondary)),
        ],
      ),
    );
  }
}