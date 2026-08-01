import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/ai.dart';
import '../providers/ai_providers.dart';

class AiPromptFormPage extends ConsumerStatefulWidget {
  const AiPromptFormPage({this.promptId, super.key});

  static const String routeName = 'ai-prompt-new';
  static const String routeEditName = 'ai-prompt-edit';
  static const String routePath = '/ai/prompts/new';
  static const String routeEditPath = '/ai/prompts/:id/edit';

  final String? promptId;

  @override
  ConsumerState<AiPromptFormPage> createState() => _AiPromptFormPageState();
}

class _AiPromptFormPageState extends ConsumerState<AiPromptFormPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _titleCtrl = TextEditingController();
  final TextEditingController _promptCtrl = TextEditingController();
  final TextEditingController _modelIdCtrl = TextEditingController();

  String _status = 'ACTIVE';
  bool _saving = false;

  bool get _isEditing => widget.promptId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) {
      _loadPrompt();
    }
  }

  Future<void> _loadPrompt() async {
    final AiPrompt? prompt = ref
        .read(aiPromptDetailProvider(widget.promptId!))
        .valueOrNull;
    if (prompt != null) {
      _titleCtrl.text = prompt.title ?? '';
      _promptCtrl.text = prompt.prompt;
      _modelIdCtrl.text = prompt.modelId ?? '';
      _status = prompt.status;
    }
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _promptCtrl.dispose();
    _modelIdCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final Map<String, dynamic> payload = <String, dynamic>{
      'title': _titleCtrl.text.trim().isEmpty ? null : _titleCtrl.text.trim(),
      'prompt': _promptCtrl.text.trim(),
      'modelId': _modelIdCtrl.text.trim().isEmpty ? null : _modelIdCtrl.text.trim(),
      'status': _status,
    };

    final Result<AiPrompt> result = await ref
        .read(aiPromptListControllerProvider.notifier)
        .save(payload, id: widget.promptId);

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
        title: Text(_isEditing ? 'Edit Prompt' : 'New Prompt'),
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
              decoration: const InputDecoration(labelText: 'Title'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _promptCtrl,
              maxLines: 8,
              decoration: const InputDecoration(
                labelText: 'Prompt *',
                alignLabelWithHint: true,
              ),
              validator: (String? v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _modelIdCtrl,
              decoration: const InputDecoration(labelText: 'Model ID'),
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              initialValue: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: const <DropdownMenuItem<String>>[
                DropdownMenuItem<String>(value: 'ACTIVE', child: Text('Active')),
                DropdownMenuItem<String>(value: 'ARCHIVED', child: Text('Archived')),
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
