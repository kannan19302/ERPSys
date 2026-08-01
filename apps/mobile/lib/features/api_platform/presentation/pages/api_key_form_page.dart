import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/api_platform.dart';
import '../providers/api_platform_providers.dart';

class ApiKeyFormPage extends ConsumerStatefulWidget {
  const ApiKeyFormPage({this.keyId, super.key});

  static const String routeName = 'api-key-new';
  static const String routeEditName = 'api-key-edit';
  static const String routePath = '/api-platform/keys/new';
  static const String routeEditPath = '/api-platform/keys/:id/edit';

  final String? keyId;

  @override
  ConsumerState<ApiKeyFormPage> createState() => _ApiKeyFormPageState();
}

class _ApiKeyFormPageState extends ConsumerState<ApiKeyFormPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _nameCtrl = TextEditingController();
  final TextEditingController _prefixCtrl = TextEditingController();
  final TextEditingController _rateLimitCtrl = TextEditingController();
  final TextEditingController _scopesCtrl = TextEditingController();
  final TextEditingController _ipWhitelistCtrl = TextEditingController();

  String _status = 'ACTIVE';
  bool _saving = false;

  bool get _isEditing => widget.keyId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) {
      _loadKey();
    }
  }

  Future<void> _loadKey() async {
    final ApiKey? key = ref
        .read(apiKeyDetailProvider(widget.keyId!))
        .valueOrNull;
    if (key != null) {
      _nameCtrl.text = key.name;
      _prefixCtrl.text = key.prefix;
      _rateLimitCtrl.text = key.rateLimit.toString();
      _scopesCtrl.text = key.scopes.join(', ');
      _ipWhitelistCtrl.text = key.ipWhitelist ?? '';
      _status = key.status;
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _prefixCtrl.dispose();
    _rateLimitCtrl.dispose();
    _scopesCtrl.dispose();
    _ipWhitelistCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final Map<String, dynamic> payload = <String, dynamic>{
      'name': _nameCtrl.text.trim(),
      'prefix': _prefixCtrl.text.trim(),
      'rateLimit': int.tryParse(_rateLimitCtrl.text) ?? 60,
      'status': _status,
      'scopes': _scopesCtrl.text.trim().isEmpty
          ? <String>[]
          : _scopesCtrl.text.split(',').map((String s) => s.trim()).where((String s) => s.isNotEmpty).toList(),
      'ipWhitelist': _ipWhitelistCtrl.text.trim().isEmpty ? null : _ipWhitelistCtrl.text.trim(),
    };

    final Result<ApiKey> result = await ref
        .read(apiKeyListControllerProvider.notifier)
        .save(payload, id: widget.keyId);

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
        title: Text(_isEditing ? 'Edit API Key' : 'New API Key'),
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
              controller: _prefixCtrl,
              decoration: const InputDecoration(labelText: 'Prefix *'),
              validator: (String? v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _rateLimitCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Rate Limit',
                helperText: 'Requests per minute (default: 60)',
              ),
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              initialValue: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: const <DropdownMenuItem<String>>[
                DropdownMenuItem<String>(value: 'ACTIVE', child: Text('Active')),
                DropdownMenuItem<String>(value: 'REVOKED', child: Text('Revoked')),
              ],
              onChanged: (String? v) {
                if (v != null) setState(() => _status = v);
              },
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _scopesCtrl,
              decoration: const InputDecoration(
                labelText: 'Scopes',
                helperText: 'Comma-separated: inventory.read, crm.write',
              ),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _ipWhitelistCtrl,
              decoration: const InputDecoration(
                labelText: 'IP Whitelist',
                helperText: 'Comma-separated IPs or CIDR ranges',
              ),
            ),
          ],
        ),
      ),
    );
  }
}
