import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/builder.dart';
import '../providers/builder_providers.dart';

class BuilderFormFormPage extends ConsumerStatefulWidget {
  const BuilderFormFormPage({this.formId, super.key});

  static const String routeName = 'builder-form-new';
  static const String routeEditName = 'builder-form-edit';
  static const String routePath = '/builder/forms/new';
  static const String routeEditPath = '/builder/forms/:id/edit';

  final String? formId;

  @override
  ConsumerState<BuilderFormFormPage> createState() => _BuilderFormFormPageState();
}

class _BuilderFormFormPageState extends ConsumerState<BuilderFormFormPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _titleCtrl = TextEditingController();
  final TextEditingController _descriptionCtrl = TextEditingController();

  String _status = 'DRAFT';
  bool _saving = false;

  bool get _isEditing => widget.formId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) {
      _loadForm();
    }
  }

  Future<void> _loadForm() async {
    final BuilderForm? form = ref
        .read(builderFormDetailProvider(widget.formId!))
        .valueOrNull;
    if (form != null) {
      _titleCtrl.text = form.title;
      _descriptionCtrl.text = form.description ?? '';
      _status = form.status;
    }
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _descriptionCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final Map<String, dynamic> payload = <String, dynamic>{
      'title': _titleCtrl.text.trim(),
      'description': _descriptionCtrl.text.trim().isEmpty ? null : _descriptionCtrl.text.trim(),
      'status': _status,
    };

    final Result<BuilderForm> result = await ref
        .read(builderFormListControllerProvider.notifier)
        .save(payload, id: widget.formId);

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
        title: Text(_isEditing ? 'Edit Form' : 'New Form'),
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
              controller: _descriptionCtrl,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Description',
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              initialValue: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: const <DropdownMenuItem<String>>[
                DropdownMenuItem<String>(value: 'DRAFT', child: Text('Draft')),
                DropdownMenuItem<String>(value: 'PUBLISHED', child: Text('Published')),
              ],
              onChanged: (String? v) {
                if (v != null) setState(() => _status = v);
              },
            ),
          ],
        ),
      ),
    );
  }
}