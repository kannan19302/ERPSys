import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../providers/projects_providers.dart';

class TimesheetFormPage extends ConsumerStatefulWidget {
  const TimesheetFormPage({this.timesheetId, super.key});
  static const String routeName = 'timesheet-new';
  static const String routeEditName = 'timesheet-edit';
  static const String routePath = '/projects/timesheets/new';
  static const String routeEditPath = '/projects/timesheets/:id/edit';

  final String? timesheetId;

  @override
  ConsumerState<TimesheetFormPage> createState() => _TimesheetFormPageState();
}

class _TimesheetFormPageState extends ConsumerState<TimesheetFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _projectIdCtrl = TextEditingController();
  final _employeeIdCtrl = TextEditingController();
  final _hoursCtrl = TextEditingController();
  final _descriptionCtrl = TextEditingController();
  DateTime? _date;
  bool _billable = false;
  bool _saving = false;

  bool get _isEditing => widget.timesheetId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) _loadTimesheet();
  }

  Future<void> _loadTimesheet() async {
    final ts = ref.read(timesheetDetailProvider(widget.timesheetId!)).valueOrNull;
    if (ts != null) {
      _projectIdCtrl.text = ts.projectId;
      _employeeIdCtrl.text = ts.employeeId;
      _hoursCtrl.text = ts.hours.toString();
      _descriptionCtrl.text = ts.description ?? '';
      _date = ts.date;
    }
  }

  @override
  void dispose() {
    _projectIdCtrl.dispose();
    _employeeIdCtrl.dispose();
    _hoursCtrl.dispose();
    _descriptionCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final payload = <String, dynamic>{
      'projectId': _projectIdCtrl.text.trim(),
      'employeeId': _employeeIdCtrl.text.trim(),
      'hours': double.tryParse(_hoursCtrl.text) ?? 0,
      'date': _date?.toIso8601String(),
      'description': _descriptionCtrl.text.trim().isEmpty ? null : _descriptionCtrl.text.trim(),
      'billable': _billable,
    };

    final result = await ref.read(timesheetListControllerProvider.notifier).save(
      payload, id: widget.timesheetId,);

    if (!context.mounted) return;
    setState(() => _saving = false);
    result.fold(
      (f) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(f.message))),
      (_) => Navigator.of(context).pop(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditing ? 'Edit Timesheet' : 'New Timesheet'),
        actions: [
          TextButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const SizedBox(height: Spacing.x5, width: Spacing.x5, child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('Save'),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(Spacing.x4),
          children: [
            TextFormField(
              controller: _projectIdCtrl,
              decoration: const InputDecoration(labelText: 'Project ID *'),
              validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _employeeIdCtrl,
              decoration: const InputDecoration(labelText: 'Employee ID *'),
              validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            InkWell(
              onTap: () async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate: _date ?? DateTime.now(),
                  firstDate: DateTime(2020),
                  lastDate: DateTime(2030),
                );
                if (picked != null) setState(() => _date = picked);
              },
              child: InputDecorator(
                decoration: const InputDecoration(labelText: 'Date *'),
                child: Text(_date != null ? '${_date!.toLocal()}'.split(' ')[0] : 'Tap to select'),
              ),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _hoursCtrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(labelText: 'Hours *'),
              validator: (v) {
                if (v == null || v.trim().isEmpty) return 'Required';
                if (double.tryParse(v) == null || double.parse(v) <= 0) return 'Enter a positive number';
                return null;
              },
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _descriptionCtrl,
              maxLines: 3,
              decoration: const InputDecoration(labelText: 'Description', alignLabelWithHint: true),
            ),
            const SizedBox(height: Spacing.x4),
            SwitchListTile(
              title: const Text('Billable'),
              value: _billable,
              onChanged: (v) => setState(() => _billable = v),
              contentPadding: EdgeInsets.zero,
            ),
          ],
        ),
      ),
    );
  }
}