import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/finance.dart';
import '../providers/finance_providers.dart';

class InvoiceDetailPage extends ConsumerWidget {
  const InvoiceDetailPage({required this.invoiceId, super.key});

  static const String routeName = 'invoice-detail';
  static const String routePath = '/finance/invoices/:id';

  final String invoiceId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<Invoice> invoiceAsync =
        ref.watch(invoiceDetailProvider(invoiceId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Invoice'),
        actions: <Widget>[
          IconButton(
            icon: const Icon(Icons.delete_outline),
            tooltip: 'Delete invoice',
            onPressed: () => _confirmDelete(context, ref),
          ),
        ],
      ),
      body: invoiceAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load invoice.'),
          onRetry: () => ref.invalidate(invoiceDetailProvider(invoiceId)),
        ),
        data: (Invoice invoice) => _InvoiceDetail(invoice: invoice),
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (BuildContext dialogContext) => AlertDialog(
        title: const Text('Delete invoice?'),
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
        .read(invoicesProvider.notifier)
        .delete(invoiceId);

    if (!context.mounted) return;
    result.fold(
      (failure) => ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(failure.message))),
      (_) => Navigator.of(context).pop(),
    );
  }
}

class _InvoiceDetail extends StatelessWidget {
  const _InvoiceDetail({required this.invoice});

  final Invoice invoice;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    final (String statusLabel, UiTone tone) = switch (invoice.status) {
      'PAID' => ('Paid', UiTone.success),
      'PARTIALLY_PAID' => ('Partially paid', UiTone.info),
      'SENT' => ('Sent', UiTone.info),
      'OVERDUE' => ('Overdue', UiTone.danger),
      'CANCELLED' => ('Cancelled', UiTone.neutral),
      _ => ('Draft', UiTone.warning),
    };

    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: <Widget>[
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
                children: <Widget>[
                  Expanded(
                    child: Text(
                      invoice.invoiceNumber,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  UiStatusBadge(label: statusLabel, tone: tone),
                ],
              ),
              const SizedBox(height: Spacing.x2),
              Text(invoice.customerName, style: TextStyle(color: t.textSecondary)),
              const SizedBox(height: Spacing.x1),
              Text(
                'Invoice date: ${Formatters.date(invoice.invoiceDate)}',
                style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs),
              ),
              Text(
                'Due date: ${Formatters.date(invoice.dueDate)}',
                style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs),
              ),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const UiSectionHeader(title: 'Line Items'),
              ...invoice.items.map(
                (InvoiceLineItem item) => _LineItemRow(
                  item: item,
                  currency: invoice.currency,
                ),
              ),
              const Divider(),
              _FieldRow('Subtotal', Formatters.currency(invoice.subtotal, currencyCode: invoice.currency)),
              _FieldRow('Tax', Formatters.currency(invoice.taxTotal, currencyCode: invoice.currency)),
              if (invoice.discountTotal > 0)
                _FieldRow('Discount', Formatters.currency(invoice.discountTotal, currencyCode: invoice.currency)),
              _FieldRow('Total', Formatters.currency(invoice.totalAmount, currencyCode: invoice.currency)),
            ],
          ),
        ),
        if (invoice.notes != null && invoice.notes!.isNotEmpty) ...[
          const SizedBox(height: Spacing.x4),
          _SectionCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                const UiSectionHeader(title: 'Notes'),
                Text(invoice.notes!),
              ],
            ),
          ),
        ],
        if (invoice.status == 'DRAFT') ...[
          const SizedBox(height: Spacing.x4),
          _ActionButtons(invoiceId: invoice.id),
        ],
      ],
    );
  }
}

class _LineItemRow extends StatelessWidget {
  const _LineItemRow({required this.item, required this.currency});

  final InvoiceLineItem item;
  final String currency;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: Spacing.x1_5),
      child: Row(
        children: <Widget>[
          Expanded(
            flex: 2,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(item.productName ?? 'Item', style: Theme.of(context).textTheme.labelLarge),
                if (item.description != null && item.description!.isNotEmpty)
                  Text(
                    item.description!,
                    style: TextStyle(
                      color: t.textTertiary,
                      fontSize: TypeScale.xs,
                    ),
                  ),
              ],
            ),
          ),
          Text('${item.quantity}'), // ignore: lines_longer_than_80_chars
          const SizedBox(width: Spacing.x2),
          Text(Formatters.currency(item.rate, currencyCode: currency)),
          const SizedBox(width: Spacing.x2),
          SizedBox(
            width: 80,
            child: Text(
              Formatters.currency(item.amount, currencyCode: currency),
              textAlign: TextAlign.right,
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionButtons extends ConsumerWidget {
  const _ActionButtons({required this.invoiceId});

  final String invoiceId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return _SectionCard(
      child: Row(
        children: <Widget>[
          Expanded(
            child: OutlinedButton.icon(
              onPressed: () => _performAction(context, ref, 'cancel'),
              icon: const Icon(Icons.cancel_outlined, size: 18),
              label: const Text('Cancel'),
            ),
          ),
          const SizedBox(width: Spacing.x3),
          Expanded(
            child: FilledButton.icon(
              onPressed: () => _performAction(context, ref, 'submit'),
              icon: const Icon(Icons.check_circle_outline, size: 18),
              label: const Text('Submit'),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _performAction(
    BuildContext context,
    WidgetRef ref,
    String action,
  ) async {
    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (BuildContext dialogContext) => AlertDialog(
        title: Text('${action == 'submit' ? 'Submit' : 'Cancel'} invoice?'),
        content: Text(
          action == 'submit'
              ? 'The invoice will be submitted for payment.'
              : 'This will cancel the invoice.',
        ),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('No'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: Text(action == 'submit' ? 'Submit' : 'Cancel'),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;

    final result = action == 'submit'
        ? await ref.read(invoicesProvider.notifier).submit(invoiceId)
        : await ref.read(invoicesProvider.notifier).cancel(invoiceId);

    if (!context.mounted) return;
    result.fold(
      (failure) => ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(failure.message))),
      (_) => ref.invalidate(invoiceDetailProvider(invoiceId)),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(Spacing.x4),
      decoration: BoxDecoration(
        color: t.bgElevated,
        borderRadius: Radii.card,
        border: Border.all(color: t.border),
      ),
      child: child,
    );
  }
}

class _FieldRow extends StatelessWidget {
  const _FieldRow(this.label, this.value);

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
