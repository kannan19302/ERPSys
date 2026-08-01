import 'package:flutter/material.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/widgets/state_views.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/field_service_providers.dart';

class ContractDetailPage extends ConsumerWidget {
  const ContractDetailPage({super.key, required this.id});

  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = ref.watch(serviceContractDetailProvider(id));
    return Scaffold(
      appBar: AppBar(title: const Text('Service Contract')),
      body: detail.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => FailureView(
          failure: ServerFailure(e.toString()),
          onRetry: () => ref.invalidate(serviceContractDetailProvider(id)),
        ),
        data: (contract) => PermissionGate(
          permission: 'field_service.contract.read',
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _StatusBadge(status: contract.status),
                const SizedBox(height: 16),
                UiCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _DetailRow(label: 'Contract #', value: contract.contractNumber),
                      _DetailRow(label: 'Customer', value: contract.customerName),
                      _DetailRow(label: 'Service Type', value: contract.serviceType ?? '-'),
                      _DetailRow(label: 'Start Date', value: Formatters.date(contract.startDate)),
                      _DetailRow(label: 'End Date', value: Formatters.date(contract.endDate)),
                      _DetailRow(label: 'Contract Value', value: Formatters.currency(contract.contractValue)),
                      _DetailRow(label: 'Billing Cycle', value: contract.billingCycle ?? '-'),
                      if (contract.terms != null && contract.terms!.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        const Text('Terms', style: TextStyle(fontWeight: FontWeight.w600)),
                        const SizedBox(height: 4),
                        Text(contract.terms!),
                      ],
                      if (contract.notes != null && contract.notes!.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        const Text('Notes', style: TextStyle(fontWeight: FontWeight.w600)),
                        const SizedBox(height: 4),
                        Text(contract.notes!),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});
  final String status;

  @override
  Widget build(BuildContext context) {
    final color = switch (status.toUpperCase()) {
      'ACTIVE' => Colors.green,
      'EXPIRED' => Colors.red,
      'SUSPENDED' => Colors.orange,
      'DRAFT' => Colors.grey,
      _ => Colors.grey,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        status,
        style: TextStyle(color: color, fontWeight: FontWeight.w600, fontSize: 13),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 6),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 120,
          child: Text(label, style: const TextStyle(color: Colors.grey, fontWeight: FontWeight.w500)),
        ),
        Expanded(child: Text(value)),
      ],
    ),
  );
}