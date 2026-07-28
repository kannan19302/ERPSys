import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/pos.dart';
import '../providers/pos_providers.dart';

/// `GET /pos/shifts/:id`. Read-only.
class PosShiftDetailPage extends ConsumerWidget {
  const PosShiftDetailPage({required this.shiftId, super.key});

  static const String routeName = 'pos-shift-detail';

  final String shiftId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<PosShift> shiftAsync =
        ref.watch(posShiftDetailProvider(shiftId));

    return Scaffold(
      appBar: AppBar(title: const Text('Shift')),
      body: shiftAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load shift.'),
          onRetry: () => ref.invalidate(posShiftDetailProvider(shiftId)),
        ),
        data: (PosShift shift) => _PosShiftDetail(shift: shift),
      ),
    );
  }
}

class _PosShiftDetail extends StatelessWidget {
  const _PosShiftDetail({required this.shift});

  final PosShift shift;

  @override
  Widget build(BuildContext context) {
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
                      'Shift ${Formatters.dateTime(shift.openedAt)}',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  UiStatusBadge(
                    label: shift.status,
                    tone: shift.status == 'OPEN' ? UiTone.success : UiTone.neutral,
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
              const UiSectionHeader(title: 'Sales'),
              _Row('Cash sales', Formatters.currency(shift.cashSales)),
              _Row('Card sales', Formatters.currency(shift.cardSales)),
              _Row('Total sales', Formatters.currency(shift.totalSales)),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const UiSectionHeader(title: 'Balances'),
              _Row('Opening balance', Formatters.currency(shift.openingBalance)),
              _Row(
                'Closing balance',
                shift.closingBalance == null
                    ? '—'
                    : Formatters.currency(shift.closingBalance!),
              ),
              _Row(
                'Closed at',
                shift.closedAt == null ? '—' : Formatters.dateTime(shift.closedAt!),
              ),
            ],
          ),
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
