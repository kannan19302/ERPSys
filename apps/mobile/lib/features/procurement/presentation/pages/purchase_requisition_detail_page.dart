import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/procurement.dart';
import '../providers/procurement_providers.dart';

class PurchaseRequisitionDetailPage extends ConsumerWidget {
  const PurchaseRequisitionDetailPage({required this.requisitionId, super.key});
  static const String routeName = 'purchase-requisition-detail';
  static const String routePath = '/procurement/purchase-requisitions/:id';
  final String requisitionId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(purchaseRequisitionDetailProvider(requisitionId));

    return Scaffold(
      appBar: AppBar(title: const Text('Purchase Requisition')),
      body: async.when(
        loading: () => const LoadingView(),
        error: (error, _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load requisition.'),
          onRetry: () => ref.invalidate(purchaseRequisitionDetailProvider(requisitionId)),
        ),
        data: (r) => _PurchaseRequisitionDetail(requisition: r),
      ),
    );
  }
}

class _PurchaseRequisitionDetail extends StatelessWidget {
  const _PurchaseRequisitionDetail({required this.requisition});
  final PurchaseRequisition requisition;

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
              Expanded(child: Text(requisition.title, style: Theme.of(context).textTheme.titleLarge)),
              UiStatusBadge(label: requisition.status, tone: _statusTone(requisition.status)),
            ],),
            const SizedBox(height: Spacing.x1),
            Text('${requisition.department ?? 'No department'} \u00b7 ${requisition.requestedBy ?? 'Unknown'}',
                style: TextStyle(color: t.textSecondary),),
          ],
        ),),
        const SizedBox(height: Spacing.x4),
        UiCard(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const UiSectionHeader(title: 'Items'),
            ...requisition.items.map((item) => Padding(
              padding: const EdgeInsets.symmetric(vertical: Spacing.x1),
              child: Row(children: [
                Expanded(child: Text(item.productName ?? 'Item')),
                Text('${item.quantity.toStringAsFixed(0)} \u00d7 \$${item.estimatedRate.toStringAsFixed(2)}'),
              ],),
            ),),
            if (requisition.items.isEmpty) Text('No items', style: TextStyle(color: t.textTertiary)),
            const Divider(height: Spacing.x4),
            _Row('Total Estimated', Formatters.currency(requisition.totalEstimated)),
          ],
        ),),
        const SizedBox(height: Spacing.x4),
        UiCard(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const UiSectionHeader(title: 'Details'),
            _Row('Priority', requisition.priority),
            if (requisition.requisitionNumber != null) _Row('Number', requisition.requisitionNumber!),
            if (requisition.requiredDate != null) _Row('Required Date', Formatters.date(requisition.requiredDate!)),
            if (requisition.notes != null && requisition.notes!.isNotEmpty) _Row('Notes', requisition.notes!),
            if (requisition.createdAt != null) _Row('Created', Formatters.dateTime(requisition.createdAt!)),
          ],
        ),),
      ],
    );
  }

  UiTone _statusTone(String s) => switch (s) {
        'DRAFT' => UiTone.neutral, 'SUBMITTED' => UiTone.info,
        'APPROVED' => UiTone.success, 'REJECTED' => UiTone.danger, _ => UiTone.neutral,
      };
}

class _Row extends StatelessWidget {
  const _Row(this.label, this.value);
  final String label; final String value;
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: Spacing.x1_5),
      child: Row(children: [
        Expanded(child: Text(label, style: TextStyle(color: context.tokens.textSecondary))),
        Text(value, style: Theme.of(context).textTheme.labelLarge),
      ],),
    );
  }
}