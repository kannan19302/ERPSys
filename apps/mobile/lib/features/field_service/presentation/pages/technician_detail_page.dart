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
import '../providers/field_service_providers.dart';
import '../../../../core/widgets/permission_gate.dart';

class TechnicianDetailPage extends ConsumerWidget {
  const TechnicianDetailPage({super.key, required this.id});

  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = ref.watch(technicianDetailProvider(id));
    return Scaffold(
      appBar: AppBar(title: const Text('Technician')),
      body: detail.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => FailureView(
          failure: ServerFailure(e.toString()),
          onRetry: () => ref.invalidate(technicianDetailProvider(id)),
        ),
        data: (tech) => PermissionGate(
          permission: 'field_service.technician.read',
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _StatusBadge(status: tech.status),
                const SizedBox(height: 16),
                UiCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _DetailRow(label: 'Name', value: tech.name),
                      _DetailRow(label: 'Email', value: tech.email ?? '-'),
                      _DetailRow(label: 'Phone', value: tech.phone ?? '-'),
                      _DetailRow(label: 'Specialization', value: tech.specialization ?? '-'),
                      _DetailRow(label: 'Skill Level', value: tech.skillLevel ?? '-'),
                      _DetailRow(label: 'Service Area', value: tech.serviceArea ?? '-'),
                      _DetailRow(label: 'Vehicle', value: tech.vehicleInfo ?? '-'),
                      if (tech.rating != null)
                        _DetailRow(label: 'Rating', value: tech.rating!.toStringAsFixed(1)),
                      if (tech.createdAt != null)
                        _DetailRow(label: 'Created', value: Formatters.dateTime(tech.createdAt!)),
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
      'AVAILABLE' => Colors.green,
      'BUSY' => Colors.orange,
      'OFFLINE' => Colors.grey,
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
          width: 120,
          child: Text(label, style: const TextStyle(color: Colors.grey, fontWeight: FontWeight.w500)),
        ),
        Expanded(child: Text(value)),
      ],
    ),
  );
}