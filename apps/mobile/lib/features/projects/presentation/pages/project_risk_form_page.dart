import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../providers/projects_providers.dart';

class ProjectRiskFormPage extends ConsumerStatefulWidget {
  const ProjectRiskFormPage({this.riskId, super.key});
  static const String routeName = 'project-risk-new';
  static const String routeEditName = 'project-risk-edit';
  static const String routePath = '/projects/risks/new';
  static const String routeEditPath = '/projects/risks/:id/edit';

  final String? riskId;

  @override
  ConsumerState<ProjectRiskFormPage> createState() => _ProjectRiskFormPageState();
}

class _ProjectRiskFormPageState extends ConsumerState<ProjectRiskFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _titleCtrl = TextEditingController();
  final _descriptionCtrl = TextEditingController();
  final _ownerCtrl = TextEditingController();
  final _mitigationCtrl = TextEditingController();
  String _probability = 'MEDIUM';
  String _impact = 'MEDIUM';
  String _status = 'IDENTIFIED';
  bool _saving = false;

  bool get _isEditing => widget.riskId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) _load();
  }

  Future<void> _load() async {
    final r = ref.read(projectRiskDetailProvider(widget.riskId!)).valueOrNull;
    if (r != null) {
      _titleCtrl.text = r.title;
      _descriptionCtrl.text = r.description ?? '';
      _ownerCtrl.text = '';
      _mitigationCtrl.text = r.mitigationPlan ?? '';
      _probability = r.probability;
      _impact = r.impact;
      _status = r.status;
    }
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _descriptionCtrl.dispose();
    _ownerCtrl.dispose();
    _mitigationCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final payload = <String, dynamic>{
      'title': _titleCtrl.text.trim(),
      'description': _descriptionCtrl.text.trim().isEmpty ? null : _descriptionCtrl.text.trim(),
      'probability': _probability,
      'impact': _impact,
      'status': _status,
      'mitigationPlan': _mitigationCtrl.text.trim().isEmpty ? null : _mitigationCtrl.text.trim(),
      'owner': _ownerCtrl.text.trim().isEmpty ? null : _ownerCtrl.text.trim(),
    };

    final result = await ref.read(projectRiskListControllerProvider.notifier).save(
      payload, id: widget.riskId);

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
        title: Text(_isEditing ? 'Edit Risk' : 'New Risk'),
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
              controller: _ownerCtrl,
              decoration: const InputDecoration(labelText: 'Owner'),
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              value: _probability,
              decoration: const InputDecoration(labelText: 'Probability'),
              items: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
                  .map((v) => DropdownMenuItem<String>(value: v, child: Text(v)))
                  .toList(),
              onChanged: (v) { if (v != null) setState(() => _probability = v); },
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              value: _impact,
              decoration: const InputDecoration(labelText: 'Impact'),
              items: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
                  .map((v) => DropdownMenuItem<String>(value: v, child: Text(v)))
                  .toList(),
              onChanged: (v) { if (v != null) setState(() => _impact = v); },
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              value: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: ['IDENTIFIED', 'IN_PROGRESS', 'MITIGATED', 'CLOSED']
                  .map((v) => DropdownMenuItem<String>(value: v, child: Text(v)))
                  .toList(),
              onChanged: (v) { if (v != null) setState(() => _status = v); },
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _mitigationCtrl,
              maxLines: 4,
              decoration: const InputDecoration(labelText: 'Mitigation Plan', alignLabelWithHint: true),
            ),
          ],
        ),
      ),
    );
  }
}