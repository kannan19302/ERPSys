import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/ai.dart';
import '../providers/ai_providers.dart';

class AiModelFormPage extends ConsumerStatefulWidget {
  const AiModelFormPage({this.modelId, super.key});

  static const String routeName = 'ai-model-new';
  static const String routeEditName = 'ai-model-edit';
  static const String routePath = '/ai/models/new';
  static const String routeEditPath = '/ai/models/:id/edit';

  final String? modelId;

  @override
  ConsumerState<AiModelFormPage> createState() => _AiModelFormPageState();
}

class _AiModelFormPageState extends ConsumerState<AiModelFormPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _nameCtrl = TextEditingController();
  final TextEditingController _providerCtrl = TextEditingController();
  final TextEditingController _versionCtrl = TextEditingController();
  final TextEditingController _capabilitiesCtrl = TextEditingController();

  String _status = 'ACTIVE';
  bool _saving = false;

  bool get _isEditing => widget.modelId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) {
      _loadModel();
    }
  }

  Future<void> _loadModel() async {
    final AiModel? model = ref
        .read(aiModelDetailProvider(widget.modelId!))
        .valueOrNull;
    if (model != null) {
      _nameCtrl.text = model.name;
      _providerCtrl.text = model.provider ?? '';
      _versionCtrl.text = model.version ?? '';
      _capabilitiesCtrl.text = model.capabilities.join(', ');
      _status = model.status;
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _providerCtrl.dispose();
    _versionCtrl.dispose();
    _capabilitiesCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final Map<String, dynamic> payload = <String, dynamic>{
      'name': _nameCtrl.text.trim(),
      'provider': _providerCtrl.text.trim().isEmpty ? null : _providerCtrl.text.trim(),
      'version': _versionCtrl.text.trim().isEmpty ? null : _versionCtrl.text.trim(),
      'status': _status,
      'capabilities': _capabilitiesCtrl.text.trim().isEmpty
          ? <String>[]
          : _capabilitiesCtrl.text.split(',').map((String s) => s.trim()).where((String s) => s.isNotEmpty).toList(),
    };

    final Result<AiModel> result = await ref
        .read(aiModelListControllerProvider.notifier)
        .save(payload, id: widget.modelId);

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
        title: Text(_isEditing ? 'Edit Model' : 'New Model'),
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
              controller: _providerCtrl,
              decoration: const InputDecoration(
                labelText: 'Provider',
                helperText: 'e.g. OpenAI, Anthropic',
              ),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _versionCtrl,
              decoration: const InputDecoration(labelText: 'Version'),
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              initialValue: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: const <DropdownMenuItem<String>>[
                DropdownMenuItem<String>(value: 'ACTIVE', child: Text('Active')),
                DropdownMenuItem<String>(value: 'INACTIVE', child: Text('Inactive')),
                DropdownMenuItem<String>(value: 'DEPRECATED', child: Text('Deprecated')),
              ],
              onChanged: (String? v) {
                if (v != null) setState(() => _status = v);
              },
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _capabilitiesCtrl,
              decoration: const InputDecoration(
                labelText: 'Capabilities',
                helperText: 'Comma-separated: text, image, code',
              ),
            ),
          ],
        ),
      ),
    );
  }
}
