import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/finance.dart';
import '../providers/finance_providers.dart';

class TaxFilingDetailPage extends ConsumerWidget {
  const TaxFilingDetailPage({required this.taxFilingId, super.key});

  static const String routeName = 'tax-filing-detail';
  static const String routePath = '/finance/tax-filings/:id';

  final String taxFilingId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<TaxFiling> filingAsync =
        ref.watch(taxFilingDetailProvider(taxFilingId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Tax Filing'),
        actions: <Widget>[
          IconButton(
            icon: const Icon(Icons.delete_outline),
            tooltip: 'Delete filing',
            onPressed: () => _confirmDelete(context, ref),
          ),
        ],
      ),
      body: filingAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load tax filing.'),
          onRetry: () => ref.invalidate(taxFilingDetailProvider(taxFilingId)),
        ),
        data: (TaxFiling filing) => _TaxFilingDetail(filing: filing),
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (BuildContext dialogContext) => AlertDialog(
        title: const Text('Delete tax filing?'),
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
        .read(taxFilingsProvider.notifier)
        .delete(taxFilingId);

    if (!context.mounted) return;
    result.fold(
      (failure) => ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(failure.message))),
      (_) => Navigator.of(context).pop(),
    );
  }
}

class _TaxFilingDetail extends StatelessWidget {
  const _TaxFilingDetail({required this.filing});

  final TaxFiling filing;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    final (String statusLabel, UiTone tone) = switch (filing.status) {
      'FILED' => ('Filed', UiTone.info),
      'SUBMITTED' => ('Submitted', UiTone.warning),
      'ACKNOWLEDGED' => ('Acknowledged', UiTone.success),
      _ => ('Draft', UiTone.neutral),
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
                      '${filing.taxType} — ${filing.period}',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  UiStatusBadge(label: statusLabel, tone: tone),
                ],
              ),
              const SizedBox(height: Spacing.x2),
              Text(filing.returnType, style: TextStyle(color: t.textSecondary)),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const UiSectionHeader(title: 'Filing Details'),
              _FieldRow('Tax Type', filing.taxType),
              _FieldRow('Period', filing.period),
              _FieldRow('Return Type', filing.returnType),
              _FieldRow('Total Tax', Formatters.currency(filing.totalTax)),
              _FieldRow('Due Date', Formatters.date(filing.dueAt)),
              _FieldRow('Filed At', filing.filedAt != null ? Formatters.dateTime(filing.filedAt!) : '—'),
              _FieldRow('Status', filing.status),
            ],
          ),
        ),
        if (filing.notes != null && filing.notes!.isNotEmpty) ...[
          const SizedBox(height: Spacing.x4),
          _SectionCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                const UiSectionHeader(title: 'Notes'),
                Text(filing.notes!),
              ],
            ),
          ),
        ],
        if (filing.status == 'DRAFT') ...[
          const SizedBox(height: Spacing.x4),
          _ActionButtons(filingId: filing.id),
        ],
      ],
    );
  }
}

class _ActionButtons extends ConsumerWidget {
  const _ActionButtons({required this.filingId});

  final String filingId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return _SectionCard(
      child: FilledButton.icon(
        onPressed: () => _submit(context, ref),
        icon: const Icon(Icons.check_circle_outline, size: 18),
        label: const Text('Submit Filing'),
      ),
    );
  }

  Future<void> _submit(BuildContext context, WidgetRef ref) async {
    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (BuildContext dialogContext) => AlertDialog(
        title: const Text('Submit tax filing?'),
        content: const Text('The filing will be submitted for processing.'),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('No'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: const Text('Submit'),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;

    final result = await ref
        .read(taxFilingsProvider.notifier)
        .submit(filingId);

    if (!context.mounted) return;
    result.fold(
      (failure) => ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(failure.message))),
      (_) => ref.invalidate(taxFilingDetailProvider(filingId)),
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
