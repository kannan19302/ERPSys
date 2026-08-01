
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
  const WorkOrderDetailPage({super.key, this.id});
  final String? id;

  static const String routeName = 'work-order-detail';
  static const String routePath = '/manufacturing/work-orders/:id';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final String? workOrderId = id;
    if (workOrderId == null) {
      return const Scaffold(
        body: FailureView(failure: ServerFailure('Missing work order id')),
      );
    }
    final AsyncValue<WorkOrder> woAsync = ref.watch(
      workOrderDetailProvider(workOrderId),
    );

    return Scaffold(
      appBar: AppBar(title: const Text('Work Order')),
      body: woAsync.when(
        loading: () => const LoadingView(),
        error: (error, _) => FailureView(
          failure: error is Failure
              ? error
              : const ServerFailure('Could not load work order.'),
          onRetry: () => ref.invalidate(workOrderDetailProvider(workOrderId)),
        ),
        data: (workOrder) => _WorkOrderDetail(workOrder: workOrder),
      ),
    );
  }
}

class _WorkOrderDetail extends StatelessWidget {
  const _WorkOrderDetail({required this.workOrder});
  final WorkOrder workOrder;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    final bool hasReferences = workOrder.bomId != null ||
        workOrder.workstationId != null ||
        workOrder.routingId != null;
    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: [
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      workOrder.workOrderNumber,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  UiStatusBadge(
                    label: workOrder.status,
                    tone: _statusTone(workOrder.status),
                  ),
                ],
              ),
              const SizedBox(height: Spacing.x1),
              Text(workOrder.productName, style: TextStyle(color: t.textSecondary)),
              if (hasReferences) ...<Widget>[
                const SizedBox(height: Spacing.x4),
                const Divider(),
                if (workOrder.bomId != null)
                  _Row('BOM', workOrder.bomId!),
                if (workOrder.workstationId != null)
                  _Row('Workstation', workOrder.workstationId!),
                if (workOrder.routingId != null)
                  _Row('Routing', workOrder.routingId!),
              ],
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        const UiSectionHeader(title: 'Production'),
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _Row('Planned Qty', Formatters.number(workOrder.quantity)),
              if (workOrder.producedQuantity > 0)
                _Row('Produced', Formatters.number(workOrder.producedQuantity)),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        const UiSectionHeader(title: 'Schedule'),
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _Row(
                'Start',
                workOrder.scheduledStart != null
                    ? Formatters.dateTime(workOrder.scheduledStart!)
                    : '—',
              ),
              _Row(
                'End',
                workOrder.scheduledEnd != null
                    ? Formatters.dateTime(workOrder.scheduledEnd!)
                    : '—',
              ),
            ],
          ),
        ),
      ],
    );
  }

  UiTone _statusTone(String status) => switch (status) {
        'DRAFT' => UiTone.neutral,
        'PLANNED' => UiTone.info,
        'IN_PROGRESS' => UiTone.info,
        'COMPLETED' => UiTone.success,
        'CANCELLED' => UiTone.danger,
        'ON_HOLD' => UiTone.warning,
        _ => UiTone.neutral,
      };
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
        children: [
          Expanded(
            child: Text(label, style: TextStyle(color: t.textSecondary)),
          ),
          Text(value, style: Theme.of(context).textTheme.labelLarge),
        ],
      ),
    );
  }
}
