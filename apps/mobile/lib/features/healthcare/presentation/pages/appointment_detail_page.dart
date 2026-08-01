import 'package:flutter/material.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/widgets/state_views.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/healthcare_providers.dart';

class AppointmentDetailPage extends ConsumerWidget {
  const AppointmentDetailPage({super.key, required this.id});

  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = ref.watch(appointmentDetailProvider(id));
    return Scaffold(
      appBar: AppBar(title: const Text('Appointment')),
      body: detail.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => FailureView(
          failure: ServerFailure(e.toString()),
          onRetry: () => ref.invalidate(appointmentDetailProvider(id)),
        ),
        data: (apt) => PermissionGate(
          permission: 'healthcare.appointment.read',
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _StatusBadge(status: apt.status),
                const SizedBox(height: 16),
                UiCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _DetailRow(label: 'Patient', value: apt.patientName),
                      _DetailRow(label: 'Date', value: Formatters.dateTime(apt.appointmentDate)),
                      _DetailRow(label: 'Doctor', value: apt.doctorName ?? '-'),
                      _DetailRow(label: 'Specialty', value: apt.specialty ?? '-'),
                      _DetailRow(label: 'Reason', value: apt.reason ?? '-'),
                      if (apt.notes != null && apt.notes!.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        const Text('Notes', style: TextStyle(fontWeight: FontWeight.w600)),
                        const SizedBox(height: 4),
                        Text(apt.notes!),
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
      'SCHEDULED' => Colors.blue,
      'CHECKED_IN' => Colors.orange,
      'IN_PROGRESS' => Colors.amber,
      'COMPLETED' => Colors.green,
      'CANCELLED' => Colors.red,
      'NO_SHOW' => Colors.grey,
      _ => Colors.grey,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        status.replaceAll('_', ' '),
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
          width: 100,
          child: Text(label, style: const TextStyle(color: Colors.grey, fontWeight: FontWeight.w500)),
        ),
        Expanded(child: Text(value)),
      ],
    ),
  );
}