import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/ai.dart';
import '../providers/ai_providers.dart';

class AiTrainingDataFormPage extends ConsumerStatefulWidget {
  const AiTrainingDataFormPage({this.dataId, super.key});

  static const String routeName = 'ai-training-data-new';
  static const String routeEditName = 'ai-training-data-edit';
  static const String routePath = '/ai/training-data/new';
  static const String routeEditPath = '/ai/training-data/:id/edit';

  final String? dataId;

  @override
  ConsumerState<AiTrainingDataFormPage> createState() => _AiTrainingDataFormPageState();
}

class _AiTrainingDataFormPageState extends ConsumerState<AiTrainingDataFormPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _nameCtrl = TextEditingController();
  final TextEditingController _dataTypeCtrl = TextEditingController();
  final TextEditingController _fileUrlCtrl = TextEditingController();

  String _status = 'PENDING';
  bool _saving = false;

  bool get _isEditing => widget.dataId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) {
      _loadData();
    }
  }

  Future<void> _loadData() async {
    final AiTrainingData? data = ref
        .read(aiTrainingDataDetailProvider(widget.dataId!))
        .valueOrNull;
    if (data != null) {
      _nameCtrl.text = data.name;
      _dataTypeCtrl.text = data.dataType ?? '';
      _fileUrlCtrl.text = data.fileUrl ?? '';
      _status = data.status;
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _dataTypeCtrl.dispose();
    _fileUrlCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final Map<String, dynamic> payload = <String, dynamic>{
      'name': _nameCtrl.text.trim(),
      'dataType': _dataTypeCtrl.text.trim().isEmpty ? null : _dataTypeCtrl.text.trim(),
      'status': _status,
      'fileUrl': _fileUrlCtrl.text.trim().isEmpty ? null : _fileUrlCtrl.text.trim(),
    };

    final Result<AiTrainingData> result = await ref
        .read(aiTrainingDataListControllerProvider.notifier)
        .save(payload, id: widget.dataId);

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
        title: Text(_isEditing ? 'Edit Training Data' : 'New Training Data'),
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
              controller: _dataTypeCtrl,
              decoration: const InputDecoration(
                labelText: 'Data Type',
                helperText: 'e.g. text, image, csv, jsonl',
              ),
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              value: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: const <DropdownMenuItem<String>>[
                DropdownMenuItem<String>(value: 'PENDING', child: Text('Pending')),
                DropdownMenuItem<String>(value: 'ACTIVE', child: Text('Active')),
                DropdownMenuItem<String>(value: 'FAILED', child: Text('Failed')),
              ],
              onChanged: (String? v) {
                if (v != null) setState(() => _status = v);
              },
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _fileUrlCtrl,
              decoration: const InputDecoration(
                labelText: 'File URL',
                helperText: 'Link to the dataset file',
              ),
            ),
          ],
        ),
      ),
    );
  }
}
