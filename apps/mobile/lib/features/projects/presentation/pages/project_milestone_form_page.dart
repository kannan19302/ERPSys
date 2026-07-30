import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/utils/formatters.dart';
import '../providers/projects_providers.dart';

class ProjectMilestoneFormPage extends ConsumerStatefulWidget {
  const ProjectMilestoneFormPage({this.milestoneId, super.key});
  static const String routeName = 'milestone-new';
  static const String routeEditName = 'milestone-edit';
  static const String routePath = '/projects/milestones/new';
  static const String routeEditPath = '/projects/milestones/:id/edit';

  final String? milestoneId;

  @override
  ConsumerState<ProjectMilestoneFormPage> createState() => _ProjectMilestoneFormPageState();
}

class _ProjectMilestoneFormPageState extends ConsumerState<ProjectMilestoneFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _projectIdCtrl = TextEditingController();
  final _descriptionCtrl = TextEditingController();
  DateTime? _dueDate;
  String _status = 'PENDING';
  bool _saving = false;

  bool get _isEditing => widget.milestoneId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) _load();
  }

  Future<void> _load() async {
    final m = ref.read(milestoneDetailProvider(widget.milestoneId!)).valueOrNull;
    if (m != null) {
      _nameCtrl.text = m.title;
      _projectIdCtrl.text = m.projectId;
      _dueDate = m.dueDate;
      _status = m.status;
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _projectIdCtrl.dispose();
    _descriptionCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final payload = <String, dynamic>{
      'title': _nameCtrl.text.trim(),
      'projectId': _projectIdCtrl.text.trim(),
      'dueDate': _dueDate?.toIso8601String(),
      'status': _status,
      'description': _descriptionCtrl.text.trim().isEmpty ? null : _descriptionCtrl.text.trim(),
    };

    final result = await ref.read(milestoneListControllerProvider.notifier).save(
      payload, id: widget.milestoneId);

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
        title: Text(_isEditing ? 'Edit Milestone' : 'New Milestone'),
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
              controller: _nameCtrl,
              decoration: const InputDecoration(labelText: 'Name *'),
              validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _projectIdCtrl,
              decoration: const InputDecoration(labelText: 'Project ID *'),
              validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _descriptionCtrl,
              maxLines: 3,
              decoration: const InputDecoration(labelText: 'Description', alignLabelWithHint: true),
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
                decoration: const InputDecoration(labelText: 'Due Date *'),
                child: Text(_dueDate != null ? Formatters.date(_dueDate!) : 'Tap to select'),
              ),
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              value: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: ['PENDING', 'IN_PROGRESS', 'ACHIEVED', 'MISSED']
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