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

class InventoryAdjustmentDetailPage extends ConsumerWidget {
  const InventoryAdjustmentDetailPage({required this.adjustmentId, super.key});

  static const String routeName = 'inventory-adjustment-detail';
  static const String routePath = '/inventory/adjustments/:id';

  final String adjustmentId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<InventoryAdjustment> adjustmentAsync =
        ref.watch(inventoryAdjustmentDetailProvider(adjustmentId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Adjustment'),
      ),
      body: adjustmentAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure
              ? error
              : const ServerFailure('Could not load adjustment.'),
          onRetry: () =>
              ref.invalidate(inventoryAdjustmentDetailProvider(adjustmentId)),
        ),
        data: (InventoryAdjustment adjustment) =>
            _AdjustmentDetail(adjustment: adjustment),
      ),
    );
  }
}

class _AdjustmentDetail extends StatelessWidget {
  const _AdjustmentDetail({required this.adjustment});

  final InventoryAdjustment adjustment;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    final (IconData icon, Color color, String label) =
        switch (adjustment.type) {
      'POSITIVE' => (Icons.add_circle_outline, t.success, 'Positive Adjustment'),
      'NEGATIVE' => (Icons.remove_circle_outline, t.danger, 'Negative Adjustment'),
      'ADJUST' => (Icons.tune_outlined, t.info, 'Stock Adjust'),
      _ => (Icons.help_outline, t.textSecondary, adjustment.type),
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
                Formatters.number(adjustment.quantity),
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
              _Row('Product ID', adjustment.productId),
              _Row('Warehouse ID', adjustment.warehouseId),
              _Row('Type', label),
              _Row('Quantity', Formatters.number(adjustment.quantity)),
              _Row('Reason', adjustment.reason ?? '—'),
              _Row('Reference', adjustment.reference ?? '—'),
              if (adjustment.createdAt != null)
                _Row('Date', Formatters.dateTime(adjustment.createdAt!)),
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
