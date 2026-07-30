import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/supply_chain.dart';
import '../providers/supply_chain_providers.dart';

class DockAppointmentDetailPage extends ConsumerWidget {
  const DockAppointmentDetailPage({required this.appointmentId, super.key});
  static const String routeName = 'dock-appointment-detail';
  final String appointmentId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(dockAppointmentDetailProvider(appointmentId));
    return Scaffold(
      appBar: AppBar(title: const Text('Dock Appointment')),
      body: async.when(
        loading: () => const LoadingView(),
        error: (Object error, _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load appointment.'),
          onRetry: () => ref.invalidate(dockAppointmentDetailProvider(appointmentId)),
        ),
        data: (DockAppointment appt) => _DockAppointmentDetail(appointment: appt),
      ),
    );
  }
}

class _DockAppointmentDetail extends StatelessWidget {
  const _DockAppointmentDetail({required this.appointment});
  final DockAppointment appointment;

  UiTone _statusTone(String status) => switch (status) {
    'SCHEDULED' => UiTone.info,
    'CHECKED_IN' => UiTone.warning,
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
                Expanded(child: Text(appointment.reference ?? 'Dock Appointment',
                    style: Theme.of(context).textTheme.titleLarge)),
                UiStatusBadge(label: appointment.status, tone: _statusTone(appointment.status)),
              ]),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const UiSectionHeader(title: 'Details'),
              _Row('Warehouse', appointment.warehouseName ?? appointment.warehouseId ?? '—'),
              _Row('Carrier', appointment.carrierName ?? appointment.carrierId ?? '—'),
              _Row('Reference', appointment.reference ?? '—'),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const UiSectionHeader(title: 'Timeline'),
              if (appointment.scheduledAt != null)
                _Row('Scheduled', Formatters.dateTime(appointment.scheduledAt!)),
              if (appointment.arrivedAt != null)
                _Row('Arrived', Formatters.dateTime(appointment.arrivedAt!)),
              if (appointment.departedAt != null)
                _Row('Departed', Formatters.dateTime(appointment.departedAt!)),
              _Row('Created', appointment.createdAt != null ? Formatters.date(appointment.createdAt!) : '—'),
            ],
          ),
        ),
        if (appointment.notes != null && appointment.notes!.isNotEmpty) ...[
          const SizedBox(height: Spacing.x4),
          UiCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const UiSectionHeader(title: 'Notes'),
                Text(appointment.notes!, style: Theme.of(context).textTheme.bodyMedium),
              ],
            ),
          ),
        ],
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
      ]),
    );
  }
}