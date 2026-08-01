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

class ReorderRuleDetailPage extends ConsumerWidget {
  const ReorderRuleDetailPage({required this.ruleId, super.key});

  static const String routeName = 'reorder-rule-detail';
  static const String routePath = '/inventory/reorder-rules/:id';

  final String ruleId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<ReorderRule> ruleAsync =
        ref.watch(reorderRuleDetailProvider(ruleId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Reorder Rule'),
        actions: <Widget>[
          PermissionGate(
            permission: Permissions.productDelete,
            child: IconButton(
              icon: const Icon(Icons.edit_outlined),
              tooltip: 'Edit rule',
              onPressed: () => Navigator.of(context).pushNamed('reorder-rule-edit', arguments: <String, String>{'id': ruleId}),
            ),
          ),
          PermissionGate(
            permission: Permissions.productDelete,
            child: IconButton(
              icon: const Icon(Icons.delete_outline),
              tooltip: 'Delete rule',
              onPressed: () => _confirmDelete(context, ref),
            ),
          ),
        ],
      ),
      body: ruleAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure
              ? error
              : const ServerFailure('Could not load rule.'),
          onRetry: () => ref.invalidate(reorderRuleDetailProvider(ruleId)),
        ),
        data: (ReorderRule rule) => _ReorderRuleDetail(rule: rule),
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (BuildContext dialogContext) => AlertDialog(
        title: const Text('Delete rule?'),
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
        .read(reorderRuleListControllerProvider.notifier)
        .delete(ruleId);

    if (!context.mounted) return;
    result.fold(
      (failure) => ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(failure.message))),
      (_) => Navigator.of(context).pop(),
    );
  }
}

class _ReorderRuleDetail extends StatelessWidget {
  const _ReorderRuleDetail({required this.rule});

  final ReorderRule rule;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

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
                      'Reorder Rule',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  UiStatusBadge(
                    label: rule.isActive ? 'Active' : 'Inactive',
                    tone: rule.isActive ? UiTone.success : UiTone.neutral,
                  ),
                ],
              ),
              const SizedBox(height: Spacing.x3),
              _Row('Product ID', rule.productId),
              _Row('Warehouse ID', rule.warehouseId),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const UiSectionHeader(title: 'Stock Thresholds'),
              const SizedBox(height: Spacing.x2),
              Row(
                children: <Widget>[
                  _ThresholdBox(
                    label: 'Min Stock',
                    value: rule.minStock,
                    color: t.danger,
                  ),
                  const SizedBox(width: Spacing.x3),
                  _ThresholdBox(
                    label: 'Max Stock',
                    value: rule.maxStock,
                    color: t.success,
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
              _Row('Lead Time', '${rule.leadTime} day${rule.leadTime == 1 ? '' : 's'}'),
              if (rule.createdAt != null)
                _Row('Created', Formatters.dateTime(rule.createdAt!)),
            ],
          ),
        ),
      ],
    );
  }
}

class _ThresholdBox extends StatelessWidget {
  const _ThresholdBox({
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
        padding: const EdgeInsets.all(Spacing.x4),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: Radii.control,
        ),
        child: Column(
          children: <Widget>[
            Text(
              Formatters.number(value),
              style: TextStyle(
                fontWeight: TypeScale.semibold,
                color: color,
                fontSize: TypeScale.x2l,
              ),
            ),
            const SizedBox(height: Spacing.x1),
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
