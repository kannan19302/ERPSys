import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/widgets/state_views.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/utils/formatters.dart';
import '../providers/healthcare_providers.dart';
import '../../../../core/widgets/permission_gate.dart';

class PatientDetailPage extends ConsumerWidget {
  const PatientDetailPage({super.key, required this.id});

  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = ref.watch(patientDetailProvider(id));
    return Scaffold(
      appBar: AppBar(title: const Text('Patient')),
      body: detail.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => FailureView(
          failure: ServerFailure(e.toString()),
          onRetry: () => ref.invalidate(patientDetailProvider(id)),
        ),
        data: (patient) => PermissionGate(
          permission: 'healthcare.patient.read',
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _StatusBadge(status: patient.status),
                const SizedBox(height: 16),
                UiCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _DetailRow(label: 'Name', value: patient.name),
                      _DetailRow(label: 'Date of Birth', value: patient.dateOfBirth != null
                          ? Formatters.date(patient.dateOfBirth!)
                          : '-'),
                      _DetailRow(label: 'Gender', value: patient.gender ?? '-'),
                      _DetailRow(label: 'Phone', value: patient.phone ?? '-'),
                      _DetailRow(label: 'Email', value: patient.email ?? '-'),
                      _DetailRow(label: 'Address', value: patient.address ?? '-'),
                      _DetailRow(label: 'Blood Group', value: patient.bloodGroup ?? '-'),
                      _DetailRow(label: 'Allergies', value: patient.allergies ?? '-'),
                      if (patient.emergencyContactName != null || patient.emergencyContactPhone != null) ...[
                        const SizedBox(height: 12),
                        const Text('Emergency Contact', style: TextStyle(fontWeight: FontWeight.w600)),
                        const SizedBox(height: 4),
                        if (patient.emergencyContactName != null)
                          _DetailRow(label: 'Name', value: patient.emergencyContactName!),
                        if (patient.emergencyContactPhone != null)
                          _DetailRow(label: 'Phone', value: patient.emergencyContactPhone!),
                      ],
                      if (patient.medicalHistory != null && patient.medicalHistory!.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        const Text('Medical History', style: TextStyle(fontWeight: FontWeight.w600)),
                        const SizedBox(height: 4),
                        Text(patient.medicalHistory!),
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
      'INACTIVE' => Colors.grey,
      'DISCHARGED' => Colors.blue,
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
          width: 140,
          child: Text(label, style: const TextStyle(color: Colors.grey, fontWeight: FontWeight.w500)),
        ),
        Expanded(child: Text(value)),
      ],
    ),
  );
}