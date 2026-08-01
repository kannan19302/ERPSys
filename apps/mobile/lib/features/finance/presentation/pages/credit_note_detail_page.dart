import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/finance.dart';
import '../providers/finance_providers.dart';

class CreditNoteDetailPage extends ConsumerWidget {
  const CreditNoteDetailPage({required this.creditNoteId, super.key});

  static const String routeName = 'credit-note-detail';
  static const String routePath = '/finance/credit-notes/:id';

  final String creditNoteId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<CreditNote> cnAsync =
        ref.watch(creditNoteDetailProvider(creditNoteId));

    return Scaffold(
      appBar: AppBar(title: const Text('Credit Note')),
      body: cnAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load credit note.'),
          onRetry: () => ref.invalidate(creditNoteDetailProvider(creditNoteId)),
        ),
        data: (CreditNote cn) => _CreditNoteDetail(creditNote: cn),
      ),
    );
  }
}

class _CreditNoteDetail extends StatelessWidget {
  const _CreditNoteDetail({required this.creditNote});

  final CreditNote creditNote;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    final (String statusLabel, UiTone tone) = switch (creditNote.status) {
      'APPLIED' => ('Applied', UiTone.success),
      'ISSUED' => ('Issued', UiTone.info),
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
                      creditNote.creditNoteNumber,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  UiStatusBadge(label: statusLabel, tone: tone),
                ],
              ),
              const SizedBox(height: Spacing.x2),
              Text(creditNote.customerName ?? '—', style: TextStyle(color: t.textSecondary)),
              if (creditNote.reason != null) ...[
                const SizedBox(height: Spacing.x1),
                Text(creditNote.reason!, style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs)),
              ],
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const UiSectionHeader(title: 'Line Items'),
              ...creditNote.items.map(
                (CreditNoteLineItem item) => _LineItemRow(
                  item: item,
                  currency: creditNote.currency,
                ),
              ),
              const Divider(),
              _FieldRow('Total', Formatters.currency(creditNote.totalAmount, currencyCode: creditNote.currency)),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const UiSectionHeader(title: 'Details'),
              _FieldRow('Date', Formatters.date(creditNote.date)),
              _FieldRow('Invoice', creditNote.invoiceId),
              _FieldRow('Currency', creditNote.currency ?? '—'),
            ],
          ),
        ),
      ],
    );
  }
}

class _LineItemRow extends StatelessWidget {
  const _LineItemRow({required this.item, required this.currency});

  final CreditNoteLineItem item;
  final String? currency;

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
                    style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs),
                  ),
              ],
            ),
          ),
          Text('${item.quantity}'),
          const SizedBox(width: Spacing.x2),
          Text(Formatters.currency(item.amount, currencyCode: currency ?? 'USD')),
        ],
      ),
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
