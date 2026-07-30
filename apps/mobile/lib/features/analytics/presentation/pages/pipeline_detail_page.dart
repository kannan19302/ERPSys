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

class PipelineDetailPage extends ConsumerWidget {
  const PipelineDetailPage({required this.pipelineId, super.key});

  static const String routeName = 'pipeline-detail';
  static const String routePath = '/analytics/pipelines/:id';

  final String pipelineId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<AnalyticsPipeline> pipelineAsync =
        ref.watch(analyticsPipelineDetailProvider(pipelineId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Pipeline'),
      ),
      body: pipelineAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load pipeline.'),
          onRetry: () => ref.invalidate(analyticsPipelineDetailProvider(pipelineId)),
        ),
        data: (AnalyticsPipeline pipeline) => _PipelineDetail(pipeline: pipeline),
      ),
    );
  }
}

class _PipelineDetail extends StatelessWidget {
  const _PipelineDetail({required this.pipeline});

  final AnalyticsPipeline pipeline;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    final (String statusLabel, Color statusColor, Color statusBg) =
        switch (pipeline.status) {
      'ACTIVE' => ('Active', t.success, t.successLight),
      'INACTIVE' => ('Inactive', t.textSecondary, t.bgSunken),
      _ => ('Active', t.success, t.successLight),
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
                      pipeline.name,
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
              const SizedBox(height: Spacing.x2),
              Row(
                children: <Widget>[
                  Text(
                    'Total: ${Formatters.compact(pipeline.totalValue)}',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const _SectionTitle(title: 'Stages'),
              if (pipeline.stages.isEmpty)
                Text('No stages', style: TextStyle(color: t.textSecondary))
              else
                ...pipeline.stages.map((PipelineStage stage) => Padding(
                      padding: const EdgeInsets.only(bottom: Spacing.x3),
                      child: Row(
                        children: <Widget>[
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: <Widget>[
                                Text(stage.name ?? 'Stage',
                                    style: Theme.of(context).textTheme.labelLarge),
                                const SizedBox(height: Spacing.x1),
                                LinearProgressIndicator(
                                  value: stage.probability ?? 0,
                                  backgroundColor: t.bgSunken,
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: Spacing.x3),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: <Widget>[
                              Text(Formatters.compact(stage.value),
                                  style: Theme.of(context).textTheme.labelLarge),
                              Text('${stage.count} deals',
                                  style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs)),
                            ],
                          ),
                        ],
                      ),
                    )),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const _SectionTitle(title: 'Details'),
              _FieldRow('Status', statusLabel),
              _FieldRow('Total Value', Formatters.currency(pipeline.totalValue)),
              _FieldRow('Created', pipeline.createdAt != null ? Formatters.dateTime(pipeline.createdAt!) : '—'),
              _FieldRow('Updated', pipeline.updatedAt != null ? Formatters.dateTime(pipeline.updatedAt!) : '—'),
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
