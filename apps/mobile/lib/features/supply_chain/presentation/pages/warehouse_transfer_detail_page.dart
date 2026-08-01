import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/supply_chain.dart';
import '../providers/supply_chain_providers.dart';

class WarehouseTransferDetailPage extends ConsumerWidget {
  const WarehouseTransferDetailPage({required this.transferId, super.key});
  static const String routeName = 'warehouse-transfer-detail';
  final String transferId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(warehouseTransferDetailProvider(transferId));
    return Scaffold(
      appBar: AppBar(title: const Text('Warehouse Transfer')),
      body: async.when(
        loading: () => const LoadingView(),
        error: (Object error, _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load transfer.'),
          onRetry: () => ref.invalidate(warehouseTransferDetailProvider(transferId)),
        ),
        data: (WarehouseTransfer t) => _WarehouseTransferDetail(transfer: t),
      ),
    );
  }
}

class _WarehouseTransferDetail extends StatelessWidget {
  const _WarehouseTransferDetail({required this.transfer});
  final WarehouseTransfer transfer;

  UiTone _statusTone(String status) => switch (status) {
    'PENDING' => UiTone.warning,
    'APPROVED' => UiTone.info,
    'IN_TRANSIT' => UiTone.info,
    'COMPLETED' => UiTone.success,
    'CANCELLED' => UiTone.danger,
    _ => UiTone.neutral,
  };

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: [
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Expanded(child: Text(transfer.reference ?? 'Warehouse Transfer',
                    style: Theme.of(context).textTheme.titleLarge,),),
                UiStatusBadge(label: transfer.status, tone: _statusTone(transfer.status)),
              ],),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const UiSectionHeader(title: 'Transfer Details'),
              _Row('From', transfer.fromWarehouseName ?? transfer.fromWarehouseId ?? '—'),
              _Row('To', transfer.toWarehouseName ?? transfer.toWarehouseId ?? '—'),
              _Row('Product', transfer.productName ?? transfer.productId ?? '—'),
              _Row('Quantity', transfer.quantity.toString()),
              _Row('Reference', transfer.reference ?? '—'),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const UiSectionHeader(title: 'Timeline'),
              _Row('Created', transfer.createdAt != null ? Formatters.date(transfer.createdAt!) : '—'),
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
    final t = context.tokens;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: Spacing.x1_5),
      child: Row(children: [
        Expanded(child: Text(label, style: TextStyle(color: t.textSecondary))),
        Text(value, style: Theme.of(context).textTheme.labelLarge),
      ],),
    );
  }
}