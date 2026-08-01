import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/procurement.dart';
import '../providers/procurement_providers.dart';

class SupplierContractDetailPage extends ConsumerWidget {
  const SupplierContractDetailPage({required this.contractId, super.key});
  static const String routeName = 'supplier-contract-detail';
  static const String routePath = '/procurement/contracts/:id';
  final String contractId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(supplierContractDetailProvider(contractId));

    return Scaffold(
      appBar: AppBar(title: const Text('Supplier Contract')),
      body: async.when(
        loading: () => const LoadingView(),
        error: (error, _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load contract.'),
          onRetry: () => ref.invalidate(supplierContractDetailProvider(contractId)),
        ),
        data: (c) => _SupplierContractDetail(contract: c),
      ),
    );
  }
}

class _SupplierContractDetail extends StatelessWidget {
  const _SupplierContractDetail({required this.contract});
  final SupplierContract contract;

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
              Expanded(child: Text(contract.supplierName, style: Theme.of(context).textTheme.titleLarge)),
              UiStatusBadge(label: contract.status, tone: _statusTone(contract.status)),
            ],),
            const SizedBox(height: Spacing.x1),
            Text(contract.contractNumber, style: TextStyle(color: t.textSecondary)),
          ],
        ),),
        const SizedBox(height: Spacing.x4),
        UiCard(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const UiSectionHeader(title: 'Details'),
            _Row('Type', contract.type),
            _Row('Value', Formatters.currency(contract.value)),
            _Row('Currency', contract.currency),
            if (contract.startDate != null) _Row('Start Date', Formatters.date(contract.startDate!)),
            if (contract.endDate != null) _Row('End Date', Formatters.date(contract.endDate!)),
          ],
        ),),
        if (contract.terms != null && contract.terms!.isNotEmpty) ...[
          const SizedBox(height: Spacing.x4),
          UiCard(child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const UiSectionHeader(title: 'Terms'),
              Text(contract.terms!, style: TextStyle(color: t.textSecondary)),
            ],
          ),),
        ],
        if (contract.notes != null && contract.notes!.isNotEmpty) ...[
          const SizedBox(height: Spacing.x4),
          UiCard(child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const UiSectionHeader(title: 'Notes'),
              Text(contract.notes!, style: TextStyle(color: t.textSecondary)),
            ],
          ),),
        ],
        if (contract.createdAt != null) ...[
          const SizedBox(height: Spacing.x4),
          UiCard(child: _Row('Created', Formatters.dateTime(contract.createdAt!))),
        ],
      ],
    );
  }

  UiTone _statusTone(String s) => switch (s) {
        'DRAFT' => UiTone.neutral, 'ACTIVE' => UiTone.success,
        'EXPIRED' => UiTone.warning, 'TERMINATED' => UiTone.danger, _ => UiTone.neutral,
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