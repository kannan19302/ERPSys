import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/ai.dart';
import '../providers/ai_providers.dart';

class AiPredictionFormPage extends ConsumerStatefulWidget {
  const AiPredictionFormPage({this.predictionId, super.key});

  static const String routeName = 'ai-prediction-new';
  static const String routeEditName = 'ai-prediction-edit';
  static const String routePath = '/ai/predictions/new';
  static const String routeEditPath = '/ai/predictions/:id/edit';

  final String? predictionId;

  @override
  ConsumerState<AiPredictionFormPage> createState() => _AiPredictionFormPageState();
}

class _AiPredictionFormPageState extends ConsumerState<AiPredictionFormPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _modelIdCtrl = TextEditingController();
  final TextEditingController _modelNameCtrl = TextEditingController();
  final TextEditingController _inputCtrl = TextEditingController();
  final TextEditingController _outputCtrl = TextEditingController();
  final TextEditingController _confidenceCtrl = TextEditingController();

  bool _saving = false;

  bool get _isEditing => widget.predictionId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) {
      _loadPrediction();
    }
  }

  void _loadPrediction() {
    final AiPrediction? prediction = ref
        .read(aiPredictionDetailProvider(widget.predictionId!))
        .valueOrNull;
    if (prediction != null) {
      _modelIdCtrl.text = prediction.modelId ?? '';
      _modelNameCtrl.text = prediction.modelName ?? '';
      _inputCtrl.text = _encodeMap(prediction.input);
      _outputCtrl.text = prediction.output != null ? _encodeMap(prediction.output!) : '';
      _confidenceCtrl.text = prediction.confidence?.toString() ?? '';
    }
  }

  String _encodeMap(Map<String, dynamic> map) {
    try {
      return const JsonEncoder.withIndent('  ').convert(map);
    } catch (_) {
      return map.toString();
    }
  }

  Map<String, dynamic> _decodeMap(String text) {
    try {
      return json.decode(text) as Map<String, dynamic>;
    } catch (_) {
      return <String, dynamic>{};
    }
  }

  @override
  void dispose() {
    _modelIdCtrl.dispose();
    _modelNameCtrl.dispose();
    _inputCtrl.dispose();
    _outputCtrl.dispose();
    _confidenceCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final Map<String, dynamic> payload = <String, dynamic>{
      'modelId': _modelIdCtrl.text.trim().isEmpty ? null : _modelIdCtrl.text.trim(),
      'modelName': _modelNameCtrl.text.trim().isEmpty ? null : _modelNameCtrl.text.trim(),
      'input': _decodeMap(_inputCtrl.text),
      'output': _outputCtrl.text.trim().isEmpty ? null : _decodeMap(_outputCtrl.text),
      'confidence': double.tryParse(_confidenceCtrl.text),
    };

    final Result<AiPrediction> result = await ref
        .read(aiPredictionListControllerProvider.notifier)
        .save(payload, id: widget.predictionId);

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
        title: Text(_isEditing ? 'Edit Prediction' : 'New Prediction'),
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
              controller: _modelIdCtrl,
              decoration: const InputDecoration(labelText: 'Model ID'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _modelNameCtrl,
              decoration: const InputDecoration(labelText: 'Model Name'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _inputCtrl,
              maxLines: 5,
              decoration: const InputDecoration(
                labelText: 'Input (JSON)',
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _outputCtrl,
              maxLines: 5,
              decoration: const InputDecoration(
                labelText: 'Output (JSON)',
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _confidenceCtrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(
                labelText: 'Confidence',
                helperText: '0.0 to 1.0',
              ),
            ),
          ],
        ),
      ),
    );
  }
}
