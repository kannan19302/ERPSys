import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/widgets/form_fields.dart';
import '../../domain/entities/hr.dart';
import '../providers/hr_providers.dart';

class AttendanceFormPage extends ConsumerStatefulWidget {
  const AttendanceFormPage({this.attendanceId, super.key});

  static const String routeName = 'attendance-new';
  static const String routeEditName = 'attendance-edit';
  static const String routePath = '/hr/attendance/new';
  static const String routeEditPath = '/hr/attendance/:id/edit';

  final String? attendanceId;

  @override
  ConsumerState<AttendanceFormPage> createState() => _AttendanceFormPageState();
}

class _AttendanceFormPageState extends ConsumerState<AttendanceFormPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _notesCtrl = TextEditingController();
  final TextEditingController _employeeCtrl = TextEditingController();

  DateTime _selectedDate = DateTime.now();
  TimeOfDay? _clockIn;
  TimeOfDay? _clockOut;
  String _status = AttendanceStatus.present;
  bool _saving = false;

  bool get _isEditing => widget.attendanceId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) _load();
  }

  void _load() {
    final AttendanceListState state =
        ref.read(attendanceListControllerProvider);
    final Attendance? a = state.items.where(
      (Attendance at) => at.id == widget.attendanceId,
    ).firstOrNull;
    if (a != null) {
      _employeeCtrl.text = a.employeeName;
      _selectedDate = a.date;
      _clockIn = a.clockIn != null
          ? TimeOfDay.fromDateTime(a.clockIn!)
          : null;
      _clockOut = a.clockOut != null
          ? TimeOfDay.fromDateTime(a.clockOut!)
          : null;
      _status = a.status;
      _notesCtrl.text = a.notes ?? '';
    }
  }

  @override
  void dispose() {
    _notesCtrl.dispose();
    _employeeCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final DateTime? clockInDt = _clockIn != null
        ? DateTime(
            _selectedDate.year, _selectedDate.month, _selectedDate.day,
            _clockIn!.hour, _clockIn!.minute,
          )
        : null;
    final DateTime? clockOutDt = _clockOut != null
        ? DateTime(
            _selectedDate.year, _selectedDate.month, _selectedDate.day,
            _clockOut!.hour, _clockOut!.minute,
          )
        : null;
    final double? hours = clockInDt != null && clockOutDt != null
        ? (clockOutDt.difference(clockInDt).inMinutes / 60).round().toDouble()
        : null;

    final Map<String, dynamic> payload = <String, dynamic>{
      'employeeId': _employeeCtrl.text.trim(),
      'employeeName': _employeeCtrl.text.trim(),
      'date': _selectedDate.toIso8601String(),
      'clockIn': clockInDt?.toIso8601String(),
      'clockOut': clockOutDt?.toIso8601String(),
      'status': _status,
      'hoursWorked': hours,
      'notes': _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
    };

    final Result<Attendance> result = await ref
        .read(attendanceListControllerProvider.notifier)
        .save(payload, id: widget.attendanceId);

    if (!context.mounted) return;
    setState(() => _saving = false);

    result.fold(
      (Failure failure) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(failure.message)));
      },
      (_) => Navigator.of(context).pop(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditing ? 'Edit Attendance' : 'Mark Attendance'),
        actions: <Widget>[
          TextButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const SizedBox(
                    height: Spacing.x5,
                    width: Spacing.x5,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Save'),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(Spacing.x4),
          children: <Widget>[
            TextFormField(
              controller: _employeeCtrl,
              decoration: const InputDecoration(labelText: 'Employee *'),
              validator: (String? v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            UiDatePickerField(
              label: 'Date',
              selectedDate: _selectedDate,
              onChanged: (DateTime? d) {
                if (d != null) setState(() => _selectedDate = d);
              },
            ),
            const SizedBox(height: Spacing.x4),
            InkWell(
              onTap: () => _pickTime(context, true),
              child: InputDecorator(
                decoration: const InputDecoration(labelText: 'Clock In'),
                child: Text(
                  _clockIn != null ? _clockIn!.format(context) : 'Tap to set',
                ),
              ),
            ),
            const SizedBox(height: Spacing.x4),
            InkWell(
              onTap: () => _pickTime(context, false),
              child: InputDecorator(
                decoration: const InputDecoration(labelText: 'Clock Out'),
                child: Text(
                  _clockOut != null ? _clockOut!.format(context) : 'Tap to set',
                ),
              ),
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
//               selectedDate: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: <String>[
                AttendanceStatus.present,
                AttendanceStatus.absent,
                AttendanceStatus.late,
                AttendanceStatus.halfDay,
              ].map(
                (String v) => DropdownMenuItem<String>(
//                   selectedDate: v,
                  child: Text(_statusLabel(v)),
                ),
              ).toList(),
              onChanged: (String? v) {
                if (v != null) setState(() => _status = v);
              },
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _notesCtrl,
              maxLines: 3,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(
                labelText: 'Notes',
                alignLabelWithHint: true,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _pickTime(BuildContext context, bool isClockIn) async {
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
    );
    if (picked != null && context.mounted) {
      setState(() {
        if (isClockIn) {
          _clockIn = picked;
        } else {
          _clockOut = picked;
        }
      });
    }
  }

  static String _statusLabel(String status) => switch (status) {
        AttendanceStatus.present => 'Present',
        AttendanceStatus.absent => 'Absent',
        AttendanceStatus.late => 'Late',
        AttendanceStatus.halfDay => 'Half Day',
        _ => status,
      };
}