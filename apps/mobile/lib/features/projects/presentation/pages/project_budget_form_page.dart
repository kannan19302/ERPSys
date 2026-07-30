import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../providers/projects_providers.dart';

class ProjectBudgetFormPage extends ConsumerStatefulWidget {
  const ProjectBudgetFormPage({this.budgetId, super.key});
  static const String routeName = 'project-budget-new';
  static const String routeEditName = 'project-budget-edit';
  static const String routePath = '/projects/budgets/new';
  static const String routeEditPath = '/projects/budgets/:id/edit';

  final String? budgetId;

  @override
  ConsumerState<ProjectBudgetFormPage> createState() => _ProjectBudgetFormPageState();
}

class _ProjectBudgetFormPageState extends ConsumerState<ProjectBudgetFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _projectIdCtrl = TextEditingController();
  final _categoryCtrl = TextEditingController();
  final _estimatedCtrl = TextEditingController();
  bool _saving = false;

  bool get _isEditing => widget.budgetId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) _load();
  }

  Future<void> _load() async {
    final b = ref.read(projectBudgetDetailProvider(widget.budgetId!)).valueOrNull;
    if (b != null) {
      _projectIdCtrl.text = b.projectId;
      _categoryCtrl.text = b.category;
      _estimatedCtrl.text = b.budgetedAmount.toString();
    }
  }

  @override
  void dispose() {
    _projectIdCtrl.dispose();
    _categoryCtrl.dispose();
    _estimatedCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final payload = <String, dynamic>{
      'projectId': _projectIdCtrl.text.trim(),
      'category': _categoryCtrl.text.trim(),
      'budgetedAmount': double.tryParse(_estimatedCtrl.text) ?? 0,
    };

    final result = await ref.read(projectBudgetListControllerProvider.notifier).save(
      payload, id: widget.budgetId);

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
        title: Text(_isEditing ? 'Edit Budget' : 'New Budget'),
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
              controller: _categoryCtrl,
              decoration: const InputDecoration(labelText: 'Category *'),
              validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _estimatedCtrl,
              keyboardType: TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(labelText: 'Estimated Amount *'),
              validator: (v) {
                if (v == null || v.trim().isEmpty) return 'Required';
                if (double.tryParse(v) == null) return 'Enter a valid number';
                return null;
              },
            ),
          ],
        ),
      ),
    );
  }
}