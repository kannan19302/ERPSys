import '../../../../core/error/exceptions.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/widgets/ui_card.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/utils/formatters.dart';
import '../providers/healthcare_providers.dart';
import '../../../../core/widgets/permission_gate.dart';

class PrescriptionDetailPage extends ConsumerWidget {
  const PrescriptionDetailPage({super.key, required this.id});
  static const String routeName = 'prescription-detail';
  static const String routePath = '/prescription-detail/:id';

  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = ref.watch(prescriptionDetailProvider(id));
    return Scaffold(
      appBar: AppBar(title: const Text('Prescription')),
      body: detail.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => FailureView(
          failure: ServerFailure(e.toString()),
          onRetry: () => ref.invalidate(prescriptionDetailProvider(id)),
        ),
        data: (rx) => PermissionGate(
          permission: 'healthcare.prescription.read',
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _StatusBadge(status: rx.status),
                const SizedBox(height: 16),
                UiCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _DetailRow(label: 'Patient', value: rx.patientName),
                      _DetailRow(label: 'Date', value: Formatters.dateTime(rx.prescriptionDate)),
                      _DetailRow(label: 'Doctor', value: rx.doctorName ?? '-'),
                      _DetailRow(label: 'Refills', value: rx.refillCount.toString()),
                      if (rx.diagnosis != null && rx.diagnosis!.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        const Text('Diagnosis', style: TextStyle(fontWeight: FontWeight.w600)),
                        const SizedBox(height: 4),
                        Text(rx.diagnosis!),
                      ],
                      if (rx.medications != null && rx.medications!.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        const Text('Medications', style: TextStyle(fontWeight: FontWeight.w600)),
                        const SizedBox(height: 4),
                        Text(rx.medications!),
                      ],
                      if (rx.notes != null && rx.notes!.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        const Text('Notes', style: TextStyle(fontWeight: FontWeight.w600)),
                        const SizedBox(height: 4),
                        Text(rx.notes!),
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
  final String status;
  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    final color = switch (status.toUpperCase()) {
      'ACTIVE' => Colors.green,
      'DISCONTINUED' => Colors.red,
      'EXPIRED' => Colors.grey,
      _ => Colors.grey,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
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
  final String label;
  final String value;
  const _DetailRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 6),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 100,
          child: Text(label, style: const TextStyle(color: Colors.grey, fontWeight: FontWeight.w500)),
        ),
        Expanded(child: Text(value)),
      ],
    ),
  );
}