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
import '../../domain/entities/sales.dart';
import '../providers/sales_providers.dart';
import '../../../../core/usecase/result.dart';

class DeliveryNoteDetailPage extends ConsumerWidget {
  const DeliveryNoteDetailPage({required this.deliveryNoteId, super.key});

  static const String routeName = 'delivery-note-detail';
  static const String routePath = '/sales/delivery-notes/:id';

  final String deliveryNoteId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<DeliveryNote> noteAsync =
        ref.watch(deliveryNoteDetailProvider(deliveryNoteId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Delivery Note'),
        actions: <Widget>[
          PermissionGate(
            permission: Permissions.productDelete,
            child: IconButton(
              icon: const Icon(Icons.delete_outline),
              tooltip: 'Delete delivery note',
              onPressed: () => _confirmDelete(context, ref),
            ),
          ),
        ],
      ),
      body: noteAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure
              ? error
              : const ServerFailure('Could not load delivery note.'),
          onRetry: () => ref.invalidate(deliveryNoteDetailProvider(deliveryNoteId)),
        ),
        data: (DeliveryNote note) => _DeliveryNoteDetail(note: note, ref: ref),
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (BuildContext dialogContext) => AlertDialog(
        title: const Text('Delete delivery note?'),
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
        await ref.read(deliveryNotesProvider.notifier).delete(deliveryNoteId);

    if (!context.mounted) return;
    result.fold(
      (failure) => ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(failure.message))),
      (_) => Navigator.of(context).pop(),
    );
  }
}

class _DeliveryNoteDetail extends ConsumerWidget {
  const _DeliveryNoteDetail({required this.note, required this.ref});

  final DeliveryNote note;
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
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Text(
                          '#${note.id.length > 8 ? note.id.substring(0, 8) : note.id}',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: Spacing.x1),
                        Text(
                          note.customerName,
                          style: TextStyle(color: t.textSecondary),
                        ),
                      ],
                    ),
                  ),
                  UiStatusBadge(
                    label: note.status,
                    tone: _statusTone(note.status),
                  ),
                ],
              ),
              if (note.deliveryDate != null) ...[
                const SizedBox(height: Spacing.x2),
                _Row('Delivery date', Formatters.date(note.deliveryDate!)),
              ],
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const UiSectionHeader(title: 'Customer'),
              Text(note.customerName),
              if (note.shippingAddress != null && note.shippingAddress!.isNotEmpty) ...[
                const SizedBox(height: Spacing.x2),
                Text(
                  'Shipping: ${note.shippingAddress!}',
                  style: TextStyle(color: t.textSecondary, fontSize: TypeScale.sm),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const UiSectionHeader(title: 'Items'),
              ...note.items.map(
                (DeliveryNoteItem item) => _ItemRow(item: item),
              ),
              const Divider(),
              _Row('Total items', '${note.items.length}'),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const UiSectionHeader(title: 'Details'),
              _Row('Sales Order', note.salesOrderId),
              if (note.notes != null && note.notes!.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: Spacing.x2),
                  child: Text(note.notes!),
                ),
              if (note.createdAt != null)
                _Row('Created', Formatters.dateTime(note.createdAt!)),
              if (note.updatedAt != null)
                _Row('Updated', Formatters.dateTime(note.updatedAt!)),
            ],
          ),
        ),
        if (note.status.toUpperCase() == 'DRAFT') ...[
          const SizedBox(height: Spacing.x4),
          Row(
            children: <Widget>[
              Expanded(
                child: FilledButton(
                  onPressed: () => _submitDeliveryNote(context, ref),
                  child: const Text('Submit'),
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }

  static UiTone _statusTone(String status) => switch (status.toUpperCase()) {
        'DRAFT' => UiTone.neutral,
        'SUBMITTED' => UiTone.info,
        'DELIVERED' => UiTone.success,
        'CANCELLED' => UiTone.danger,
        _ => UiTone.neutral,
      };

  Future<void> _submitDeliveryNote(BuildContext context, WidgetRef ref) async {
    final Result<DeliveryNote> result =
        await ref.read(deliveryNotesProvider.notifier).submit(note.id);
    if (!context.mounted) return;
    result.fold(
      (failure) => ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(failure.message))),
      (_) => ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Delivery note submitted'))),
    );
  }
}

class _ItemRow extends StatelessWidget {
  const _ItemRow({required this.item});

  final DeliveryNoteItem item;

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
