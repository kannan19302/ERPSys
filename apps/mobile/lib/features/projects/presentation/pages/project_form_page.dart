import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/utils/formatters.dart';
import '../../domain/entities/projects.dart';
import '../providers/projects_providers.dart';

class ProjectFormPage extends ConsumerStatefulWidget {
  const ProjectFormPage({this.projectId, super.key});
  static const String routeName = 'project-new';
  static const String routeEditName = 'project-edit';
  static const String routePath = '/projects/new';
  static const String routeEditPath = '/projects/:id/edit';

  final String? projectId;

  @override
  ConsumerState<ProjectFormPage> createState() => _ProjectFormPageState();
}

class _ProjectFormPageState extends ConsumerState<ProjectFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _descriptionCtrl = TextEditingController();
  final _portfolioCtrl = TextEditingController();
  final _managerCtrl = TextEditingController();
  final _budgetCtrl = TextEditingController();
  DateTime? _startDate;
  DateTime? _endDate;
  String _status = 'PLANNING';
  String _priority = 'MEDIUM';
  bool _saving = false;

  bool get _isEditing => widget.projectId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) _load();
  }

  Future<void> _load() async {
    final p = ref.read(projectDetailProvider(widget.projectId!)).valueOrNull;
    if (p != null) {
      _nameCtrl.text = p.name;
      _descriptionCtrl.text = p.description;
      _managerCtrl.text = p.managerName ?? '';
      _budgetCtrl.text = p.budget.toString();
      _startDate = p.startDate;
      _endDate = p.endDate;
      _status = p.status;
      _priority = p.priority;
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _descriptionCtrl.dispose();
    _portfolioCtrl.dispose();
    _managerCtrl.dispose();
    _budgetCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final payload = <String, dynamic>{
      'name': _nameCtrl.text.trim(),
      'description': _descriptionCtrl.text.trim(),
      'managerName': _managerCtrl.text.trim().isEmpty ? null : _managerCtrl.text.trim(),
      'budget': double.tryParse(_budgetCtrl.text) ?? 0,
      'startDate': _startDate?.toIso8601String(),
      'endDate': _endDate?.toIso8601String(),
      'status': _status,
      'priority': _priority,
      'portfolioId': _portfolioCtrl.text.trim().isEmpty ? null : _portfolioCtrl.text.trim(),
    };

    final result = await ref.read(projectListControllerProvider.notifier).save(
      payload, id: widget.projectId);

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
        title: Text(_isEditing ? 'Edit Project' : 'New Project'),
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
              controller: _descriptionCtrl,
              maxLines: 3,
              decoration: const InputDecoration(labelText: 'Description', alignLabelWithHint: true),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _portfolioCtrl,
              decoration: const InputDecoration(labelText: 'Portfolio ID'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _managerCtrl,
              decoration: const InputDecoration(labelText: 'Manager'),
            ),
            const SizedBox(height: Spacing.x4),
            Row(
              children: [
                Expanded(
                  child: InkWell(
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context, initialDate: _startDate ?? DateTime.now(),
                        firstDate: DateTime(2020), lastDate: DateTime(2030));
                      if (picked != null) setState(() => _startDate = picked);
                    },
                    child: InputDecorator(
                      decoration: const InputDecoration(labelText: 'Start Date'),
                      child: Text(_startDate != null ? Formatters.date(_startDate!) : 'Select'),
                    ),
                  ),
                ),
                const SizedBox(width: Spacing.x4),
                Expanded(
                  child: InkWell(
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context, initialDate: _endDate ?? DateTime.now().add(const Duration(days: 30)),
                        firstDate: DateTime(2020), lastDate: DateTime(2030));
                      if (picked != null) setState(() => _endDate = picked);
                    },
                    child: InputDecorator(
                      decoration: const InputDecoration(labelText: 'End Date'),
                      child: Text(_endDate != null ? Formatters.date(_endDate!) : 'Select'),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _budgetCtrl,
              keyboardType: TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(labelText: 'Budget'),
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              value: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']
                  .map((v) => DropdownMenuItem<String>(value: v, child: Text(v)))
                  .toList(),
              onChanged: (v) { if (v != null) setState(() => _status = v); },
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
          ],
        ),
      ),
    );
  }
}