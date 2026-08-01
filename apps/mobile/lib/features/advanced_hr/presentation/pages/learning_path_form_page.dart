import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/advanced_hr.dart';
import '../providers/advanced_hr_providers.dart';

class LearningPathFormPage extends ConsumerStatefulWidget {
  const LearningPathFormPage({this.pathId, super.key});

  static const String routeName = 'learning-path-new';
  static const String routeEditName = 'learning-path-edit';
  static const String routePath = '/advanced-hr/learning-paths/new';
  static const String routeEditPath = '/advanced-hr/learning-paths/:id/edit';

  final String? pathId;

  @override
  ConsumerState<LearningPathFormPage> createState() => _LearningPathFormPageState();
}

class _LearningPathFormPageState extends ConsumerState<LearningPathFormPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _titleCtrl = TextEditingController();
  final TextEditingController _categoryCtrl = TextEditingController();
  final TextEditingController _descriptionCtrl = TextEditingController();

  String _status = 'ACTIVE';
  bool _saving = false;

  bool get _isEditing => widget.pathId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) {
      _loadPath();
    }
  }

  Future<void> _loadPath() async {
    final LearningPath? path = ref
        .read(learningPathDetailProvider(widget.pathId!))
        .valueOrNull;
    if (path != null) {
      _titleCtrl.text = path.title;
      _categoryCtrl.text = path.category;
      _descriptionCtrl.text = path.description ?? '';
      _status = path.status;
    }
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _categoryCtrl.dispose();
    _descriptionCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final Map<String, dynamic> payload = <String, dynamic>{
      'title': _titleCtrl.text.trim(),
      'category': _categoryCtrl.text.trim(),
      'status': _status,
      'description': _descriptionCtrl.text.trim().isEmpty ? null : _descriptionCtrl.text.trim(),
    };

    final Result<LearningPath> result = await ref
        .read(learningPathListControllerProvider.notifier)
        .save(payload, id: widget.pathId);

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
        title: Text(_isEditing ? 'Edit Learning Path' : 'New Learning Path'),
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
              controller: _categoryCtrl,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(labelText: 'Category *'),
              validator: (String? v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              initialValue: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: const <DropdownMenuItem<String>>[
                DropdownMenuItem<String>(value: 'ACTIVE', child: Text('Active')),
                DropdownMenuItem<String>(value: 'INACTIVE', child: Text('Inactive')),
                DropdownMenuItem<String>(value: 'ARCHIVED', child: Text('Archived')),
              ],
              onChanged: (String? v) {
                if (v != null) setState(() => _status = v);
              },
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _descriptionCtrl,
              maxLines: 4,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(
                labelText: 'Description',
                alignLabelWithHint: true,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
