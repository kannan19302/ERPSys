import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/reporting.dart';
import '../providers/reporting_providers.dart';

class ReportTemplateFormPage extends ConsumerStatefulWidget {
  const ReportTemplateFormPage({this.templateId, super.key});
  static const String routeName = 'template-new';
  static const String routeEditName = 'template-edit';
  static const String routePath = '/reporting/templates/new';
  static const String routeEditPath = '/reporting/templates/:id/edit';
  final String? templateId;

  @override
  ConsumerState<ReportTemplateFormPage> createState() => _ReportTemplateFormPageState();
}

class _ReportTemplateFormPageState extends ConsumerState<ReportTemplateFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _descriptionCtrl = TextEditingController();
  final _contentCtrl = TextEditingController();
  String _format = 'PDF';
  String _status = 'DRAFT';
  bool _saving = false;

  bool get _isEditing => widget.templateId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) _load();
  }

  Future<void> _load() async {
    final t = ref.read(reportTemplateDetailProvider(widget.templateId!)).valueOrNull;
    if (t != null) {
      _nameCtrl.text = t.name;
      _descriptionCtrl.text = t.description ?? '';
      _format = t.format;
      _status = t.status;
      if (t.config != null) _contentCtrl.text = t.config.toString();
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _descriptionCtrl.dispose();
    _contentCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final payload = <String, dynamic>{
      'name': _nameCtrl.text.trim(),
      'description': _descriptionCtrl.text.trim().isEmpty ? null : _descriptionCtrl.text.trim(),
      'format': _format,
      'status': _status,
      'reportType': _descriptionCtrl.text.trim(),
    };
    final result = await ref.read(reportTemplateListControllerProvider.notifier).save(payload, id: widget.templateId);
    if (!context.mounted) return;
    setState(() => _saving = false);
    result.fold(
      (f) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(f.message))),
      (_) => Navigator.of(context).pop(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditing ? 'Edit Template' : 'New Template'),
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
            DropdownButtonFormField<String>(
              value: _format,
              decoration: const InputDecoration(labelText: 'Format'),
              items: const [
                DropdownMenuItem(value: 'PDF', child: Text('PDF')),
                DropdownMenuItem(value: 'CSV', child: Text('CSV')),
                DropdownMenuItem(value: 'XLSX', child: Text('Excel')),
                DropdownMenuItem(value: 'HTML', child: Text('HTML')),
              ],
              onChanged: (v) { if (v != null) setState(() => _format = v); },
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              value: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: const [
                DropdownMenuItem(value: 'DRAFT', child: Text('Draft')),
                DropdownMenuItem(value: 'ACTIVE', child: Text('Active')),
                DropdownMenuItem(value: 'ARCHIVED', child: Text('Archived')),
              ],
              onChanged: (v) { if (v != null) setState(() => _status = v); },
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _contentCtrl,
              maxLines: 10,
              decoration: const InputDecoration(
                labelText: 'Content / Config',
                alignLabelWithHint: true,
                helperText: 'JSON configuration for the template',
              ),
            ),
          ],
        ),
      ),
    );
  }
}
