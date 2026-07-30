import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/pwa.dart';
import '../providers/pwa_providers.dart';

class ManifestFormPage extends ConsumerStatefulWidget {
  const ManifestFormPage({super.key});
  static const String routeName = 'manifest-edit';
  static const String routePath = '/pwa/manifest/edit';

  @override
  ConsumerState<ManifestFormPage> createState() => _ManifestFormPageState();
}

class _ManifestFormPageState extends ConsumerState<ManifestFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _appNameCtrl = TextEditingController();
  final _shortNameCtrl = TextEditingController();
  final _themeColorCtrl = TextEditingController();
  final _bgColorCtrl = TextEditingController();
  final _startUrlCtrl = TextEditingController();

  String _displayMode = 'standalone';
  bool _saving = false;

  @override
  void initState() { super.initState(); _loadManifest(); }

  Future<void> _loadManifest() async {
    final config = ref.read(pwaManifestConfigProvider(null)).valueOrNull;
    if (config != null) {
      _appNameCtrl.text = config.appName; _shortNameCtrl.text = config.shortName;
      _themeColorCtrl.text = config.themeColor; _bgColorCtrl.text = config.backgroundColor;
      _startUrlCtrl.text = config.startUrl; _displayMode = config.displayMode;
    }
  }

  @override
  void dispose() { _appNameCtrl.dispose(); _shortNameCtrl.dispose(); _themeColorCtrl.dispose(); _bgColorCtrl.dispose(); _startUrlCtrl.dispose(); super.dispose(); }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final payload = <String, dynamic>{
      'appName': _appNameCtrl.text.trim(), 'shortName': _shortNameCtrl.text.trim(),
      'themeColor': _themeColorCtrl.text.trim(), 'backgroundColor': _bgColorCtrl.text.trim(),
      'displayMode': _displayMode, 'startUrl': _startUrlCtrl.text.trim(),
    };
    final result = await ref.read(pushSubscriptionListControllerProvider.notifier).saveManifest(payload);
    if (!context.mounted) return;
    setState(() => _saving = false);
    result.fold((f) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(f.message))), (_) => Navigator.of(context).pop());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Manifest Config'), actions: [TextButton(onPressed: _saving ? null : _save, child: _saving ? const SizedBox(height: Spacing.x5, width: Spacing.x5, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Save'))]),
      body: Form(key: _formKey, child: ListView(padding: const EdgeInsets.all(Spacing.x4), children: [
        TextFormField(controller: _appNameCtrl, decoration: const InputDecoration(labelText: 'App Name *'), validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null),
        const SizedBox(height: Spacing.x4),
        TextFormField(controller: _shortNameCtrl, decoration: const InputDecoration(labelText: 'Short Name *'), validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null),
        const SizedBox(height: Spacing.x4),
        TextFormField(controller: _startUrlCtrl, decoration: const InputDecoration(labelText: 'Start URL')),
        const SizedBox(height: Spacing.x4),
        Row(children: [
          Expanded(child: TextFormField(controller: _themeColorCtrl, decoration: const InputDecoration(labelText: 'Theme Color', hintText: '#000000'))),
          const SizedBox(width: Spacing.x3),
          Expanded(child: TextFormField(controller: _bgColorCtrl, decoration: const InputDecoration(labelText: 'Background Color', hintText: '#ffffff'))),
        ]),
        const SizedBox(height: Spacing.x4),
        DropdownButtonFormField<String>(value: _displayMode, decoration: const InputDecoration(labelText: 'Display Mode'), items: const [
          DropdownMenuItem(value: 'standalone', child: Text('Standalone')),
          DropdownMenuItem(value: 'fullscreen', child: Text('Fullscreen')),
          DropdownMenuItem(value: 'minimal-ui', child: Text('Minimal UI')),
          DropdownMenuItem(value: 'browser', child: Text('Browser')),
        ], onChanged: (v) { if (v != null) setState(() => _displayMode = v); }),
      ])),
    );
  }
}