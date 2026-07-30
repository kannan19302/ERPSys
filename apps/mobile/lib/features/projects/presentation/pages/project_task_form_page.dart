import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/utils/formatters.dart';
import '../../domain/entities/projects.dart';
import '../providers/projects_providers.dart';

class ProjectTaskFormPage extends ConsumerStatefulWidget {
  const ProjectTaskFormPage({this.taskId, super.key});
  static const String routeName = 'task-new';
  static const String routeEditName = 'task-edit';
  static const String routePath = '/projects/tasks/new';
  static const String routeEditPath = '/projects/tasks/:id/edit';

  final String? taskId;

  @override
  ConsumerState<ProjectTaskFormPage> createState() => _ProjectTaskFormPageState();
}

class _ProjectTaskFormPageState extends ConsumerState<ProjectTaskFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _titleCtrl = TextEditingController();
  final _descriptionCtrl = TextEditingController();
  final _projectIdCtrl = TextEditingController();
  final _assigneeCtrl = TextEditingController();
  final _estHoursCtrl = TextEditingController();
  DateTime? _dueDate;
  String _priority = 'MEDIUM';
  String _status = 'TODO';
  bool _saving = false;

  bool get _isEditing => widget.taskId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) _load();
  }

  Future<void> _load() async {
    final t = ref.read(taskDetailProvider(widget.taskId!)).valueOrNull;
    if (t != null) {
      _titleCtrl.text = t.title;
      _descriptionCtrl.text = t.description ?? '';
      _projectIdCtrl.text = t.projectId;
      _assigneeCtrl.text = t.assigneeName ?? '';
      _estHoursCtrl.text = t.estimatedHours?.toString() ?? '';
      _dueDate = t.dueDate;
      _priority = t.priority;
      _status = t.status;
    }
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _descriptionCtrl.dispose();
    _projectIdCtrl.dispose();
    _assigneeCtrl.dispose();
    _estHoursCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final payload = <String, dynamic>{
      'title': _titleCtrl.text.trim(),
      'description': _descriptionCtrl.text.trim().isEmpty ? null : _descriptionCtrl.text.trim(),
      'projectId': _projectIdCtrl.text.trim(),
      'assigneeName': _assigneeCtrl.text.trim().isEmpty ? null : _assigneeCtrl.text.trim(),
      'estimatedHours': double.tryParse(_estHoursCtrl.text),
      'dueDate': _dueDate?.toIso8601String(),
      'priority': _priority,
      'status': _status,
    };

    final result = await ref.read(taskListControllerProvider.notifier).save(
      payload, id: widget.taskId);

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
        title: Text(_isEditing ? 'Edit Task' : 'New Task'),
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
              controller: _titleCtrl,
              decoration: const InputDecoration(labelText: 'Title *'),
              validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _descriptionCtrl,
              maxLines: 3,
              decoration: const InputDecoration(labelText: 'Description', alignLabelWithHint: true),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _projectIdCtrl,
              decoration: const InputDecoration(labelText: 'Project ID *'),
              validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _assigneeCtrl,
              decoration: const InputDecoration(labelText: 'Assignee'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _estHoursCtrl,
              keyboardType: TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(labelText: 'Estimated Hours'),
              validator: (v) {
                if (v != null && v.trim().isNotEmpty && double.tryParse(v) == null) return 'Enter a valid number';
                return null;
              },
            ),
            const SizedBox(height: Spacing.x4),
            InkWell(
              onTap: () async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate: _dueDate ?? DateTime.now(),
                  firstDate: DateTime(2020),
                  lastDate: DateTime(2030),
                );
                if (picked != null) setState(() => _dueDate = picked);
              },
              child: InputDecorator(
                decoration: const InputDecoration(labelText: 'Due Date'),
                child: Text(_dueDate != null ? Formatters.date(_dueDate!) : 'Tap to select'),
              ),
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              value: _priority,
              decoration: const InputDecoration(labelText: 'Priority'),
              items: ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
                  .map((v) => DropdownMenuItem<String>(value: v, child: Text(v)))
                  .toList(),
              onChanged: (v) { if (v != null) setState(() => _priority = v); },
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              value: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']
                  .map((v) => DropdownMenuItem<String>(value: v, child: Text(v)))
                  .toList(),
              onChanged: (v) { if (v != null) setState(() => _status = v); },
            ),
          ],
        ),
      ),
    );
  }
}