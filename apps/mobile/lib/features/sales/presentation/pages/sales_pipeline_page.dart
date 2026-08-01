import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/sales.dart';
import '../providers/sales_providers.dart';

class SalesPipelinePage extends ConsumerWidget {
  const SalesPipelinePage({super.key});

  static const String routeName = 'sales-pipeline';
  static const String routePath = '/sales/pipeline';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<List<SalesPipeline>> pipelinesAsync =
        ref.watch(salesPipelinesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Sales Pipeline'),
      ),
      body: pipelinesAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure
              ? error
              : const ServerFailure('Could not load pipelines.'),
          onRetry: () => ref.invalidate(salesPipelinesProvider),
        ),
        data: (List<SalesPipeline> pipelines) {
          if (pipelines.isEmpty) {
            return const EmptyView(
              title: 'No pipelines configured',
              message: 'Create a pipeline to track your sales process.',
            );
          }
          return _PipelineView(pipelines: pipelines);
        },
      ),
    );
  }
}

class _PipelineView extends StatelessWidget {
  const _PipelineView({required this.pipelines});

  final List<SalesPipeline> pipelines;

  @override
  Widget build(BuildContext context) {
    // For simplicity, use the first pipeline
    final SalesPipeline pipeline = pipelines.first;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Padding(
          padding: const EdgeInsets.fromLTRB(Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2),
          child: Text(
            pipeline.name,
            style: Theme.of(context).textTheme.titleMedium,
          ),
        ),
        Expanded(
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.all(Spacing.x4),
            children: pipeline.stages.map(
              (PipelineStage stage) => _StageColumn(
                stage: stage,
                opportunities: const <Opportunity>[],
              ),
            ).toList(),
          ),
        ),
      ],
    );
  }
}

class _StageColumn extends StatelessWidget {
  const _StageColumn({
    required this.stage,
    required this.opportunities,
  });

  final PipelineStage stage;
  final List<Opportunity> opportunities;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return Container(
      width: 260,
      margin: const EdgeInsets.only(right: Spacing.x4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          UiCard(
            padding: const EdgeInsets.all(Spacing.x3),
            child: Row(
              children: <Widget>[
                Text(
                  stage.name,
                  style: const TextStyle(
                    fontWeight: TypeScale.semibold,
                    fontSize: TypeScale.sm,
                  ),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: Spacing.x2_5,
                    vertical: Spacing.x0_5,
                  ),
                  decoration: BoxDecoration(
                    color: t.bgSunken,
                    borderRadius: Radii.pill,
                  ),
                  child: Text(
                    '${opportunities.length}',
                    style: TextStyle(
                      fontSize: TypeScale.xs,
                      color: t.textSecondary,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: Spacing.x2),
          Expanded(
            child: opportunities.isEmpty
                ? Center(
                    child: Text(
                      'No deals',
                      style: TextStyle(color: t.textTertiary),
                    ),
                  )
                : ListView.builder(
                    itemCount: opportunities.length,
                    itemBuilder: (BuildContext context, int index) {
                      final Opportunity opp = opportunities[index];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: Spacing.x2),
                        child: UiCard(
                          padding: const EdgeInsets.all(Spacing.x3),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: <Widget>[
                              Text(
                                opp.title,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: Theme.of(context).textTheme.labelLarge,
                              ),
                              const SizedBox(height: Spacing.x0_5),
                              Text(
                                opp.company ?? opp.customerName,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  fontSize: TypeScale.xs,
                                  color: t.textTertiary,
                                ),
                              ),
                              if (opp.expectedRevenue != null) ...[
                                const SizedBox(height: Spacing.x1),
                                Text(
                                  Formatters.currency(opp.expectedRevenue!),
                                  style: const TextStyle(
                                    fontWeight: TypeScale.semibold,
                                    fontSize: TypeScale.sm,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
