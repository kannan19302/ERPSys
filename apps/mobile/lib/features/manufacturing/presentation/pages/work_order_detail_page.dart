import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/manufacturing.dart';
import '../providers/manufacturing_providers.dart';

class WorkOrderDetailPage extends ConsumerWidget {
  const WorkOrderDetailPage({required this.workOrderId, super.key});
  static const String routeName = 'work-order-detail';
  static const String routePath = '/manufacturing/work-orders/:id';
  final String workOrderId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final woAsync = ref.watch(workOrderDetailProvider(workOrderId));

    return Scaffold(
      appBar: AppBar(title: const Text('Work Order')),
      body: woAsync.when(
        loading: () => const LoadingView(),
        error: (error, _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load work order.'),
          onRetry: () => ref.invalidate(workOrderDetailProvider(workOrderId)),
        ),
        data: (wo) => _WorkOrderDetail(wo: wo),
      ),
    );
  }
}

class _WorkOrderDetail extends StatelessWidget {
  const _WorkOrderDetail({required this.wo});
  final WorkOrder wo;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: [
        UiCard(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Expanded(child: Text(wo.workOrderNumber,
                  style: Theme.of(context).textTheme.titleLarge)),
              UiStatusBadge(label: wo.status, tone: _statusTone(wo.status)),
            ]),
            const SizedBox(height: Spacing.x1),
            Text(wo.productName, style: TextStyle(color: t.textSecondary)),
          ],
        )),
        const SizedBox(height: Spacing.x4),
        UiCard(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const UiSectionHeader(title: 'Production'),
            _Row('Planned Qty', wo.quantity.toStringAsFixed(0)),
            if (wo.producedQuantity > 0)
              _Row('Produced', wo.producedQuantity.toStringAsFixed(0)),
            if (wo.bomId != null) _Row('BOM', wo.bomId!),
            if (wo.workstationId != null) _Row('Workstation', wo.workstationId!),
            if (wo.routingId != null) _Row('Routing', wo.routingId!),
          ],
        )),
        const SizedBox(height: Spacing.x4),
        UiCard(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const UiSectionHeader(title: 'Schedule'),
            if (wo.scheduledStart != null)
              _Row('Scheduled start', Formatters.dateTime(wo.scheduledStart!)),
            if (wo.scheduledEnd != null)
              _Row('Scheduled end', Formatters.dateTime(wo.scheduledEnd!)),
            if (wo.actualStart != null)
              _Row('Actual start', Formatters.dateTime(wo.actualStart!)),
            if (wo.actualEnd != null)
              _Row('Actual end', Formatters.dateTime(wo.actualEnd!)),
            if (wo.createdAt != null)
              _Row('Created', Formatters.dateTime(wo.createdAt!)),
          ],
        )),
      ],
    );
  }

  UiTone _statusTone(String status) => switch (status) {
        'DRAFT' => UiTone.neutral,
        'PLANNED' => UiTone.info,
        'IN_PROGRESS' || 'IN_PROCESS' => UiTone.warning,
        'COMPLETED' => UiTone.success,
        'CANCELLED' => UiTone.danger,
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
