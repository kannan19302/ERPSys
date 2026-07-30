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

class StockLevelDetailPage extends ConsumerWidget {
  const StockLevelDetailPage({required this.stockLevelId, super.key});

  static const String routeName = 'stock-level-detail';
  static const String routePath = '/inventory/stock-levels/:id';

  final String stockLevelId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<StockLevel> levelAsync =
        ref.watch(stockLevelDetailProvider(stockLevelId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Stock Level'),
      ),
      body: levelAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure
              ? error
              : const ServerFailure('Could not load stock level.'),
          onRetry: () =>
              ref.invalidate(stockLevelDetailProvider(stockLevelId)),
        ),
        data: (StockLevel level) => _StockLevelDetail(level: level),
      ),
    );
  }
}

class _StockLevelDetail extends StatelessWidget {
  const _StockLevelDetail({required this.level});

  final StockLevel level;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    final UiTone stockTone = level.isLowStock
        ? UiTone.danger
        : level.availableQuantity <= level.reorderPoint * 1.5
            ? UiTone.warning
            : UiTone.success;

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
                      'Stock Level',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  UiStatusBadge(
                    label: level.isLowStock ? 'Low stock' : 'In stock',
                    tone: stockTone,
                  ),
                ],
              ),
              const SizedBox(height: Spacing.x3),
              _Row('Product ID', level.productId),
              _Row('Warehouse ID', level.warehouseId),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const UiSectionHeader(title: 'Quantities'),
              const SizedBox(height: Spacing.x2),
              Row(
                children: <Widget>[
                  _QtyBadge(
                    label: 'On Hand',
                    value: level.quantity,
                    color: t.info,
                  ),
                  const SizedBox(width: Spacing.x3),
                  _QtyBadge(
                    label: 'Reserved',
                    value: level.reservedQuantity,
                    color: t.warning,
                  ),
                  const SizedBox(width: Spacing.x3),
                  _QtyBadge(
                    label: 'Available',
                    value: level.availableQuantity,
                    color: t.success,
                  ),
                ],
              ),
              const SizedBox(height: Spacing.x3),
              ClipRRect(
                borderRadius: Radii.pill,
                child: LinearProgressIndicator(
                  value: level.quantity == 0
                      ? 0
                      : (level.availableQuantity / level.quantity).clamp(0.0, 1.0),
                  minHeight: 6,
                  backgroundColor: t.bgSunken,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    level.availableRatio > 0.5 ? t.success : t.warning,
                  ),
                ),
              ),
              const SizedBox(height: Spacing.x1),
              Text(
                '${((level.quantity == 0 ? 0 : level.availableQuantity / level.quantity) * 100).toStringAsFixed(0)}% available',
                style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs),
              ),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const UiSectionHeader(title: 'Reorder'),
              _Row('Reorder point', Formatters.number(level.reorderPoint)),
              _Row('Below threshold', level.isLowStock ? 'Yes' : 'No'),
              if (level.createdAt != null)
                _Row('Last updated', Formatters.dateTime(level.createdAt!)),
            ],
          ),
        ),
      ],
    );
  }
}

class _QtyBadge extends StatelessWidget {
  const _QtyBadge({
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final double value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(Spacing.x3),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: Radii.control,
        ),
        child: Column(
          children: <Widget>[
            Text(
              Formatters.number(value),
              style: TextStyle(
                fontWeight: TypeScale.semibold,
                color: color,
                fontSize: TypeScale.xl,
              ),
            ),
            const SizedBox(height: Spacing.x0_5),
            Text(label, style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
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

extension on StockLevel {
  double get availableRatio =>
      quantity == 0 ? 0 : availableQuantity / quantity;
}
