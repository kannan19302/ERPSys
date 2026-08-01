import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../providers/projects_providers.dart';

class ProjectPortfolioFormPage extends ConsumerStatefulWidget {
  const ProjectPortfolioFormPage({this.portfolioId, super.key});
  static const String routeName = 'project-portfolio-new';
  static const String routeEditName = 'project-portfolio-edit';
  static const String routePath = '/projects/portfolios/new';
  static const String routeEditPath = '/projects/portfolios/:id/edit';

  final String? portfolioId;

  @override
  ConsumerState<ProjectPortfolioFormPage> createState() => _ProjectPortfolioFormPageState();
}

class _ProjectPortfolioFormPageState extends ConsumerState<ProjectPortfolioFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _descriptionCtrl = TextEditingController();
  bool _saving = false;

  bool get _isEditing => widget.portfolioId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) _load();
  }

  Future<void> _load() async {
    final p = ref.read(projectPortfolioDetailProvider(widget.portfolioId!)).valueOrNull;
    if (p != null) {
      _nameCtrl.text = p.name;
      _descriptionCtrl.text = p.description ?? '';
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _descriptionCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final payload = <String, dynamic>{
      'name': _nameCtrl.text.trim(),
      'description': _descriptionCtrl.text.trim().isEmpty ? null : _descriptionCtrl.text.trim(),
    };

    final result = await ref.read(projectPortfolioListControllerProvider.notifier).save(
      payload, id: widget.portfolioId,);

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
        title: Text(_isEditing ? 'Edit Portfolio' : 'New Portfolio'),
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
          ],
        ),
      ),
    );
  }
}