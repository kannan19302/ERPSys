import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/manufacturing.dart';
import '../providers/manufacturing_providers.dart';

class MrpRunDetailPage extends ConsumerWidget {
  const MrpRunDetailPage({required this.mrpRunId, super.key});
  static const String routeName = 'mrp-run-detail';
  static const String routePath = '/manufacturing/mrp/:id';
  final String mrpRunId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final runAsync = ref.watch(mrpRunDetailProvider(mrpRunId));

    return Scaffold(
      appBar: AppBar(title: const Text('MRP Run')),
      body: runAsync.when(
        loading: () => const LoadingView(),
        error: (error, _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load MRP run.'),
          onRetry: () => ref.invalidate(mrpRunDetailProvider(mrpRunId)),
        ),
        data: (run) => _MrpRunDetail(run: run),
      ),
    );
  }
}

class _MrpRunDetail extends StatelessWidget {
  const _MrpRunDetail({required this.run});
  final MrpRun run;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: [
        UiCard(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Expanded(child: Text(run.productName,
                  style: Theme.of(context).textTheme.titleLarge)),
              UiStatusBadge(label: run.status, tone: _statusTone(run.status)),
            ]),
          ],
        )),
        const SizedBox(height: Spacing.x4),
        UiCard(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const UiSectionHeader(title: 'Requirements'),
            _Row('Product', run.productName),
            _Row('Demand quantity', Formatters.number(run.demandQuantity)),
            _Row('Supply quantity', Formatters.number(run.supplyQuantity)),
            const Divider(height: Spacing.x4),
            _Row('Net requirement', Formatters.number(run.netRequirement)),
            if (run.createdAt != null)
              _Row('Created', Formatters.dateTime(run.createdAt!)),
          ],
        )),
      ],
    );
  }

  UiTone _statusTone(String status) => switch (status) {
        'DRAFT' => UiTone.neutral,
        'RUNNING' => UiTone.warning,
        'COMPLETED' => UiTone.success,
        'FAILED' => UiTone.danger,
        _ => UiTone.neutral,
      };
}

class _Row extends StatelessWidget {
  const _Row(this.label, this.value);
  final String label;
  final String value;
  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: Spacing.x1_5),
      child: Row(children: [
        Expanded(child: Text(label, style: TextStyle(color: t.textSecondary))),
        Text(value, style: Theme.of(context).textTheme.labelLarge),
      ]),
    );
  }
}
