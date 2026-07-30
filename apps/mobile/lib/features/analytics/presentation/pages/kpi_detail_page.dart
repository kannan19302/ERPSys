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
import '../../domain/entities/analytics.dart';
import '../providers/analytics_providers.dart';

class KpiDetailPage extends ConsumerWidget {
  const KpiDetailPage({required this.kpiId, super.key});

  static const String routeName = 'kpi-detail';
  static const String routePath = '/analytics/kpis/:id';

  final String kpiId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<AnalyticsKpi> kpiAsync =
        ref.watch(analyticsKpiDetailProvider(kpiId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('KPI'),
      ),
      body: kpiAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load KPI.'),
          onRetry: () => ref.invalidate(analyticsKpiDetailProvider(kpiId)),
        ),
        data: (AnalyticsKpi kpi) => _KpiDetail(kpi: kpi),
      ),
    );
  }
}

class _KpiDetail extends StatelessWidget {
  const _KpiDetail({required this.kpi});

  final AnalyticsKpi kpi;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    final (String statusLabel, Color statusColor, Color statusBg) =
        switch (kpi.status) {
      'ACTIVE' => ('Active', t.success, t.successLight),
      'INACTIVE' => ('Inactive', t.textSecondary, t.bgSunken),
      _ => ('Active', t.success, t.successLight),
    };

    final double? pct = kpi.percentAchieved;

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
                      kpi.name,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: Spacing.x2_5,
                      vertical: Spacing.x1,
                    ),
                    decoration: BoxDecoration(
                      color: statusBg,
                      borderRadius: Radii.pill,
                    ),
                    child: Text(
                      statusLabel,
                      style: TextStyle(
                        color: statusColor,
                        fontSize: TypeScale.xs,
                        fontWeight: TypeScale.medium,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: Spacing.x4),
              Center(
                child: Column(
                  children: <Widget>[
                    Text(
                      Formatters.number(kpi.value),
                      style: Theme.of(context).textTheme.displaySmall,
                    ),
                    if (kpi.unit != null)
                      Text(kpi.unit!, style: TextStyle(color: t.textSecondary)),
                    if (pct != null) ...<Widget>[
                      const SizedBox(height: Spacing.x2),
                      ClipRRect(
                        borderRadius: Radii.pill,
                        child: LinearProgressIndicator(
                          value: pct / 100,
                          minHeight: 8,
                          backgroundColor: t.bgSunken,
                        ),
                      ),
                      const SizedBox(height: Spacing.x1),
                      Text(
                        '${pct.toStringAsFixed(1)}% of target',
                        style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const _SectionTitle(title: 'KPI Details'),
              _FieldRow('Name', kpi.name),
              _FieldRow('Value', Formatters.number(kpi.value)),
              _FieldRow('Target', kpi.target != null ? Formatters.number(kpi.target!) : '—'),
              _FieldRow('Unit', kpi.unit ?? '—'),
              _FieldRow('Period', kpi.period ?? '—'),
              _FieldRow('Trend', kpi.trend ?? '—'),
              _FieldRow('Status', statusLabel),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const _SectionTitle(title: 'Timeline'),
              _FieldRow('Created', kpi.createdAt != null ? Formatters.dateTime(kpi.createdAt!) : '—'),
              _FieldRow('Updated', kpi.updatedAt != null ? Formatters.dateTime(kpi.updatedAt!) : '—'),
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
