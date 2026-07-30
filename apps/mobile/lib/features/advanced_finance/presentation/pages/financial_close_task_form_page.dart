import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/advanced_finance.dart';
import '../providers/advanced_finance_providers.dart';

class FinancialCloseTaskFormPage extends ConsumerStatefulWidget {
  const FinancialCloseTaskFormPage({this.taskId, super.key});

  static const String routeName = 'financial-close-task-new';
  static const String routeEditName = 'financial-close-task-edit';
  static const String routePath = '/advanced-finance/close-tasks/new';
  static const String routeEditPath = '/advanced-finance/close-tasks/:id/edit';

  final String? taskId;

  @override
  ConsumerState<FinancialCloseTaskFormPage> createState() => _FinancialCloseTaskFormPageState();
}

class _FinancialCloseTaskFormPageState extends ConsumerState<FinancialCloseTaskFormPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _titleCtrl = TextEditingController();
  final TextEditingController _periodCtrl = TextEditingController();
  final TextEditingController _assignedToCtrl = TextEditingController();
  final TextEditingController _notesCtrl = TextEditingController();

  String _status = 'PENDING';
  String _priority = 'MEDIUM';
  bool _saving = false;

  bool get _isEditing => widget.taskId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) {
      _loadTask();
    }
  }

  Future<void> _loadTask() async {
    final FinancialCloseTask? task = ref
        .read(financialCloseTaskDetailProvider(widget.taskId!))
        .valueOrNull;
    if (task != null) {
      _titleCtrl.text = task.title;
      _periodCtrl.text = task.period;
      _assignedToCtrl.text = task.assignedTo ?? '';
      _notesCtrl.text = task.notes ?? '';
      _status = task.status;
      _priority = task.priority;
    }
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _periodCtrl.dispose();
    _assignedToCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final Map<String, dynamic> payload = <String, dynamic>{
      'title': _titleCtrl.text.trim(),
      'period': _periodCtrl.text.trim(),
      'status': _status,
      'priority': _priority,
      'assignedTo': _assignedToCtrl.text.trim().isEmpty ? null : _assignedToCtrl.text.trim(),
      'notes': _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
    };

    final Result<FinancialCloseTask> result = await ref
        .read(financialCloseTaskListControllerProvider.notifier)
        .save(payload, id: widget.taskId);

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
        title: Text(_isEditing ? 'Edit Close Task' : 'New Close Task'),
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
              controller: _titleCtrl,
              decoration: const InputDecoration(labelText: 'Title *'),
              validator: (String? v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _periodCtrl,
              decoration: const InputDecoration(
                labelText: 'Period *',
                helperText: 'e.g. 2026-07, Q3 2026',
              ),
              validator: (String? v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              value: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: const <DropdownMenuItem<String>>[
                DropdownMenuItem<String>(value: 'PENDING', child: Text('Pending')),
                DropdownMenuItem<String>(value: 'IN_PROGRESS', child: Text('In Progress')),
                DropdownMenuItem<String>(value: 'COMPLETED', child: Text('Completed')),
              ],
              onChanged: (String? v) {
                if (v != null) setState(() => _status = v);
              },
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              value: _priority,
              decoration: const InputDecoration(labelText: 'Priority'),
              items: const <DropdownMenuItem<String>>[
                DropdownMenuItem<String>(value: 'LOW', child: Text('Low')),
                DropdownMenuItem<String>(value: 'MEDIUM', child: Text('Medium')),
                DropdownMenuItem<String>(value: 'HIGH', child: Text('High')),
              ],
              onChanged: (String? v) {
                if (v != null) setState(() => _priority = v);
              },
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _assignedToCtrl,
              decoration: const InputDecoration(
                labelText: 'Assigned To',
              ),
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
}
