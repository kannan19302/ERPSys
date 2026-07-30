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

class TicketDetailPage extends ConsumerWidget {
  const TicketDetailPage({super.key, required this.id});

  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = ref.watch(serviceTicketDetailProvider(id));
    return Scaffold(
      appBar: AppBar(title: const Text('Service Ticket')),
      body: detail.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => FailureView(
          failure: ServerFailure(e.toString()),
          onRetry: () => ref.invalidate(serviceTicketDetailProvider(id)),
        ),
        data: (ticket) => PermissionGate(
          permission: 'field_service.service_ticket.read',
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _StatusBadge(status: ticket.status),
                const SizedBox(height: 16),
                UiCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _DetailRow(label: 'Ticket #', value: ticket.ticketNumber),
                      _DetailRow(label: 'Title', value: ticket.title),
                      _DetailRow(label: 'Customer', value: ticket.customerName ?? '-'),
                      _DetailRow(label: 'Priority', value: ticket.priority),
                      _DetailRow(label: 'Technician', value: ticket.technicianName ?? '-'),
                      _DetailRow(label: 'Scheduled', value: ticket.scheduledDate != null
                          ? Formatters.dateTime(ticket.scheduledDate!)
                          : '-'),
                      if (ticket.completedAt != null)
                        _DetailRow(label: 'Completed', value: Formatters.dateTime(ticket.completedAt!)),
                      if (ticket.description != null && ticket.description!.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        const Text('Description', style: TextStyle(fontWeight: FontWeight.w600)),
                        const SizedBox(height: 4),
                        Text(ticket.description!),
                      ],
                      if (ticket.resolution != null && ticket.resolution!.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        const Text('Resolution', style: TextStyle(fontWeight: FontWeight.w600)),
                        const SizedBox(height: 4),
                        Text(ticket.resolution!),
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
      'OPEN' => Colors.blue,
      'IN_PROGRESS' => Colors.orange,
      'RESOLVED' => Colors.green,
      'CLOSED' => Colors.grey,
      _ => Colors.grey,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
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