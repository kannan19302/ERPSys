import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../providers/supply_chain_providers.dart';

class SupplyChainDashboardPage extends ConsumerWidget {
  const SupplyChainDashboardPage({super.key});
  static const String routeName = 'supply-chain-dashboard';
  static const String routePath = '/supply-chain';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(supplyChainDashboardProvider);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(title: const Text('Supply Chain')),
      body: state.isLoading
          ? const LoadingView()
          : state.failure != null
              ? FailureView(failure: state.failure!, onRetry: () => ref.invalidate(supplyChainDashboardProvider))
              : ListView(
                  padding: const EdgeInsets.all(Spacing.x4),
                  children: [
                    _KpiCard(
                      icon: Icons.local_shipping,
                      label: 'Active Shipments',
                      value: '${state.activeShipments}',
                      color: t.info,
                    ),
                    const SizedBox(height: Spacing.x3),
                    _KpiCard(
                      icon: Icons.schedule,
                      label: 'Pending Appointments',
                      value: '${state.pendingAppointments}',
                      color: t.warning,
                    ),
                    const SizedBox(height: Spacing.x3),
                    _KpiCard(
                      icon: Icons.swap_horiz,
                      label: 'Pending Transfers',
                      value: '${state.pendingTransfers}',
                      color: t.primary,
                    ),
                    const SizedBox(height: Spacing.x4),
                    UiCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const UiSectionHeader(title: 'Shipments by Status'),
                          if (state.shipmentsByStatus.isEmpty)
                            const Padding(
                              padding: EdgeInsets.symmetric(vertical: Spacing.x4),
                              child: Center(child: Text('No shipment data')),
                            )
                          else
                            ...state.shipmentsByStatus.entries.map((entry) => Padding(
                              padding: const EdgeInsets.symmetric(vertical: Spacing.x1),
                              child: Row(children: [
                                Expanded(child: Text(entry.key,
                                    style: TextStyle(color: t.textSecondary),),),
                                Text('${entry.value}',
                                    style: Theme.of(context).textTheme.labelLarge,),
                              ],),
                            ),),
                        ],
                      ),
                    ),
                    if (state.recentEvents.isNotEmpty) ...[
                      const SizedBox(height: Spacing.x4),
                      UiCard(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const UiSectionHeader(title: 'Recent Events'),
                            ...state.recentEvents.take(5).map((event) => Padding(
                              padding: const EdgeInsets.symmetric(vertical: Spacing.x1),
                              child: Row(children: [
                                Icon(Icons.circle, size: Spacing.x2, color: t.info),
                                const SizedBox(width: Spacing.x2),
                                Expanded(child: Text(
                                  '${event.status ?? 'Update'}${event.location != null ? ' @ ${event.location}' : ''}',
                                  style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
                                ),),
                              ],),
                            ),),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
    );
  }
}

class _KpiCard extends StatelessWidget {
  const _KpiCard({required this.icon, required this.label, required this.value, required this.color});
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    return UiCard(
      child: Row(children: [
        Container(
          padding: const EdgeInsets.all(Spacing.x3),
          decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: Radii.control),
          child: Icon(icon, color: color),
        ),
        const SizedBox(width: Spacing.x3),
        Expanded(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(value, style: Theme.of(context).textTheme.headlineSmall),
            Text(label, style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs)),
          ],
        ),),
      ],),
    );
  }
}