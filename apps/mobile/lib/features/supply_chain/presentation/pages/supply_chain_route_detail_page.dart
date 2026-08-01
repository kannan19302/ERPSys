import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/supply_chain.dart';
import '../providers/supply_chain_providers.dart';

class SupplyChainRouteDetailPage extends ConsumerWidget {
  const SupplyChainRouteDetailPage({required this.routeId, super.key});
  static const String routeName = 'supply-chain-route-detail';
  final String routeId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(routeDetailProvider(routeId));
    return Scaffold(
      appBar: AppBar(title: const Text('Route')),
      body: async.when(
        loading: () => const LoadingView(),
        error: (Object error, _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load route.'),
          onRetry: () => ref.invalidate(routeDetailProvider(routeId)),
        ),
        data: (SupplyChainRoute route) => _RouteDetail(route: route),
      ),
    );
  }
}

class _RouteDetail extends StatelessWidget {
  const _RouteDetail({required this.route});
  final SupplyChainRoute route;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: [
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Expanded(child: Text(route.name, style: Theme.of(context).textTheme.titleLarge)),
                UiStatusBadge(
                  label: route.isActive ? 'Active' : 'Inactive',
                  tone: route.isActive ? UiTone.success : UiTone.neutral,
                ),
              ],),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const UiSectionHeader(title: 'Route'),
              _Row('Origin', route.origin),
              _Row('Destination', route.destination),
              _Row('Carrier', route.carrierName ?? '—'),
              _Row('Transit time', route.transitTime != null ? '${route.transitTime} days' : '—'),
              _Row('Cost', '\$${route.cost.toStringAsFixed(2)}'),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const UiSectionHeader(title: 'Details'),
              _Row('Created', route.createdAt != null ? Formatters.date(route.createdAt!) : '—'),
            ],
          ),
        ),
      ],
    );
  }
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
      ],),
    );
  }
}