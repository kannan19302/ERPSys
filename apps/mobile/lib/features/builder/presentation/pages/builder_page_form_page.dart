import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/builder.dart';
import '../providers/builder_providers.dart';

class BuilderPageFormPage extends ConsumerStatefulWidget {
  const BuilderPageFormPage({this.pageId, super.key});

  static const String routeName = 'builder-page-new';
  static const String routeEditName = 'builder-page-edit';
  static const String routePath = '/builder/pages/new';
  static const String routeEditPath = '/builder/pages/:id/edit';

  final String? pageId;

  @override
  ConsumerState<BuilderPageFormPage> createState() => _BuilderPageFormPageState();
}

class _BuilderPageFormPageState extends ConsumerState<BuilderPageFormPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _titleCtrl = TextEditingController();
  final TextEditingController _slugCtrl = TextEditingController();

  String _layout = 'default';
  String _status = 'DRAFT';
  bool _saving = false;

  bool get _isEditing => widget.pageId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) {
      _loadPage();
    }
  }

  Future<void> _loadPage() async {
    final BuilderPage? page = ref
        .read(builderPageDetailProvider(widget.pageId!))
        .valueOrNull;
    if (page != null) {
      _titleCtrl.text = page.title;
      _slugCtrl.text = page.slug ?? '';
      _layout = page.layout;
      _status = page.status;
    }
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _slugCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final Map<String, dynamic> payload = <String, dynamic>{
      'title': _titleCtrl.text.trim(),
      'slug': _slugCtrl.text.trim().isEmpty ? null : _slugCtrl.text.trim(),
      'layout': _layout,
      'status': _status,
    };

    final Result<BuilderPage> result = await ref
        .read(builderPageListControllerProvider.notifier)
        .save(payload, id: widget.pageId);

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
        title: Text(_isEditing ? 'Edit Page' : 'New Page'),
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
              controller: _slugCtrl,
              decoration: const InputDecoration(
                labelText: 'Slug',
                helperText: 'URL-friendly identifier',
              ),
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              value: _layout,
              decoration: const InputDecoration(labelText: 'Layout'),
              items: const <DropdownMenuItem<String>>[
                DropdownMenuItem<String>(value: 'default', child: Text('Default')),
                DropdownMenuItem<String>(value: 'full_width', child: Text('Full Width')),
                DropdownMenuItem<String>(value: 'sidebar', child: Text('Sidebar')),
              ],
              onChanged: (String? v) {
                if (v != null) setState(() => _layout = v);
              },
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              value: _status,
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