import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';

class PollFormPage extends ConsumerStatefulWidget {
  const PollFormPage({super.key});

  static const String routeName = 'poll-new';
  static const String routePath = '/communication/polls/new';

  @override
  ConsumerState<PollFormPage> createState() => _PollFormPageState();
}

class _PollFormPageState extends ConsumerState<PollFormPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _questionCtrl = TextEditingController();
  final List<TextEditingController> _optionCtrls = <TextEditingController>[
    TextEditingController(),
    TextEditingController(),
  ];

  bool _saving = false;

  @override
  void dispose() {
    _questionCtrl.dispose();
    for (final c in _optionCtrls) {
      c.dispose();
    }
    super.dispose();
  }

  void _addOption() {
    setState(() => _optionCtrls.add(TextEditingController()));
  }

  void _removeOption(int index) {
    if (_optionCtrls.length <= 2) return;
    setState(() {
      _optionCtrls[index].dispose();
      _optionCtrls.removeAt(index);
    });
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    // Poll creation logic would go here
    await Future.delayed(const Duration(milliseconds: 500));

    if (!context.mounted) return;
    setState(() => _saving = false);
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('New Poll'),
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
              controller: _questionCtrl,
              maxLines: 2,
              decoration: const InputDecoration(
                labelText: 'Question *',
                alignLabelWithHint: true,
              ),
              validator: (String? v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            Text('Options', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: Spacing.x2),
            ..._optionCtrls.asMap().entries.map((MapEntry<int, TextEditingController> entry) {
              return Padding(
                padding: const EdgeInsets.only(bottom: Spacing.x3),
                child: Row(
                  children: <Widget>[
                    Expanded(
                      child: TextFormField(
                        controller: entry.value,
                        decoration: InputDecoration(
                          labelText: 'Option ${entry.key + 1}',
                        ),
                        validator: (String? v) =>
                            v == null || v.trim().isEmpty ? 'Required' : null,
                      ),
                    ),
                    if (_optionCtrls.length > 2)
                      IconButton(
                        icon: const Icon(Icons.remove_circle_outline),
                        color: Colors.red,
                        onPressed: () => _removeOption(entry.key),
                      ),
                  ],
                ),
              );
            }),
            OutlinedButton.icon(
              onPressed: _addOption,
              icon: const Icon(Icons.add),
              label: const Text('Add Option'),
            ),
          ],
        ),
      ),
    );
  }
}