import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/widgets/form_fields.dart';
import '../../domain/entities/hr.dart';
import '../../domain/repositories/hr_repository.dart';
import '../../domain/usecases/hr_usecases.dart';
import '../providers/hr_providers.dart';

class LeaveRequestFormPage extends ConsumerStatefulWidget {
  const LeaveRequestFormPage({super.key});

  static const String routeName = 'leave-request-new';
  static const String routePath = '/hr/leave-requests/new';

  @override
  ConsumerState<LeaveRequestFormPage> createState() =>
      _LeaveRequestFormPageState();
}

class _LeaveRequestFormPageState extends ConsumerState<LeaveRequestFormPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _reasonCtrl = TextEditingController();
  final TextEditingController _emergencyCtrl = TextEditingController();
  final TextEditingController _employeeCtrl = TextEditingController();

  String? _leaveTypeId;
  DateTime _fromDate = DateTime.now();
  DateTime _toDate = DateTime.now().add(const Duration(days: 1));
  bool _saving = false;

  @override
  void dispose() {
    _reasonCtrl.dispose();
    _emergencyCtrl.dispose();
    _employeeCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final double days = _toDate.difference(_fromDate).inDays + 1;

    final AsyncValue<List<LeaveType>> typesAsync =
        ref.watch(leaveTypesProvider);
    final String leaveTypeName = _leaveTypeId != null
        ? typesAsync.valueOrNull
                ?.where((LeaveType t) => t.id == _leaveTypeId)
                .firstOrNull
                ?.name ??
            ''
        : '';

    final Map<String, dynamic> payload = <String, dynamic>{
      'employeeId': _employeeCtrl.text.trim(),
      'employeeName': _employeeCtrl.text.trim(),
      'leaveTypeId': _leaveTypeId,
      'leaveTypeName': leaveTypeName,
      'fromDate': _fromDate.toIso8601String(),
      'toDate': _toDate.toIso8601String(),
      'days': days,
      'reason': _reasonCtrl.text.trim().isEmpty ? null : _reasonCtrl.text.trim(),
      'emergencyContact': _emergencyCtrl.text.trim().isEmpty
          ? null
          : _emergencyCtrl.text.trim(),
      'status': LeaveRequestStatus.pending,
    };

    final Result<LeaveRequest> result = await _saveLeaveRequest(payload);

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
    final AsyncValue<List<LeaveType>> typesAsync = ref.watch(leaveTypesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('New Leave Request'),
        actions: <Widget>[
          TextButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const SizedBox(
                    height: Spacing.x5,
                    width: Spacing.x5,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Submit'),
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
            typesAsync.when(
              loading: () => const LinearProgressIndicator(),
              error: (Object e, _) => Text('$e'),
              data: (List<LeaveType> types) {
                return DropdownButtonFormField<String>(
                  initialValue: _leaveTypeId,
                  decoration: const InputDecoration(labelText: 'Leave Type *'),
                  isExpanded: true,
                  items: types
                      .map(
                        (LeaveType t) => DropdownMenuItem<String>(
                          value: t.id,
                          child: Text(t.name),
                        ),
                      )
                      .toList(),
                  onChanged: (String? v) =>
                      setState(() => _leaveTypeId = v),
                  validator: (String? v) =>
                      v == null ? 'Select a leave type' : null,
                );
              },
            ),
            const SizedBox(height: Spacing.x4),
            UiDatePickerField(
              label: 'From Date',
              selectedDate: _fromDate,
              onChanged: (DateTime? d) {
                if (d != null) setState(() => _fromDate = d);
              },
            ),
            const SizedBox(height: Spacing.x4),
            UiDatePickerField(
              label: 'To Date',
              selectedDate: _toDate,
              firstDate: _fromDate,
              onChanged: (DateTime? d) {
                if (d != null) setState(() => _toDate = d);
              },
            ),
            const SizedBox(height: Spacing.x2),
            Text(
              '${_toDate.difference(_fromDate).inDays + 1} day(s)',
              style: TextStyle(
                color: context.tokens.textSecondary,
                fontSize: TypeScale.sm,
              ),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _reasonCtrl,
              maxLines: 3,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(
                labelText: 'Reason',
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _emergencyCtrl,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(
                labelText: 'Emergency Contact',
                helperText: 'Optional phone number',
              ),
            ),
          ],
        ),
      ),
    );
  }
Future<Result<LeaveRequest>> _saveLeaveRequest(
      Map<String, dynamic> payload,) async {
    final HrRepository repo = ref.read(hrRepositoryProvider);
    final Result<LeaveRequest> result =
        await SaveLeaveRequestUseCase(repo)(
      SaveLeaveRequestParams(payload: payload),
    );
    if (result.isOk) {
      unawaited(ref.read(leaveRequestListControllerProvider.notifier).refresh());
    }
    return result;
  }
}