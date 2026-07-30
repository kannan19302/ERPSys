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

class QuotationDetailPage extends ConsumerWidget {
  const QuotationDetailPage({required this.quotationId, super.key});

  static const String routeName = 'quotation-detail';
  static const String routePath = '/sales/quotations/:id';

  final String quotationId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<Quotation> quotationAsync =
        ref.watch(quotationDetailProvider(quotationId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Quotation'),
        actions: <Widget>[
          PermissionGate(
            permission: Permissions.productDelete,
            child: IconButton(
              icon: const Icon(Icons.delete_outline),
              tooltip: 'Delete quotation',
              onPressed: () => _confirmDelete(context, ref),
            ),
          ),
        ],
      ),
      body: quotationAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure
              ? error
              : const ServerFailure('Could not load quotation.'),
          onRetry: () => ref.invalidate(quotationDetailProvider(quotationId)),
        ),
        data: (Quotation quotation) => _QuotationDetail(quotation: quotation, ref: ref),
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (BuildContext dialogContext) => AlertDialog(
        title: const Text('Delete quotation?'),
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
        await ref.read(quotationsProvider.notifier).delete(quotationId);

    if (!context.mounted) return;
    result.fold(
      (failure) => ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(failure.message))),
      (_) => Navigator.of(context).pop(),
    );
  }
}

class _QuotationDetail extends ConsumerWidget {
  const _QuotationDetail({required this.quotation, required this.ref});

  final Quotation quotation;
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
                      quotation.customerName,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  UiStatusBadge(
                    label: quotation.status,
                    tone: _statusTone(quotation.status),
                  ),
                ],
              ),
              const SizedBox(height: Spacing.x1),
              Text(
                'Customer ID: ${quotation.customerId}',
                style: TextStyle(color: t.textSecondary),
              ),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const UiSectionHeader(title: 'Items'),
              ...quotation.items.map(
                (QuotationItem item) => _ItemRow(item: item),
              ),
              const Divider(),
              _Row('Total', Formatters.currency(quotation.totalAmount)),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const UiSectionHeader(title: 'Details'),
              if (quotation.validUntil != null)
                _Row('Valid until', Formatters.date(quotation.validUntil!)),
              if (quotation.notes != null && quotation.notes!.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: Spacing.x2),
                  child: Text(quotation.notes!),
                ),
              if (quotation.createdAt != null)
                _Row('Created', Formatters.dateTime(quotation.createdAt!)),
              if (quotation.updatedAt != null)
                _Row('Updated', Formatters.dateTime(quotation.updatedAt!)),
            ],
          ),
        ),
        if (quotation.status.toUpperCase() == 'DRAFT') ...[
          const SizedBox(height: Spacing.x4),
          Row(
            children: <Widget>[
              Expanded(
                child: FilledButton(
                  onPressed: () => _submitQuotation(context, ref),
                  child: const Text('Submit'),
                ),
              ),
            ],
          ),
        ],
        if (quotation.status.toUpperCase() == 'SUBMITTED') ...[
          const SizedBox(height: Spacing.x4),
          Row(
            children: <Widget>[
              Expanded(
                child: FilledButton(
                  onPressed: () => _acceptQuotation(context, ref),
                  child: const Text('Accept'),
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
        'ACCEPTED' => UiTone.success,
        'CONVERTED' => UiTone.success,
        _ => UiTone.neutral,
      };

  Future<void> _submitQuotation(BuildContext context, WidgetRef ref) async {
    final Result<Quotation> result =
        await ref.read(quotationsProvider.notifier).submit(quotation.id);
    if (!context.mounted) return;
    result.fold(
      (failure) => ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(failure.message))),
      (_) => ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Quotation submitted'))),
    );
  }

  Future<void> _acceptQuotation(BuildContext context, WidgetRef ref) async {
    final Result<Quotation> result =
        await ref.read(quotationsProvider.notifier).accept(quotation.id);
    if (!context.mounted) return;
    result.fold(
      (failure) => ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(failure.message))),
      (_) => ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Quotation accepted'))),
    );
  }
}

class _ItemRow extends StatelessWidget {
  const _ItemRow({required this.item});

  final QuotationItem item;

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
              '${item.quantity}',
              textAlign: TextAlign.right,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ),
          SizedBox(
            width: Spacing.x12,
            child: Text(
              Formatters.currency(item.rate),
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
