import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/finance.dart';
import '../providers/finance_providers.dart';

class JournalEntryDetailPage extends ConsumerWidget {
  const JournalEntryDetailPage({required this.journalEntryId, super.key});

  static const String routeName = 'journal-entry-detail';
  static const String routePath = '/finance/journal-entries/:id';

  final String journalEntryId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<JournalEntry> entryAsync =
        ref.watch(journalEntryDetailProvider(journalEntryId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Journal Entry'),
        actions: <Widget>[
          IconButton(
            icon: const Icon(Icons.delete_outline),
            tooltip: 'Delete entry',
            onPressed: () => _confirmDelete(context, ref),
          ),
        ],
      ),
      body: entryAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load journal entry.'),
          onRetry: () => ref.invalidate(journalEntryDetailProvider(journalEntryId)),
        ),
        data: (JournalEntry entry) => _JournalEntryDetail(entry: entry),
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (BuildContext dialogContext) => AlertDialog(
        title: const Text('Delete journal entry?'),
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
        .read(journalEntriesProvider.notifier)
        .delete(journalEntryId);

    if (!context.mounted) return;
    result.fold(
      (failure) => ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(failure.message))),
      (_) => Navigator.of(context).pop(),
    );
  }
}

class _JournalEntryDetail extends StatelessWidget {
  const _JournalEntryDetail({required this.entry});

  final JournalEntry entry;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    final (String statusLabel, UiTone tone) = switch (entry.status) {
      'POSTED' => ('Posted', UiTone.success),
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
                      entry.entryNumber,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  UiStatusBadge(label: statusLabel, tone: tone),
                ],
              ),
              const SizedBox(height: Spacing.x2),
              if (entry.description != null)
                Text(entry.description!, style: TextStyle(color: t.textSecondary)),
              const SizedBox(height: Spacing.x1),
              Text(
                Formatters.date(entry.date),
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
              Row(
//                 style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs),
                children: <Widget>[
                  Expanded(flex: 3, child: Text('Account')),
                  Expanded(flex: 2, child: Text('Debit', textAlign: TextAlign.right)),
                  Expanded(flex: 2, child: Text('Credit', textAlign: TextAlign.right)),
                ],
              ),
              const Divider(),
              ...entry.lineItems.map(
                (JournalEntryLineItem item) => _LineItemRow(item: item),
              ),
              const Divider(),
              _FieldRow('Total Debit', Formatters.currency(entry.totalDebit)),
              _FieldRow('Total Credit', Formatters.currency(entry.totalCredit)),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const UiSectionHeader(title: 'Details'),
              _FieldRow('Entry Number', entry.entryNumber),
              _FieldRow('Date', Formatters.date(entry.date)),
              _FieldRow('Reference', entry.reference ?? '—'),
              _FieldRow('Status', entry.status),
            ],
          ),
        ),
        if (entry.status == 'DRAFT') ...[
          const SizedBox(height: Spacing.x4),
          _PostButton(entryId: entry.id),
        ],
      ],
    );
  }
}

class _LineItemRow extends StatelessWidget {
  const _LineItemRow({required this.item});

  final JournalEntryLineItem item;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: Spacing.x1_5),
      child: Row(
        children: <Widget>[
          Expanded(
            flex: 3,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(item.accountName ?? item.accountId, style: Theme.of(context).textTheme.labelLarge),
                if (item.description != null && item.description!.isNotEmpty)
                  Text(item.description!, style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs)),
              ],
            ),
          ),
          Expanded(
            flex: 2,
            child: Text(
              item.debit > 0 ? Formatters.currency(item.debit) : '—',
              textAlign: TextAlign.right,
              style: Theme.of(context).textTheme.labelLarge,
            ),
          ),
          Expanded(
            flex: 2,
            child: Text(
              item.credit > 0 ? Formatters.currency(item.credit) : '—',
              textAlign: TextAlign.right,
              style: Theme.of(context).textTheme.labelLarge,
            ),
          ),
        ],
      ),
    );
  }
}

class _PostButton extends ConsumerWidget {
  const _PostButton({required this.entryId});

  final String entryId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return _SectionCard(
      child: FilledButton.icon(
        onPressed: () => _post(context, ref),
        icon: const Icon(Icons.check_circle_outline, size: 18),
        label: const Text('Post Entry'),
      ),
    );
  }

  Future<void> _post(BuildContext context, WidgetRef ref) async {
    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (BuildContext dialogContext) => AlertDialog(
        title: const Text('Post journal entry?'),
        content: const Text('This will post the entry to the general ledger.'),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('No'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: const Text('Post'),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;

    final result = await ref
        .read(journalEntriesProvider.notifier)
        .post(entryId);

    if (!context.mounted) return;
    result.fold(
      (failure) => ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(failure.message))),
      (_) => ref.invalidate(journalEntryDetailProvider(entryId)),
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
          Expanded(child: Text(label, style: TextStyle(color: t.textSecondary))),
          Text(value, style: Theme.of(context).textTheme.labelLarge),
        ],
      ),
    );
  }
}
