import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/widgets/form_fields.dart';
import '../../data/repositories/hr_repository_impl.dart';
import '../../domain/entities/hr.dart';
import '../../domain/repositories/hr_repository.dart';
import '../../domain/usecases/hr_usecases.dart';
import '../providers/hr_providers.dart';

class TimesheetFormPage extends ConsumerStatefulWidget {
  const TimesheetFormPage({super.key});

  static const String routeName = 'hr-timesheet-new';
  static const String routePath = '/hr/timesheets/new';

  @override
  ConsumerState<TimesheetFormPage> createState() => _TimesheetFormPageState();
}

class _TimesheetFormPageState extends ConsumerState<TimesheetFormPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _employeeCtrl = TextEditingController();
  final TextEditingController _projectCtrl = TextEditingController();
  final TextEditingController _taskCtrl = TextEditingController();
  final TextEditingController _hoursCtrl = TextEditingController(text: '8');
  final TextEditingController _descCtrl = TextEditingController();

  DateTime _selectedDate = DateTime.now();
  bool _saving = false;

  @override
  void dispose() {
    _employeeCtrl.dispose();
    _projectCtrl.dispose();
    _taskCtrl.dispose();
    _hoursCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final Map<String, dynamic> payload = <String, dynamic>{
      'employeeId': _employeeCtrl.text.trim(),
      'employeeName': _employeeCtrl.text.trim(),
      'date': _selectedDate.toIso8601String(),
      'hours': double.tryParse(_hoursCtrl.text) ?? 0,
      'projectName': _projectCtrl.text.trim().isEmpty
          ? null
          : _projectCtrl.text.trim(),
      'taskName':
          _taskCtrl.text.trim().isEmpty ? null : _taskCtrl.text.trim(),
      'description': _descCtrl.text.trim().isEmpty
          ? null
          : _descCtrl.text.trim(),
      'status': TimesheetStatus.draft,
    };

    final Result<Timesheet> result = await _saveTimesheet(payload);

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
        title: const Text('New Timesheet Entry'),
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
            TextFormField(
              controller: _hoursCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Hours *',
                suffixText: 'h',
              ),
              validator: (String? v) {
                if (v == null || v.trim().isEmpty) return 'Required';
                if (double.tryParse(v) == null) return 'Enter a valid number';
                return null;
              },
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _projectCtrl,
              decoration: const InputDecoration(labelText: 'Project'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _taskCtrl,
              decoration: const InputDecoration(labelText: 'Task'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _descCtrl,
              maxLines: 3,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(
                labelText: 'Description',
                alignLabelWithHint: true,
              ),
            ),
          ],
        ),
      ),
    );
  }
Future<Result<Timesheet>> _saveTimesheet(
      Map<String, dynamic> payload) async {
    final HrRepository repo = ref.read(hrRepositoryProvider);
    final Result<Timesheet> result =
        await SaveTimesheetUseCase(repo)(
      SaveTimesheetParams(payload: payload),
    );
    if (result.isOk) {
      ref.read(timesheetListControllerProvider.notifier).refresh();
    }
    return result;
  }
}