import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/crm.dart';
import '../providers/crm_providers.dart';

class EmailTemplateFormPage extends ConsumerStatefulWidget {
  const EmailTemplateFormPage({this.templateId, super.key});

  static const String routeName = 'email-template-new';
  static const String routeEditName = 'email-template-edit';
  static const String routePath = '/crm/email-templates/new';
  static const String routeEditPath = '/crm/email-templates/:id/edit';

  final String? templateId;

  @override
  ConsumerState<EmailTemplateFormPage> createState() =>
      _EmailTemplateFormPageState();
}

class _EmailTemplateFormPageState extends ConsumerState<EmailTemplateFormPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _nameCtrl = TextEditingController();
  final TextEditingController _subjectCtrl = TextEditingController();
  final TextEditingController _bodyCtrl = TextEditingController();
  String _category = '';
  bool _saving = false;

  static const List<String> _categories = <String>[
    'SALES', 'MARKETING', 'SUPPORT', 'GENERAL',
  ];

  bool get _isEditing => widget.templateId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) {
      _loadTemplate();
    }
  }

  Future<void> _loadTemplate() async {
    final EmailTemplate? template = ref
        .read(emailTemplateDetailProvider(widget.templateId!))
        .valueOrNull;
    if (template != null) {
      _nameCtrl.text = template.name;
      _subjectCtrl.text = template.subject;
      _bodyCtrl.text = template.body ?? '';
      _category = template.category ?? '';
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _subjectCtrl.dispose();
    _bodyCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final Map<String, dynamic> payload = <String, dynamic>{
      'name': _nameCtrl.text.trim(),
      'subject': _subjectCtrl.text.trim(),
      'body': _bodyCtrl.text.trim().isEmpty ? null : _bodyCtrl.text.trim(),
      if (_category.isNotEmpty) 'category': _category,
    };

    final Result<EmailTemplate> result = await ref
        .read(emailTemplatesProvider.notifier)
        .save(payload, id: widget.templateId);

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
        title: Text(_isEditing ? 'Edit Template' : 'New Template'),
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
              controller: _nameCtrl,
              decoration: const InputDecoration(labelText: 'Name'),
              validator: (String? v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _subjectCtrl,
              decoration: const InputDecoration(labelText: 'Subject'),
              validator: (String? v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              value: _category.isEmpty ? null : _category,
              decoration: const InputDecoration(labelText: 'Category'),
              items: _categories
                  .map(
                    (String c) => DropdownMenuItem<String>(
                      value: c,
                      child: Text(c),
                    ),
                  )
                  .toList(),
              onChanged: (String? v) {
                if (v != null) setState(() => _category = v);
              },
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _bodyCtrl,
              maxLines: 12,
              decoration: const InputDecoration(
                labelText: 'Body',
                alignLabelWithHint: true,
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
