import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/documents.dart';
import '../providers/documents_providers.dart';

class FolderFormPage extends ConsumerStatefulWidget {
  const FolderFormPage({this.folderId, super.key});

  static const String routeName = 'folder-new';
  static const String routeEditName = 'folder-edit';
  static const String routePath = '/documents/folders/new';
  static const String routeEditPath = '/documents/folders/:id/edit';

  final String? folderId;

  @override
  ConsumerState<FolderFormPage> createState() => _FolderFormPageState();
}

class _FolderFormPageState extends ConsumerState<FolderFormPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _nameCtrl = TextEditingController();
  final TextEditingController _descriptionCtrl = TextEditingController();
  final TextEditingController _parentIdCtrl = TextEditingController();

  bool _saving = false;

  bool get _isEditing => widget.folderId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) {
      _loadFolder();
    }
  }

  Future<void> _loadFolder() async {
    final DocumentFolder? folder = ref
        .read(folderDetailProvider(widget.folderId!))
        .valueOrNull;
    if (folder != null) {
      _nameCtrl.text = folder.name;
      _descriptionCtrl.text = folder.description ?? '';
      _parentIdCtrl.text = folder.parentId ?? '';
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _descriptionCtrl.dispose();
    _parentIdCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final Map<String, dynamic> payload = <String, dynamic>{
      'name': _nameCtrl.text.trim(),
      'description': _descriptionCtrl.text.trim().isEmpty ? null : _descriptionCtrl.text.trim(),
      'parentId': _parentIdCtrl.text.trim().isEmpty ? null : _parentIdCtrl.text.trim(),
    };

    final Result<DocumentFolder> result = await ref
        .read(folderListControllerProvider.notifier)
        .save(payload, id: widget.folderId);

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
        title: Text(_isEditing ? 'Edit Folder' : 'New Folder'),
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
              decoration: const InputDecoration(labelText: 'Name *'),
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
            TextFormField(
              controller: _parentIdCtrl,
              decoration: const InputDecoration(
                labelText: 'Parent Folder ID',
                helperText: 'Leave empty for root folder',
              ),
            ),
          ],
        ),
      ),
    );
  }
}