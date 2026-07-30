import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/widgets/state_views.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../domain/entities/advanced_finance.dart';
import '../providers/advanced_finance_providers.dart';

class MultiCurrencyRateDetailPage extends ConsumerWidget {
  const MultiCurrencyRateDetailPage({required this.rateId, super.key});

  static const String routeName = 'multi-currency-rate-detail';
  static const String routePath = '/advanced-finance/currency-rates/:id';

  final String rateId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<MultiCurrencyRate> rateAsync =
        ref.watch(multiCurrencyRateDetailProvider(rateId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Currency Rate'),
      ),
      body: rateAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load currency rate.'),
          onRetry: () => ref.invalidate(multiCurrencyRateDetailProvider(rateId)),
        ),
        data: (MultiCurrencyRate rate) => _MultiCurrencyRateDetail(rate: rate),
      ),
    );
  }
}

class _MultiCurrencyRateDetail extends StatelessWidget {
  const _MultiCurrencyRateDetail({required this.rate});

  final MultiCurrencyRate rate;

  @override
  Widget build(BuildContext context) {
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
                      '${rate.fromCurrency} / ${rate.toCurrency}',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: Spacing.x2_5,
                      vertical: Spacing.x1,
                    ),
                    decoration: BoxDecoration(
                      color: context.tokens.infoLight,
                      borderRadius: Radii.pill,
                    ),
                    child: Text(
                      rate.source ?? 'MANUAL',
                      style: TextStyle(
                        color: context.tokens.info,
                        fontSize: TypeScale.xs,
                        fontWeight: TypeScale.medium,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: Spacing.x2),
              Text(
                rate.rate.toStringAsFixed(6),
                style: Theme.of(context).textTheme.headlineMedium,
              ),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const _SectionTitle(title: 'Rate Details'),
              _FieldRow('From Currency', rate.fromCurrency),
              _FieldRow('To Currency', rate.toCurrency),
              _FieldRow('Rate', rate.rate.toStringAsFixed(6)),
              _FieldRow('Source', rate.source ?? '—'),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const _SectionTitle(title: 'Timeline'),
              _FieldRow('Rate Date', rate.rateDate != null ? Formatters.date(rate.rateDate!) : '—'),
              _FieldRow('Created', rate.createdAt != null ? Formatters.dateTime(rate.createdAt!) : '—'),
            ],
          ),
        ),
      ],
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

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: Spacing.x3),
      child: Text(title, style: Theme.of(context).textTheme.titleMedium),
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
