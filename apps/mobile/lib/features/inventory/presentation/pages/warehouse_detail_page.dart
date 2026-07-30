import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/rbac/permissions.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/inventory.dart';
import '../providers/inventory_providers.dart';

class WarehouseDetailPage extends ConsumerWidget {
  const WarehouseDetailPage({required this.warehouseId, super.key});

  static const String routeName = 'warehouse-detail';
  static const String routePath = '/inventory/warehouses/:id';

  final String warehouseId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<Warehouse> warehouseAsync =
        ref.watch(warehouseDetailProvider(warehouseId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Warehouse'),
        actions: <Widget>[
          PermissionGate(
            permission: Permissions.productDelete,
            child: IconButton(
              icon: const Icon(Icons.edit_outlined),
              tooltip: 'Edit warehouse',
              onPressed: () => _navigateToEdit(context),
            ),
          ),
          PermissionGate(
            permission: Permissions.productDelete,
            child: IconButton(
              icon: const Icon(Icons.delete_outline),
              tooltip: 'Delete warehouse',
              onPressed: () => _confirmDelete(context, ref),
            ),
          ),
        ],
      ),
      body: warehouseAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure
              ? error
              : const ServerFailure('Could not load warehouse.'),
          onRetry: () => ref.invalidate(warehouseDetailProvider(warehouseId)),
        ),
        data: (Warehouse warehouse) =>
            _WarehouseDetail(warehouse: warehouse),
      ),
    );
  }

  void _navigateToEdit(BuildContext context) {
    Navigator.of(context).pushNamed('reorder-rule-edit', arguments: <String, String>{'id': warehouseId});
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (BuildContext dialogContext) => AlertDialog(
        title: const Text('Delete warehouse?'),
        content: const Text('This cannot be undone.'),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;

    final result = await ref
        .read(warehouseListControllerProvider.notifier)
        .delete(warehouseId);

    if (!context.mounted) return;
    result.fold(
      (failure) => ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(failure.message))),
      (_) => Navigator.of(context).pop(),
    );
  }
}

class _WarehouseDetail extends StatelessWidget {
  const _WarehouseDetail({required this.warehouse});

  final Warehouse warehouse;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    final double util = warehouse.utilizationPercent;

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
                      warehouse.name,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  UiStatusBadge(
                    label: warehouse.isActive ? 'Active' : 'Inactive',
                    tone: warehouse.isActive ? UiTone.success : UiTone.neutral,
                  ),
                ],
              ),
              if (warehouse.city != null || warehouse.country != null) ...<Widget>[
                const SizedBox(height: Spacing.x1),
                Text(
                  [warehouse.city, warehouse.country]
                      .whereType<String>()
                      .join(', '),
                  style: TextStyle(color: t.textSecondary),
                ),
              ],
              if (warehouse.address != null && warehouse.address!.isNotEmpty) ...<Widget>[
                const SizedBox(height: Spacing.x1),
                Text(warehouse.address!,
                    style: TextStyle(color: t.textSecondary)),
              ],
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const UiSectionHeader(title: 'Capacity'),
              const SizedBox(height: Spacing.x2),
              ClipRRect(
                borderRadius: Radii.pill,
                child: LinearProgressIndicator(
                  value: (util / 100).clamp(0.0, 1.0),
                  minHeight: 10,
                  backgroundColor: t.bgSunken,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    util > 90 ? t.danger : util > 70 ? t.warning : t.success,
                  ),
                ),
              ),
              const SizedBox(height: Spacing.x2),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: <Widget>[
                  _CapacityLabel('Used', warehouse.usedCapacity, t.warning),
                  _CapacityLabel('Total', warehouse.capacity, t.primary),
                  _CapacityLabel(
                    'Free',
                    (warehouse.capacity - warehouse.usedCapacity).clamp(0, double.infinity),
                    t.success,
                  ),
                ],
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
              _Row('Address', warehouse.address ?? '—'),
              _Row('City', warehouse.city ?? '—'),
              _Row('Country', warehouse.country ?? '—'),
              if (warehouse.createdAt != null)
                _Row('Created', Formatters.dateTime(warehouse.createdAt!)),
            ],
          ),
        ),
      ],
    );
  }
}

class _CapacityLabel extends StatelessWidget {
  const _CapacityLabel(this.label, this.value, this.color);

  final String label;
  final double value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: <Widget>[
        Text(
          value.toStringAsFixed(0),
          style: TextStyle(
            fontWeight: TypeScale.semibold,
            color: color,
            fontSize: TypeScale.lg,
          ),
        ),
        const SizedBox(height: Spacing.x0_5),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall,
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
