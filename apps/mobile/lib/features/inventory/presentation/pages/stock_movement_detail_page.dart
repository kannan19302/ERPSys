import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/inventory.dart';
import '../providers/inventory_providers.dart';

class StockMovementDetailPage extends ConsumerWidget {
  const StockMovementDetailPage({required this.movementId, super.key});

  static const String routeName = 'stock-movement-detail';
  static const String routePath = '/inventory/stock-movements/:id';

  final String movementId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<StockMovement> movementAsync =
        ref.watch(stockMovementDetailProvider(movementId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Stock Movement'),
      ),
      body: movementAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure
              ? error
              : const ServerFailure('Could not load movement.'),
          onRetry: () =>
              ref.invalidate(stockMovementDetailProvider(movementId)),
        ),
        data: (StockMovement movement) =>
            _MovementDetail(movement: movement),
      ),
    );
  }
}

class _MovementDetail extends StatelessWidget {
  const _MovementDetail({required this.movement});

  final StockMovement movement;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    final (IconData icon, Color color, String label) =
        switch (movement.type) {
      'IN' => (Icons.arrow_downward, t.success, 'Stock In'),
      'OUT' => (Icons.arrow_upward, t.danger, 'Stock Out'),
      'TRANSFER' => (Icons.swap_horiz, t.info, 'Transfer'),
      _ => (Icons.help_outline, t.textSecondary, movement.type),
    };

    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: <Widget>[
        UiCard(
          child: Column(
            children: <Widget>[
              Container(
                height: Spacing.x12,
                width: Spacing.x12,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: Radii.pill,
                ),
                alignment: Alignment.center,
                child: Icon(icon, size: TypeScale.x3l, color: color),
              ),
              const SizedBox(height: Spacing.x3),
              Text(
                label,
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: Spacing.x2),
              Text(
                Formatters.number(movement.quantity),
                style: TextStyle(
                  fontSize: TypeScale.x3l,
                  fontWeight: TypeScale.bold,
                  color: color,
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
              const UiSectionHeader(title: 'Details'),
              _Row('Product ID', movement.productId),
              _Row('Warehouse ID', movement.warehouseId),
              _Row('Type', label),
              _Row('Quantity', Formatters.number(movement.quantity)),
              _Row('Reference', movement.reference ?? '—'),
              _Row('Reason', movement.reason ?? '—'),
              if (movement.createdAt != null)
                _Row('Date', Formatters.dateTime(movement.createdAt!)),
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
