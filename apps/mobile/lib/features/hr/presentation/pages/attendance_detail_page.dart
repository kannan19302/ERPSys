import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/hr.dart';
import '../providers/hr_providers.dart';

class AttendanceDetailPage extends ConsumerWidget {
  const AttendanceDetailPage({required this.attendanceId, super.key});

  static const String routeName = 'attendance-detail';
  static const String routePath = '/hr/attendance/:id';

  final String attendanceId;

  Attendance? _findAttendance(WidgetRef ref) {
    final AttendanceListState state = ref.watch(attendanceListControllerProvider);
    return state.items.where((Attendance a) => a.id == attendanceId).firstOrNull;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final Attendance? a = _findAttendance(ref);
    final Palette t = context.tokens;

    if (a == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Attendance')),
        body: const Center(child: Text('Record not found')),
      );
    }

    final (String statusLabel, Color statusColor, Color statusBg) = switch (a.status) {
      AttendanceStatus.present => ('Present', t.success, t.successLight),
      AttendanceStatus.absent => ('Absent', t.danger, t.dangerLight),
      AttendanceStatus.late => ('Late', t.warning, t.warningLight),
      AttendanceStatus.halfDay => ('Half Day', t.info, t.infoLight),
      _ => (a.status, t.textSecondary, t.bgSunken),
    };

    return Scaffold(
      appBar: AppBar(
        title: const Text('Attendance'),
        actions: <Widget>[
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            tooltip: 'Edit',
            onPressed: () => context.pushNamed(
              'attendance-edit',
              pathParameters: <String, String>{'id': a.id},
            ),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(Spacing.x4),
        children: <Widget>[
          UiCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Row(
                  children: <Widget>[
                    Expanded(
                      child: Text(
                        a.employeeName,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: Spacing.x2_5, vertical: Spacing.x1,
                      ),
                      decoration: BoxDecoration(color: statusBg, borderRadius: Radii.pill),
                      child: Text(
                        statusLabel,
                        style: TextStyle(
                          color: statusColor, fontSize: TypeScale.xs,
                          fontWeight: TypeScale.medium,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: Spacing.x3),
                _Row('Date', Formatters.date(a.date)),
                _Row('Clock In', a.clockIn != null ? Formatters.dateTime(a.clockIn!) : '—'),
                _Row('Clock Out', a.clockOut != null ? Formatters.dateTime(a.clockOut!) : '—'),
                _Row(
                  'Hours Worked',
                  a.hoursWorked != null ? '${a.hoursWorked!.toStringAsFixed(1)} h' : '—',
                ),
                if (a.notes != null && a.notes!.isNotEmpty) ...<Widget>[
                  const SizedBox(height: Spacing.x2),
                  Text(
                    a.notes!,
                    style: TextStyle(color: t.textSecondary, fontSize: TypeScale.sm),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row(this.label, this.value);

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: Spacing.x1_5),
      child: Row(
        children: <Widget>[
          Expanded(
            child: Text(label, style: TextStyle(color: t.textSecondary)),
          ),
          Text(value, style: Theme.of(context).textTheme.labelLarge),
        ],
      ),
    );
  }
}