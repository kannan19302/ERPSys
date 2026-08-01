import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/crm.dart';
import '../providers/crm_providers.dart';

class LeadSourceFormPage extends ConsumerStatefulWidget {
  const LeadSourceFormPage({super.key});

  static const String routeName = 'lead-source-new';
  static const String routePath = '/crm/sources/new';

  @override
  ConsumerState<LeadSourceFormPage> createState() => _LeadSourceFormPageState();
}

class _LeadSourceFormPageState extends ConsumerState<LeadSourceFormPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _nameCtrl = TextEditingController();
  bool _saving = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final String name = _nameCtrl.text.trim();
    final Result<LeadSource> result = await ref
        .read(leadSourcesProvider.notifier)
        .create(name);

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
        title: const Text('New Lead Source'),
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
              autofocus: true,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(labelText: 'Name'),
              validator: (String? v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
            ),
          ],
        ),
      ),
    );
  }
}
