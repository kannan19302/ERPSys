import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/rbac/permissions.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/sales.dart';
import '../providers/sales_providers.dart';
import '../../../../core/usecase/result.dart';

class SalesReturnDetailPage extends ConsumerWidget {
  const SalesReturnDetailPage({required this.salesReturnId, super.key});

  static const String routeName = 'sales-return-detail';
  static const String routePath = '/sales/returns/:id';

  final String salesReturnId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<SalesReturn> retAsync =
        ref.watch(salesReturnDetailProvider(salesReturnId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Sales Return'),
        actions: <Widget>[
          PermissionGate(
            permission: Permissions.productDelete,
            child: IconButton(
              icon: const Icon(Icons.delete_outline),
              tooltip: 'Delete sales return',
              onPressed: () => _confirmDelete(context, ref),
            ),
          ),
        ],
      ),
      body: retAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure
              ? error
              : const ServerFailure('Could not load sales return.'),
          onRetry: () => ref.invalidate(salesReturnDetailProvider(salesReturnId)),
        ),
        data: (SalesReturn ret) => _SalesReturnDetail(ret: ret, ref: ref),
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (BuildContext dialogContext) => AlertDialog(
        title: const Text('Delete sales return?'),
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

    final result =
        await ref.read(salesReturnsProvider.notifier).delete(salesReturnId);

    if (!context.mounted) return;
    result.fold(
      (failure) => ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(failure.message))),
      (_) => Navigator.of(context).pop(),
    );
  }
}

class _SalesReturnDetail extends ConsumerWidget {
  const _SalesReturnDetail({required this.ret, required this.ref});

  final SalesReturn ret;
  final WidgetRef ref;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
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
                      ret.customerName,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  UiStatusBadge(
                    label: ret.status,
                    tone: _statusTone(ret.status),
                  ),
                ],
              ),
              const SizedBox(height: Spacing.x2),
              _Row('Sales Order', ret.salesOrderId),
              _Row('Total', Formatters.currency(ret.totalAmount)),
              _Row('Reason', ret.reason),
              _Row('Type', ret.reasonType),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const UiSectionHeader(title: 'Items Returned'),
              ...ret.items.map(
                (SalesReturnItem item) => _ItemRow(item: item),
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
              if (ret.notes != null && ret.notes!.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: Spacing.x2),
                  child: Text(ret.notes!),
                ),
              if (ret.createdAt != null)
                _Row('Created', Formatters.dateTime(ret.createdAt!)),
              if (ret.updatedAt != null)
                _Row('Updated', Formatters.dateTime(ret.updatedAt!)),
            ],
          ),
        ),
        if (ret.status.toUpperCase() == 'PENDING') ...[
          const SizedBox(height: Spacing.x4),
          Row(
            children: <Widget>[
              Expanded(
                child: OutlinedButton(
                  onPressed: () => _rejectReturn(context, ref),
                  style: OutlinedButton.styleFrom(foregroundColor: t.danger),
                  child: const Text('Reject'),
                ),
              ),
              const SizedBox(width: Spacing.x3),
              Expanded(
                child: FilledButton(
                  onPressed: () => _approveReturn(context, ref),
                  child: const Text('Approve'),
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }

  static UiTone _statusTone(String status) => switch (status.toUpperCase()) {
        'PENDING' => UiTone.warning,
        'APPROVED' => UiTone.success,
        'REJECTED' => UiTone.danger,
        _ => UiTone.neutral,
      };

  Future<void> _approveReturn(BuildContext context, WidgetRef ref) async {
    final Result<SalesReturn> result =
        await ref.read(salesReturnsProvider.notifier).approve(ret.id);
    if (!context.mounted) return;
    result.fold(
      (failure) => ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(failure.message))),
      (_) => ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Sales return approved'))),
    );
  }

  Future<void> _rejectReturn(BuildContext context, WidgetRef ref) async {
    final Result<SalesReturn> result =
        await ref.read(salesReturnsProvider.notifier).reject(ret.id);
    if (!context.mounted) return;
    result.fold(
      (failure) => ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(failure.message))),
      (_) => ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Sales return rejected'))),
    );
  }
}

class _ItemRow extends StatelessWidget {
  const _ItemRow({required this.item});

  final SalesReturnItem item;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: Spacing.x1_5),
      child: Row(
        children: <Widget>[
          Expanded(
            flex: 2,
            child: Text(
              item.productName,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          SizedBox(
            width: Spacing.x10,
            child: Text(
              'x${item.quantity}',
              textAlign: TextAlign.right,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ),
          SizedBox(
            width: Spacing.x12,
            child: Text(
              Formatters.currency(item.amount),
              textAlign: TextAlign.right,
              style: Theme.of(context).textTheme.labelLarge,
            ),
          ),
        ],
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
